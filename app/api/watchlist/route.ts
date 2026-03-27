import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { symbols } from "@/db/schema"

export async function GET() {
  const rows = await db.select().from(symbols).where(eq(symbols.isActive, true)).limit(100)
  return NextResponse.json({ data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })

  const [row] = await db
    .insert(symbols)
    .values({
      ticker: body.ticker,
      name: body.name ?? null,
      exchange: body.exchange ?? null,
      assetType: body.assetType ?? null,
      currency: body.currency ?? "USD",
    })
    .onConflictDoUpdate({ target: symbols.ticker, set: { isActive: true, updatedAt: new Date() } })
    .returning()

  return NextResponse.json({ data: row }, { status: 201 })
}
