import { and, asc, desc, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { trades } from "@/db/schema"

type TradeRow = typeof trades.$inferSelect
type TradeInsert = typeof trades.$inferInsert

export type NormalizedTrade = ReturnType<typeof normalizeTrade>

const numericKeys: Array<keyof TradeRow> = [
  "entryPrice",
  "exitPrice",
  "quantity",
  "stopLoss",
  "takeProfit",
  "riskAmount",
  "profitLoss",
  "profitLossPct",
  "commission",
  "swap",
]

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === "number" ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeTrade(row: TradeRow) {
  const numericValues = Object.fromEntries(
    numericKeys.map((key) => [key, toNumber(row[key])])
  ) as Pick<TradeRow, (typeof numericKeys)[number]>

  return {
    ...row,
    ...numericValues,
    entryTime: row.entryTime instanceof Date ? row.entryTime : new Date(row.entryTime),
    exitTime: row.exitTime ? (row.exitTime instanceof Date ? row.exitTime : new Date(row.exitTime)) : null,
  }
}

export async function getTradesForUser(userId: string) {
  const rows = await db
    .select()
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(asc(trades.entryTime))

  return rows.map(normalizeTrade)
}

export async function getRecentTrades(userId: string, limit = 5) {
  const rows = await db
    .select()
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(desc(trades.entryTime))
    .limit(limit)

  return rows.map(normalizeTrade)
}

export async function getClosedTradesWithPnL(userId: string) {
  const rows = await db
    .select()
    .from(trades)
    .where(and(eq(trades.userId, userId), eq(trades.status, "closed")))
    .orderBy(asc(trades.entryTime))

  return rows.map(normalizeTrade)
}

export interface CreateTradeInput {
  userId: string
  symbol: string
  tradeType: string
  marketType: string
  strategyId?: string | null
  entryPrice: number
  exitPrice?: number | null
  quantity: number
  stopLoss?: number | null
  takeProfit?: number | null
  riskAmount?: number | null
  profitLoss?: number | null
  profitLossPct?: number | null
  entryTime: Date
  exitTime?: Date | null
  status: string
  tradeSetup?: string | null
  tradeOutcome?: string | null
  lessonsLearned?: string | null
  confidenceLevel?: string | null
  emotionalState?: string | null
  marketCondition?: string | null
  newsImpact?: string | null
  additionalNotes?: string | null
  chartScreenshotUrl?: string | null
}

export async function createTrade(data: CreateTradeInput) {
  const payload: TradeInsert = {
    userId: data.userId,
    symbol: data.symbol,
    tradeType: data.tradeType,
    marketType: data.marketType,
    strategyId: data.strategyId ?? null,
    entryPrice: data.entryPrice,
    exitPrice: data.exitPrice ?? null,
    quantity: data.quantity,
    stopLoss: data.stopLoss ?? null,
    takeProfit: data.takeProfit ?? null,
    riskAmount: data.riskAmount ?? null,
    profitLoss: data.profitLoss ?? null,
    profitLossPct: data.profitLossPct ?? null,
    commission: null,
    swap: null,
    entryTime: data.entryTime,
    exitTime: data.exitTime ?? null,
    status: data.status,
    tradeSetup: data.tradeSetup ?? null,
    tradeOutcome: data.tradeOutcome ?? null,
    lessonsLearned: data.lessonsLearned ?? null,
    confidenceLevel: data.confidenceLevel ?? null,
    emotionalState: data.emotionalState ?? null,
    marketCondition: data.marketCondition ?? null,
    newsImpact: data.newsImpact ?? null,
    additionalNotes: data.additionalNotes ?? null,
    chartScreenshotUrl: data.chartScreenshotUrl ?? null,
  }

  const [inserted] = await db.insert(trades).values(payload).returning()
  return normalizeTrade(inserted)
}
