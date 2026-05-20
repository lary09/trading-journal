import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { trades } from "@/db/schema"

const numericFields = new Set([
  "entryPrice",
  "exitPrice",
  "quantity",
  "stopLoss",
  "takeProfit",
  "riskAmount",
  "profitLoss",
  "profitLossPct",
])

const dateFields = new Set(["entryTime", "exitTime"])

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params

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
    if (!(key in body)) continue

    const value = body[key]
    if (numericFields.has(key)) {
      updates[key] = value === null || value === undefined || value === "" ? null : String(value)
      continue
    }

    if (dateFields.has(key)) {
      updates[key] = value ? new Date(value) : null
      continue
    }

    if (key === "symbol") {
      updates[key] = typeof value === "string" ? value.trim().toUpperCase() : value
      continue
    }

    if (key === "strategyId") {
      updates[key] = value || null
      continue
    }

    updates[key] = value
  }
  if (!Object.keys(updates).length) return NextResponse.json({ error: "No updates provided" }, { status: 400 })

  const [updated] = await db
    .update(trades)
    .set(updates)
    .where(and(eq(trades.id, id), eq(trades.userId, userId)))
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
    .delete(trades)
    .where(and(eq(trades.id, id), eq(trades.userId, userId)))
    .returning({ id: trades.id })

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
