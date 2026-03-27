import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { tradingStrategies } from "@/db/schema"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select()
    .from(tradingStrategies)
    .where(eq(tradingStrategies.userId, userId))
    .orderBy(desc(tradingStrategies.createdAt))

  return NextResponse.json({ data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const [inserted] = await db
    .insert(tradingStrategies)
    .values({
      userId,
      name: body.name,
      description: body.description ?? null,
      riskLevel: body.riskLevel ?? null,
      maxRiskPerTrade: body.maxRiskPerTrade ?? null,
      targetProfitRatio: body.targetProfitRatio ?? null,
      isActive: body.isActive ?? true,
    })
    .returning()

  return NextResponse.json({ data: inserted })
}
