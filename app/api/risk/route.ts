import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { riskRules } from "@/db/schema"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const [row] = await db.select().from(riskRules).where(eq(riskRules.userId, userId))
  return NextResponse.json({ rule: row ?? null })
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const payload = {
    userId,
    dailyLossLimit: body.dailyLossLimit ?? null,
    weeklyLossLimit: body.weeklyLossLimit ?? null,
    maxRiskPerTrade: body.maxRiskPerTrade ?? null,
    alertsEnabled: body.alertsEnabled ?? true,
    updatedAt: new Date(),
  }

  const existing = await db.select().from(riskRules).where(eq(riskRules.userId, userId))
  let rule
  if (existing.length) {
    ;[rule] = await db.update(riskRules).set(payload).where(eq(riskRules.userId, userId)).returning()
  } else {
    ;[rule] = await db.insert(riskRules).values(payload).returning()
  }

  return NextResponse.json({ rule })
}
