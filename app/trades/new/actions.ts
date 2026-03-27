"use server"

import { auth } from "@/auth"
import { createTrade } from "@/lib/data/trades"

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

export async function createTradeAction(payload: NewTradePayload) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("User not authenticated")
  }

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
