import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { trades } from "@/db/schema"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })

  const updates: Record<string, any> = {}
  const allowed = [
    "symbol",
    "tradeType",
    "marketType",
    "strategyId",
    "entryPrice",
    "exitPrice",
    "quantity",
    "stopLoss",
    "takeProfit",
    "riskAmount",
    "profitLoss",
    "profitLossPct",
    "entryTime",
    "exitTime",
    "status",
    "tradeSetup",
    "tradeOutcome",
    "lessonsLearned",
    "confidenceLevel",
    "emotionalState",
    "marketCondition",
    "newsImpact",
    "additionalNotes",
    "chartScreenshotUrl",
  ]
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No updates provided" }, { status: 400 })

  const [updated] = await db
    .update(trades)
    .set(updates)
    .where(eq(trades.id, params.id))
    .returning()

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ data: updated })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.delete(trades).where(eq(trades.id, params.id))
  return NextResponse.json({ ok: true })
}
