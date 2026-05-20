import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getTradesForUser } from "@/lib/data/trades"

const escapeCsv = (value: unknown) => {
  if (value === null || value === undefined) return ""
  const text = String(value)
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const trades = await getTradesForUser(userId)

  const headers = [
    "symbol",
    "tradeType",
    "marketType",
    "entryPrice",
    "exitPrice",
    "quantity",
    "entryTime",
    "exitTime",
    "status",
    "profitLoss",
    "profitLossPct",
    "tradeSetup",
    "emotionalState",
    "additionalNotes",
  ]

  const lines = [headers.join(",")]
  for (const trade of trades) {
    lines.push([
      trade.symbol,
      trade.tradeType,
      trade.marketType,
      trade.entryPrice,
      trade.exitPrice,
      trade.quantity,
      trade.entryTime.toISOString(),
      trade.exitTime?.toISOString() ?? "",
      trade.status,
      trade.profitLoss,
      trade.profitLossPct,
      trade.tradeSetup,
      trade.emotionalState,
      trade.additionalNotes,
    ].map(escapeCsv).join(","))
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trades-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
