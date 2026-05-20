import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { ingestionRuns, trades } from "@/db/schema"
import { createTrade } from "@/lib/data/trades"
import { parseImportedTrades } from "@/lib/imports/csv"

export async function POST(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const rows = body?.trades
  const mode = body?.mode === "import" ? "import" : "preview"

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "Trades data array is required and must not be empty" }, { status: 400 })
  }

  const parsedRows = rows.filter((row): row is Record<string, unknown> => row && typeof row === "object" && !Array.isArray(row))
  const { valid, issues } = parseImportedTrades(parsedRows)

  if (mode === "preview") {
    return NextResponse.json({
      ok: true,
      preview: valid.slice(0, 10).map((row) => ({
        symbol: row.symbol,
        tradeType: row.tradeType,
        marketType: row.marketType,
        entryTime: row.entryTime.toISOString(),
        entryPrice: row.entryPrice,
        quantity: row.quantity,
        profitLoss: row.profitLoss,
        status: row.status,
      })),
      summary: {
        totalRows: rows.length,
        validRows: valid.length,
        invalidRows: issues.length,
      },
      issues,
    })
  }

  const run = await db
    .insert(ingestionRuns)
    .values({ userId, source: "csv", status: "processing", rowCount: String(valid.length) })
    .returning()

  const existing = await db
    .select({
      symbol: trades.symbol,
      tradeType: trades.tradeType,
      marketType: trades.marketType,
      entryPrice: trades.entryPrice,
      exitPrice: trades.exitPrice,
      quantity: trades.quantity,
      entryTime: trades.entryTime,
      exitTime: trades.exitTime,
      status: trades.status,
    })
    .from(trades)
    .where(eq(trades.userId, userId))

  const existingFingerprints = new Set(
    existing.map((row) => [
      row.symbol,
      row.tradeType,
      row.marketType,
      Number(row.entryPrice),
      row.exitPrice === null ? "" : Number(row.exitPrice),
      Number(row.quantity),
      new Date(row.entryTime).toISOString(),
      row.exitTime ? new Date(row.exitTime).toISOString() : "",
      row.status,
    ].join("|"))
  )

  let inserted = 0
  let skipped = 0

  for (const row of valid) {
    const key = [
      row.symbol,
      row.tradeType,
      row.marketType,
      row.entryPrice,
      row.exitPrice ?? "",
      row.quantity,
      row.entryTime.toISOString(),
      row.exitTime?.toISOString() ?? "",
      row.status,
    ].join("|")

    if (existingFingerprints.has(key)) {
      skipped++
      continue
    }

    await createTrade({
      userId,
      symbol: row.symbol,
      tradeType: row.tradeType,
      marketType: row.marketType,
      entryPrice: row.entryPrice,
      exitPrice: row.exitPrice,
      quantity: row.quantity,
      entryTime: row.entryTime,
      exitTime: row.exitTime,
      status: row.status,
      profitLoss: row.profitLoss,
    })
    inserted++
    existingFingerprints.add(key)
  }

  await db
    .update(ingestionRuns)
    .set({
      status: issues.length ? "completed_with_errors" : "completed",
      rowCount: String(inserted),
      error: issues.length ? JSON.stringify(issues.slice(0, 20)) : null,
      updatedAt: new Date(),
    })
    .where(eq(ingestionRuns.id, run[0].id))

  return NextResponse.json({
    ok: true,
    inserted,
    skipped,
    invalid: issues.length,
    runId: run[0].id,
    issues,
  })
}
