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
  const rows: any[] = body?.trades

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Trades data array is required and must not be empty" }, { status: 400 })
  }

  const parsed = []
  
  for (const row of rows) {
    // Normalization heuristic: Extract values dynamically based on common CSV headers from brokers.
    const symbolField = row.symbol || row.Symbol || row.ticker || row.Asset || ""
    const entryTimeField = row.entry_time || row.Date || row.time || row["Entry Date"] || row.Date_Time
    const rawPrice = row.entry_price || row.Price || row["Entry Price"]
    const rawQty = row.quantity || row.Qty || row.Quantity || row.Shares
    const rawPnl = row.profit_loss || row.PnL || row.pnl || row.Net_PL || row["Net P&L"]
    
    if (!symbolField || !entryTimeField) continue
    
    // Parse numeric fields safely
    const entryPrice = parseFloat(String(rawPrice || "0").replace(/[^0-9.-]+/g, ""))
    const quantity = parseFloat(String(rawQty || "1").replace(/[^0-9.-]+/g, ""))
    const profitLoss = rawPnl ? parseFloat(String(rawPnl).replace(/[^0-9.-]+/g, "")) : null

    if (!Number.isFinite(entryPrice) || !Number.isFinite(quantity)) continue

    parsed.push({
      userId,
      symbol: String(symbolField).trim().toUpperCase(),
      tradeType: String(row.trade_type || row.Type || row["Trade Type"] || "buy").toLowerCase().includes("sell") ? "short" : "long",
      marketType: String(row.market_type || row.Market || "stocks").toLowerCase(),
      entryPrice: entryPrice.toString(),
      exitPrice: row.exit_price ? parseFloat(String(row.exit_price).replace(/[^0-9.-]+/g, "")).toString() : null,
      quantity: quantity.toString(),
      entryTime: new Date(entryTimeField),
      exitTime: row.exit_time ? new Date(row.exit_time) : null,
      status: row.status ? String(row.status).toLowerCase() : (profitLoss !== null ? "closed" : "open"),
      profitLoss: profitLoss !== null ? profitLoss.toString() : null,
    })
  }

  const run = await db
    .insert(ingestionRuns)
    .values({ userId, source: "csv", status: "processing", rowCount: String(parsed.length) })
    .returning()

  if (parsed.length > 0) {
    await db.insert(trades).values(parsed).onConflictDoNothing()
  }

  await db
    .update(ingestionRuns)
    .set({ status: "completed", rowCount: String(parsed.length), updatedAt: new Date() })
    .where(eq(ingestionRuns.id, run[0].id))

  return NextResponse.json({ ok: true, inserted: parsed.length, runId: run[0].id })
}
