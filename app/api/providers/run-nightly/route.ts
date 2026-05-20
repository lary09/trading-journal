import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { symbols, watchlistItems } from "@/db/schema"
import { ingestTiingoDaily } from "@/lib/providers/tiingo"
import { ingestPolygonDaily } from "@/lib/providers/polygon"

// Simple placeholder to be triggered by external cron
export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const watchlist = await db
    .select({ ticker: symbols.ticker })
    .from(watchlistItems)
    .innerJoin(symbols, eq(watchlistItems.symbolId, symbols.id))
    .where(eq(watchlistItems.userId, userId))

  if (watchlist.length === 0) {
    return NextResponse.json({ error: "Watchlist is empty" }, { status: 400 })
  }

  const results = []
  for (const { ticker } of watchlist) {
    try {
      const resT = await ingestTiingoDaily(ticker)
      let resP: any = null
      try {
        resP = await ingestPolygonDaily(ticker)
      } catch (e) {
        resP = { error: e instanceof Error ? e.message : "polygon failed" }
      }
      results.push({ ticker, tiingo: resT, polygon: resP })
    } catch (error) {
      results.push({ ticker, error: error instanceof Error ? error.message : "ingest failed" })
    }
  }

  return NextResponse.json({ ok: true, results })
}
