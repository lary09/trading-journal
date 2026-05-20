import { createHash } from "crypto"

export type ParsedImportTrade = {
  symbol: string
  tradeType: string
  marketType: string
  entryPrice: number
  exitPrice: number | null
  quantity: number
  entryTime: Date
  exitTime: Date | null
  status: string
  profitLoss: number | null
  raw: Record<string, unknown>
  fingerprint: string
}

export type ImportIssue = {
  row: number
  error: string
}

const readField = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") return value
  }
  return null
}

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") return null
  const parsed = Number.parseFloat(String(value).replace(/[^0-9.-]+/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}

const parseDate = (value: unknown) => {
  if (value === null || value === undefined || String(value).trim() === "") return null
  const parsed = new Date(String(value))
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const normalizeTradeType = (value: unknown) => {
  const raw = String(value ?? "buy").trim().toLowerCase()
  if (["sell", "short"].some((keyword) => raw.includes(keyword))) return "short"
  return "long"
}

const normalizeMarketType = (value: unknown) => {
  const raw = String(value ?? "stocks").trim().toLowerCase()
  if (!raw) return "stocks"
  if (raw === "stock") return "stocks"
  if (raw === "forex") return "fx"
  return raw
}

const createFingerprint = (trade: Omit<ParsedImportTrade, "fingerprint" | "raw">) => {
  const hash = createHash("sha256")
  hash.update([
    trade.symbol,
    trade.tradeType,
    trade.marketType,
    trade.entryPrice,
    trade.exitPrice ?? "",
    trade.quantity,
    trade.entryTime.toISOString(),
    trade.exitTime?.toISOString() ?? "",
    trade.status,
  ].join("|"))
  return hash.digest("hex")
}

export function parseImportedTrades(rows: Record<string, unknown>[]) {
  const valid: ParsedImportTrade[] = []
  const issues: ImportIssue[] = []

  rows.forEach((row, index) => {
    const symbol = readField(row, ["symbol", "Symbol", "ticker", "Ticker", "Asset"])
    const entryTime = readField(row, ["entry_time", "Entry Time", "Date", "time", "Entry Date", "Date_Time"])
    const entryPrice = readField(row, ["entry_price", "Entry Price", "Price"])
    const quantity = readField(row, ["quantity", "Qty", "Quantity", "Shares"])
    const exitPrice = readField(row, ["exit_price", "Exit Price"])
    const exitTime = readField(row, ["exit_time", "Exit Time"])
    const profitLoss = readField(row, ["profit_loss", "PnL", "pnl", "Net_PL", "Net P&L"])

    if (!symbol) {
      issues.push({ row: index + 1, error: "Missing symbol" })
      return
    }

    const parsedEntryTime = parseDate(entryTime)
    if (!parsedEntryTime) {
      issues.push({ row: index + 1, error: "Missing or invalid entry time" })
      return
    }

    const parsedEntryPrice = parseNumber(entryPrice)
    if (parsedEntryPrice === null || parsedEntryPrice <= 0) {
      issues.push({ row: index + 1, error: "Missing or invalid entry price" })
      return
    }

    const parsedQuantity = parseNumber(quantity)
    if (parsedQuantity === null || parsedQuantity <= 0) {
      issues.push({ row: index + 1, error: "Missing or invalid quantity" })
      return
    }

    const normalized = {
      symbol: String(symbol).trim().toUpperCase(),
      tradeType: normalizeTradeType(readField(row, ["trade_type", "Trade Type", "Type", "Side"])),
      marketType: normalizeMarketType(readField(row, ["market_type", "Market", "Asset Class"])),
      entryPrice: parsedEntryPrice,
      exitPrice: parseNumber(exitPrice),
      quantity: parsedQuantity,
      entryTime: parsedEntryTime,
      exitTime: parseDate(exitTime),
      status: String(readField(row, ["status", "Status"]) ?? (profitLoss ? "closed" : "open")).trim().toLowerCase(),
      profitLoss: parseNumber(profitLoss),
      raw: row,
    }

    valid.push({
      ...normalized,
      fingerprint: createFingerprint(normalized),
    })
  })

  return { valid, issues }
}
