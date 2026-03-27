import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { bars1d, symbols } from "@/db/schema"

type TiingoBar = {
  date: string
  open: number
  high: number
  low: number
  close: number
  adjClose?: number
  volume: number
  divCash?: number
  splitFactor?: number
}

export async function ingestTiingoDaily(ticker: string, start?: string, end?: string) {
  const apiKey = process.env.TIINGO_API_KEY
  if (!apiKey) throw new Error("TIINGO_API_KEY missing")

  const url = new URL(`https://api.tiingo.com/tiingo/daily/${ticker}/prices`)
  if (start) url.searchParams.set("startDate", start)
  if (end) url.searchParams.set("endDate", end)
  url.searchParams.set("token", apiKey)

  const res = await fetch(url.toString(), { next: { revalidate: 0 } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Tiingo error: ${res.status} ${text}`)
  }

  const json = (await res.json()) as TiingoBar[]
  if (!json.length) return { inserted: 0 }

  // Upsert symbol
  let symbolId: string | undefined

  const existing = await db.select().from(symbols).where(eq(symbols.ticker, ticker)).limit(1)
  if (existing.length) {
    symbolId = existing[0].id
  } else {
    const inserted =
      (await db
        .insert(symbols)
        .values({
          ticker,
          name: ticker,
          exchange: null,
          assetType: "equity",
        })
        .onConflictDoNothing()
        .returning()) ?? []
    if (inserted.length) symbolId = inserted[0].id
  }

  if (!symbolId) {
    const fetched = await db.select().from(symbols).where(eq(symbols.ticker, ticker)).limit(1)
    symbolId = fetched[0]?.id
  }

  if (!symbolId) throw new Error("Could not resolve symbol id for " + ticker)

  const values = json.map((bar) => ({
    symbolId,
    tradingDay: bar.date.split("T")[0],
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: bar.volume ?? null,
    vwap: null,
  }))

  const inserted = await db.insert(bars1d).values(values).onConflictDoNothing().returning()
  return { inserted: inserted.length }
}
