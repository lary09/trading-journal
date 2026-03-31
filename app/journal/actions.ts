"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/db/client"
import { dailyJournals } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function saveJournalNote(dateStr: string, notes: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Ensure dateStr is valid (e.g. "2024-03-20")
  const dateObj = new Date(dateStr)
  if (isNaN(dateObj.getTime())) throw new Error("Invalid date")

  // Upsert logic using standard insert/onConflictDoUpdate or just check and update
  const existing = await db
    .select()
    .from(dailyJournals)
    .where(and(eq(dailyJournals.userId, session.user.id), eq(dailyJournals.tradingDay, dateStr)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(dailyJournals)
      .set({ notes, updatedAt: new Date() })
      .where(eq(dailyJournals.id, existing[0].id))
  } else {
    await db.insert(dailyJournals).values({
      userId: session.user.id,
      tradingDay: dateStr,
      notes,
    })
  }

  revalidatePath("/journal")
  return { success: true }
}
