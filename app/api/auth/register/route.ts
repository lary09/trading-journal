import { NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/db/client"
import { users } from "@/db/schema"
import { hashPassword } from "@/lib/auth/password"
import { upsertProfile } from "@/lib/data/profiles"

const registerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  tradingExperience: z.string().trim().min(1, "Please select your trading experience level"),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, { status: 400 })
  }

  const { email, fullName, password, tradingExperience } = parsed.data
  const passwordHash = await hashPassword(password)

  const [user] = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email,
      passwordHash,
      name: fullName,
    })
    .onConflictDoNothing({ target: users.email })
    .returning({ id: users.id })

  if (!user) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 })
  }

  await upsertProfile(user.id, {
    fullName,
    tradingExperience,
  })

  return NextResponse.json({ ok: true })
}

export const runtime = "nodejs"
