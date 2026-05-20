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

const toNumber = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null
  const parsed = typeof value === "number" ? value : Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
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
      eq(symbols.ticker, symbol.toUpperCase()),
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
