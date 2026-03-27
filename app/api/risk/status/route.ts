import { NextResponse } from "next/server"
import { and, eq, gte } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { trades, riskRules } from "@/db/schema"

const startOfUtcDay = () => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}
const startOfUtcWeek = () => {
  const d = startOfUtcDay()
  const day = d.getUTCDay() // 0 = Sunday
  d.setUTCDate(d.getUTCDate() - day)
  return d
}

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [rule] = await db.select().from(riskRules).where(eq(riskRules.userId, userId))

  const dailyStart = startOfUtcDay()
  const weeklyStart = startOfUtcWeek()

  const rows = await db
    .select({ profitLoss: trades.profitLoss, entryTime: trades.entryTime })
    .from(trades)
    .where(and(eq(trades.userId, userId), gte(trades.entryTime, weeklyStart)))

  const dailyPnl = rows
    .filter((t) => new Date(t.entryTime).getTime() >= dailyStart.getTime())
    .reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)
  const weeklyPnl = rows.reduce((acc, t) => acc + Number(t.profitLoss ?? 0), 0)

  return NextResponse.json({
    rule: rule ?? null,
    dailyPnl,
    weeklyPnl,
    breaches: {
      daily: rule?.dailyLossLimit ? dailyPnl <= -Number(rule.dailyLossLimit) : false,
      weekly: rule?.weeklyLossLimit ? weeklyPnl <= -Number(rule.weeklyLossLimit) : false,
    },
  })
}
