import { and, asc, eq, gte, lte, desc } from "drizzle-orm"

import { db } from "@/db/client"
import { bars1d, symbols } from "@/db/schema"

export type CandlestickPoint = {
  time: string
  open: number
  high: number
  low: number
  close: number
}

type BarSource = "local" | "yahoo"

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === "number" ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeTickerForLookup(symbol: string) {
  return symbol.trim().toUpperCase()
}

function normalizeYahooSymbol(symbol: string) {
  return normalizeTickerForLookup(symbol).replace(/\s+/g, "").replace("/", "-")
}

export async function getYahooDailyBars(symbol: string, start: Date, end: Date) {
  const period1 = Math.floor(start.getTime() / 1000)
  const period2 = Math.floor(end.getTime() / 1000) + 86400
  const yahooSymbol = normalizeYahooSymbol(symbol)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&period1=${period1}&period2=${period2}`

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) return []

  const json = await res.json().catch(() => null)
  const result = json?.chart?.result?.[0]
  if (!result?.timestamp?.length) return []

  const timestamps = result.timestamp as number[]
  const quote = result.indicators?.quote?.[0]
  if (!quote) return []

  return timestamps
    .map((timestamp, index) => {
      const open = toNumber(quote.open?.[index])
      const high = toNumber(quote.high?.[index])
      const low = toNumber(quote.low?.[index])
      const close = toNumber(quote.close?.[index])

      if (open === null || high === null || low === null || close === null) return null

      return {
        time: new Date(timestamp * 1000).toISOString().split("T")[0],
        open,
        high,
        low,
        close,
      }
    })
    .filter((row): row is CandlestickPoint => row !== null)
}

export async function getBarsForSymbol(symbol: string, start: Date, end: Date) {
  const rows = await db
    .select({
      tradingDay: bars1d.tradingDay,
      open: bars1d.open,
      high: bars1d.high,
      low: bars1d.low,
      close: bars1d.close,
    })
    .from(bars1d)
    .innerJoin(symbols, eq(bars1d.symbolId, symbols.id))
    .where(and(
      eq(symbols.ticker, normalizeTickerForLookup(symbol)),
      gte(bars1d.tradingDay, start.toISOString().slice(0, 10)),
      lte(bars1d.tradingDay, end.toISOString().slice(0, 10)),
    ))
    .orderBy(asc(bars1d.tradingDay))

  return rows
    .map((row) => ({
      time: row.tradingDay,
      open: toNumber(row.open),
      high: toNumber(row.high),
      low: toNumber(row.low),
      close: toNumber(row.close),
    }))
    .filter((row): row is CandlestickPoint => row.open !== null && row.high !== null && row.low !== null && row.close !== null)
}

export async function getBarsForSymbolWithFallback(symbol: string, start: Date, end: Date): Promise<{ bars: CandlestickPoint[]; source: BarSource }> {
  const localBars = await getBarsForSymbol(symbol, start, end)
  if (localBars.length > 0) return { bars: localBars, source: "local" }

  const yahooBars = await getYahooDailyBars(symbol, start, end)
  return { bars: yahooBars, source: "yahoo" }
}

export async function getLatestBarsForSymbols(symbolList: string[]) {
  const tickers = Array.from(new Set(symbolList.map((symbol) => symbol.trim().toUpperCase()).filter(Boolean)))
  const results = await Promise.all(
    tickers.map(async (ticker) => {
      const [row] = await db
        .select({
          ticker: symbols.ticker,
          tradingDay: bars1d.tradingDay,
          close: bars1d.close,
        })
        .from(bars1d)
        .innerJoin(symbols, eq(bars1d.symbolId, symbols.id))
        .where(eq(symbols.ticker, ticker))
        .orderBy(desc(bars1d.tradingDay))
        .limit(1)

      return row
        ? {
            ticker: row.ticker,
            tradingDay: row.tradingDay,
            close: toNumber(row.close),
          }
        : null
    })
  )

  return results.filter((row): row is NonNullable<typeof row> => row !== null)
}
