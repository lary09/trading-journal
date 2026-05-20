import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { tradingStrategies } from "@/db/schema"

const normalizeOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? String(parsed) : null
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const { id } = await params
  const [updated] = await db
    .update(tradingStrategies)
    .set({
      name: body.name ? String(body.name).trim() : undefined,
      description: body.description ?? undefined,
      riskLevel: body.riskLevel ?? undefined,
      maxRiskPerTrade: body.maxRiskPerTrade !== undefined ? normalizeOptionalNumber(body.maxRiskPerTrade) : undefined,
      targetProfitRatio: body.targetProfitRatio !== undefined ? normalizeOptionalNumber(body.targetProfitRatio) : undefined,
      isActive: body.isActive ?? undefined,
      updatedAt: new Date(),
    })
    .where(and(eq(tradingStrategies.id, id), eq(tradingStrategies.userId, userId)))
    .returning()

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const [deleted] = await db
    .delete(tradingStrategies)
    .where(and(eq(tradingStrategies.id, id), eq(tradingStrategies.userId, userId)))
    .returning({ id: tradingStrategies.id })

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
