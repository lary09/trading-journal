import { auth } from "@/auth"
import { redirect } from "next/navigation"
import type { Session } from "next-auth"

export async function getSession(): Promise<Session | null> {
  return await auth()
}

export async function requireSession(redirectTo?: string): Promise<Session> {
  const session = await auth()

  if (!session?.user) {
    redirect(redirectTo ?? "/auth/login")
  }

  return session
}
