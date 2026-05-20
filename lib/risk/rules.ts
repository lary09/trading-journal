import { and, eq, gte } from "drizzle-orm"

import { db } from "@/db/client"
import { riskRules, trades } from "@/db/schema"

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

export async function getRiskRule(userId: string) {
  const [rule] = await db.select().from(riskRules).where(eq(riskRules.userId, userId))
  return rule ?? null
}

export async function getRiskStatus(userId: string) {
  const rule = await getRiskRule(userId)
  const dailyStart = startOfUtcDay()
  const weeklyStart = startOfUtcWeek()

  const rows = await db
    .select({ profitLoss: trades.profitLoss, entryTime: trades.entryTime })
    .from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.status, "closed"), gte(trades.entryTime, weeklyStart)))

  const dailyPnl = rows
    .filter((t) => new Date(t.entryTime).getTime() >= dailyStart.getTime())
    .reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)

  const weeklyPnl = rows.reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)

  return {
    rule,
    dailyPnl,
    weeklyPnl,
    breaches: {
      daily: rule?.dailyLossLimit ? dailyPnl <= -Number(rule.dailyLossLimit) : false,
      weekly: rule?.weeklyLossLimit ? weeklyPnl <= -Number(rule.weeklyLossLimit) : false,
    },
  }
}

export async function enforceRiskLimits(userId: string, incomingPnl: number) {
  const status = await getRiskStatus(userId)
  const rule = status.rule
  if (!rule?.alertsEnabled) return

  const projectedDailyPnl = status.dailyPnl + incomingPnl
  const projectedWeeklyPnl = status.weeklyPnl + incomingPnl

  if (rule.dailyLossLimit && projectedDailyPnl <= -Number(rule.dailyLossLimit)) {
    throw new Error(`RIESGO: Límite Diario Alcanzado. P&L proyectado: $${projectedDailyPnl.toFixed(2)}. Límite: -$${rule.dailyLossLimit}. Operación bloqueada.`)
  }

  if (rule.weeklyLossLimit && projectedWeeklyPnl <= -Number(rule.weeklyLossLimit)) {
    throw new Error(`RIESGO: Límite Semanal Alcanzado. P&L proyectado: $${projectedWeeklyPnl.toFixed(2)}. Límite: -$${rule.weeklyLossLimit}. Operación bloqueada.`)
  }
}
