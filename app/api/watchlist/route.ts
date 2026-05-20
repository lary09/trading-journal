import { NextResponse } from "next/server"
import { and, eq } from "drizzle-orm"

import { auth } from "@/auth"
import { db } from "@/db/client"
import { symbols, watchlistItems } from "@/db/schema"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await db
    .select({
      id: watchlistItems.id,
      symbolId: symbols.id,
      ticker: symbols.ticker,
      name: symbols.name,
      exchange: symbols.exchange,
      assetType: symbols.assetType,
      currency: symbols.currency,
      isActive: symbols.isActive,
      createdAt: watchlistItems.createdAt,
    })
    .from(watchlistItems)
    .innerJoin(symbols, eq(watchlistItems.symbolId, symbols.id))
    .where(eq(watchlistItems.userId, userId))

  return NextResponse.json({ data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 })

  const ticker = String(body.ticker).trim().toUpperCase()

  const [symbolRow] = await db
    .insert(symbols)
    .values({
      ticker,
      name: body.name ?? null,
      exchange: body.exchange ?? null,
      assetType: body.assetType ?? null,
      currency: body.currency ?? "USD",
    })
    .onConflictDoUpdate({
      target: symbols.ticker,
      set: {
        name: body.name ?? null,
        exchange: body.exchange ?? null,
        assetType: body.assetType ?? null,
        currency: body.currency ?? "USD",
        isActive: true,
        updatedAt: new Date(),
      },
    })
    .returning()

  const [watchlistRow] = await db
    .insert(watchlistItems)
    .values({
      userId: session.user.id,
      symbolId: symbolRow.id,
    })
    .onConflictDoNothing()
    .returning({ id: watchlistItems.id })

  const watchlistId = watchlistRow?.id ?? (
    await db
      .select({ id: watchlistItems.id })
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, session.user.id), eq(watchlistItems.symbolId, symbolRow.id)))
      .limit(1)
  )[0]?.id

  return NextResponse.json({
    data: {
      id: watchlistId,
      symbolId: symbolRow.id,
      ticker: symbolRow.ticker,
      name: symbolRow.name,
      exchange: symbolRow.exchange,
      assetType: symbolRow.assetType,
      currency: symbolRow.currency,
      isActive: symbolRow.isActive,
    },
  }, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const [deleted] = await db
    .delete(watchlistItems)
    .where(and(eq(watchlistItems.id, id), eq(watchlistItems.userId, userId)))
    .returning({ id: watchlistItems.id })

  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ ok: true })
}
