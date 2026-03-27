import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { ingestionRuns, trades } from "@/db/schema"
import { eq } from "drizzle-orm"

type Mapping = {
  symbol: string
  entryTime: string
  tradeType: string
  marketType: string
  quantity: string
  entryPrice: string
  exitPrice?: string
  status?: string
  profitLoss?: string
}

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const contentType = req.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    return NextResponse.json({ error: "Content-Type must be application/json" }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  const csv: string | undefined = body?.csv
  const mapping: Mapping | undefined = body?.mapping

  if (!csv || !mapping) {
    return NextResponse.json({ error: "csv and mapping are required" }, { status: 400 })
  }

  const lines = csv
    .split(/\r?\n/)
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0)

  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV needs header and at least one row" }, { status: 400 })
  }

  const header = lines[0].split(",").map((h) => h.trim())
  const rows = lines.slice(1).map((line) => line.split(",").map((v) => v.trim()))

  const col = (name: string) => {
    const idx = header.findIndex((h) => h.toLowerCase() === name.toLowerCase())
    return idx >= 0 ? idx : -1
  }

  const idx = {
    symbol: col(mapping.symbol),
    entryTime: col(mapping.entryTime),
    tradeType: col(mapping.tradeType),
    marketType: col(mapping.marketType),
    quantity: col(mapping.quantity),
    entryPrice: col(mapping.entryPrice),
    exitPrice: mapping.exitPrice ? col(mapping.exitPrice) : -1,
    status: mapping.status ? col(mapping.status) : -1,
    profitLoss: mapping.profitLoss ? col(mapping.profitLoss) : -1,
  }

  if (Object.values(idx).some((v) => v === -1 && !Number.isNaN(v))) {
    return NextResponse.json({ error: "Mapping columns not found in CSV header" }, { status: 400 })
  }

  const parsed = []
  for (const r of rows) {
    const safe = (i: number) => (i >= 0 && i < r.length ? r[i] : "")
    const entryPrice = Number.parseFloat(safe(idx.entryPrice))
    const quantity = Number.parseFloat(safe(idx.quantity))
    if (!safe(idx.symbol) || !Number.isFinite(entryPrice) || !Number.isFinite(quantity)) continue
    parsed.push({
      userId,
      symbol: safe(idx.symbol).toUpperCase(),
      tradeType: safe(idx.tradeType) || "buy",
      marketType: safe(idx.marketType) || "stocks",
      entryPrice,
      exitPrice: idx.exitPrice >= 0 ? Number.parseFloat(safe(idx.exitPrice)) || null : null,
      quantity,
      entryTime: new Date(safe(idx.entryTime) || Date.now()),
      exitTime: null,
      status: idx.status >= 0 ? safe(idx.status) || "open" : "open",
      profitLoss: idx.profitLoss >= 0 ? Number.parseFloat(safe(idx.profitLoss)) || null : null,
    })
  }

  const run = await db
    .insert(ingestionRuns)
    .values({ userId, source: "csv", status: "processing", rowCount: parsed.length })
    .returning()

  if (parsed.length) {
    await db.insert(trades).values(parsed).onConflictDoNothing()
  }

  await db
    .update(ingestionRuns)
    .set({ status: "completed", rowCount: parsed.length, updatedAt: new Date() })
    .where(eq(ingestionRuns.id, run[0].id))

  return NextResponse.json({ ok: true, inserted: parsed.length, runId: run[0].id, preview: parsed.slice(0, 5) })
}
