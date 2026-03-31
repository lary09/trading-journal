"use server"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { riskRules, trades } from "@/db/schema"
import { createTrade } from "@/lib/data/trades"
import { and, eq, gte } from "drizzle-orm"

export interface NewTradePayload {
  symbol: string
  tradeType: string
  marketType: string
  strategyId?: string
  entryPrice: string
  exitPrice?: string
  quantity: string
  stopLoss?: string
  takeProfit?: string
  riskAmount?: string
  entryTime: string
  exitTime?: string
  tradeSetup?: string
  tradeOutcome?: string
  lessonsLearned?: string
  confidenceLevel?: string
  emotionalState?: string
  marketCondition?: string
  newsImpact?: string
  additionalNotes?: string
  isTradeOpen: boolean
}

const toNumber = (value?: string | null) => {
  if (!value) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

const toDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const calculateProfitLoss = (entryPrice: number, exitPrice: number, quantity: number, tradeType: string) => {
  if (tradeType === "buy" || tradeType === "long") {
    return (exitPrice - entryPrice) * quantity
  }
  return (entryPrice - exitPrice) * quantity
}

const startOfUtcDay = () => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

const startOfUtcWeek = () => {
  const d = startOfUtcDay()
  const day = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - day)
  return d
}

export async function createTradeAction(payload: NewTradePayload) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("User not authenticated")
  }
  
  const userId = session.user.id

  const entryPrice = Number.parseFloat(payload.entryPrice)
  const quantity = Number.parseFloat(payload.quantity)

  if (!Number.isFinite(entryPrice) || !Number.isFinite(quantity)) {
    throw new Error("Entry price and quantity are required")
  }

  const exitPrice =
    !payload.isTradeOpen && payload.exitPrice ? Number.parseFloat(payload.exitPrice) : null

  const profitLoss =
    !payload.isTradeOpen && exitPrice !== null
      ? calculateProfitLoss(entryPrice, exitPrice, quantity, payload.tradeType)
      : null

  // Risk Enforcement Block
  const [rule] = await db.select().from(riskRules).where(eq(riskRules.userId, userId))
  if (rule?.alertsEnabled) {
    const dailyStart = startOfUtcDay()
    const weeklyStart = startOfUtcWeek()
    const rows = await db
      .select({ profitLoss: trades.profitLoss, entryTime: trades.entryTime })
      .from(trades)
      .where(and(eq(trades.userId, userId), eq(trades.status, "closed"), gte(trades.entryTime, weeklyStart)))

    const currentDailyPnl = rows
      .filter((t) => new Date(t.entryTime).getTime() >= dailyStart.getTime())
      .reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)
    
    const currentWeeklyPnl = rows.reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)

    // Consider the PnL of the incoming trade if it's already closed
    const incomingPnl = profitLoss ?? 0
    const projectedDailyPnl = currentDailyPnl + incomingPnl
    const projectedWeeklyPnl = currentWeeklyPnl + incomingPnl

    if (rule.dailyLossLimit && projectedDailyPnl <= -Number(rule.dailyLossLimit)) {
      throw new Error(`RIESGO: Límite Diario Alcanzado. P&L proyectado: $${projectedDailyPnl.toFixed(2)}. Límite: -$${rule.dailyLossLimit}. Operación bloqueada.`)
    }
    if (rule.weeklyLossLimit && projectedWeeklyPnl <= -Number(rule.weeklyLossLimit)) {
      throw new Error(`RIESGO: Límite Semanal Alcanzado. P&L proyectado: $${projectedWeeklyPnl.toFixed(2)}. Límite: -$${rule.weeklyLossLimit}. Operación bloqueada.`)
    }
  }

  const profitLossPct =
    !payload.isTradeOpen && exitPrice !== null
      ? ((exitPrice - entryPrice) / entryPrice) * (payload.tradeType === "buy" || payload.tradeType === "long" ? 100 : -100)
      : null

  await createTrade({
    userId: session.user.id,
    symbol: payload.symbol.trim().toUpperCase(),
    tradeType: payload.tradeType,
    marketType: payload.marketType,
    strategyId: payload.strategyId || null,
    entryPrice,
    exitPrice,
    quantity,
    stopLoss: toNumber(payload.stopLoss),
    takeProfit: toNumber(payload.takeProfit),
    riskAmount: toNumber(payload.riskAmount),
    profitLoss,
    profitLossPct,
    entryTime: toDate(payload.entryTime) ?? new Date(),
    exitTime: payload.isTradeOpen ? null : toDate(payload.exitTime),
    status: payload.isTradeOpen ? "open" : "closed",
    tradeSetup: payload.tradeSetup || null,
    tradeOutcome: payload.tradeOutcome || null,
    lessonsLearned: payload.lessonsLearned || null,
    confidenceLevel: payload.confidenceLevel || null,
    emotionalState: payload.emotionalState || null,
    marketCondition: payload.marketCondition || null,
    newsImpact: payload.newsImpact || null,
    additionalNotes: payload.additionalNotes || null,
  })
}
