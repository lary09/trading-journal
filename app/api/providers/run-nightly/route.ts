import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { ingestTiingoDaily } from "@/lib/providers/tiingo"
import { ingestPolygonDaily } from "@/lib/providers/polygon"

// Simple placeholder to be triggered by external cron
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const watchlist = ["AAPL", "MSFT", "NVDA"]
  const results = []
  for (const ticker of watchlist) {
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
