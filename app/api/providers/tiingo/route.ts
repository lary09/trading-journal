import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { ingestTiingoDaily } from "@/lib/providers/tiingo"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const ticker = body?.symbol ?? body?.ticker
  const start = body?.start
  const end = body?.end

  if (!ticker) {
    return NextResponse.json({ error: "symbol is required" }, { status: 400 })
  }

  try {
    const result = await ingestTiingoDaily(ticker, start, end)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ingest failed" }, { status: 500 })
  }
}
