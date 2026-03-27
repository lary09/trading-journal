import { and, eq } from "drizzle-orm"

import { db } from "@/db/client"
import { tradingStrategies } from "@/db/schema"

export type Strategy = typeof tradingStrategies.$inferSelect

export async function getActiveStrategies(userId: string) {
  const rows = await db
    .select({
      id: tradingStrategies.id,
      name: tradingStrategies.name,
      description: tradingStrategies.description,
      riskLevel: tradingStrategies.riskLevel,
    })
    .from(tradingStrategies)
    .where(and(eq(tradingStrategies.userId, userId), eq(tradingStrategies.isActive, true)))
    .orderBy(tradingStrategies.createdAt)

  return rows
}

export async function getStrategyById(userId: string, strategyId: string) {
  const [row] = await db
    .select()
    .from(tradingStrategies)
    .where(and(eq(tradingStrategies.userId, userId), eq(tradingStrategies.id, strategyId)))
    .limit(1)

  return row ?? null
}
