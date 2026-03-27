import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { profiles } from "@/db/schema"

export type Profile = typeof profiles.$inferSelect

export async function getProfile(userId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1)
  return profile ?? null
}

export async function upsertProfile(userId: string, updates: Partial<Omit<Profile, "id">>) {
  const [profile] = await db
    .insert(profiles)
    .values({ id: userId, ...updates })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        ...updates,
        updatedAt: new Date(),
      },
    })
    .returning()

  return profile
}
