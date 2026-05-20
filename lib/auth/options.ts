import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import { eq } from "drizzle-orm"

import { db } from "@/db/client"
import { users } from "@/db/schema"
import { verifyPassword } from "@/lib/auth/password"
import { customDrizzleAdapter } from "./custom-adapter"

const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? ""
const isLocalAuthUrl = authUrl.includes("localhost") || authUrl.includes("127.0.0.1")

export const authOptions: NextAuthConfig = {
  adapter: customDrizzleAdapter(),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: process.env.NODE_ENV !== "production" || process.env.AUTH_TRUST_HOST === "true" || isLocalAuthUrl,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase()
        const password = credentials?.password?.toString()

        if (!email || !password) return null

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
        if (!user?.passwordHash) return null

        const isValid = await verifyPassword(password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
        ? [
            GitHub({
              clientId: process.env.GITHUB_ID,
              clientSecret: process.env.GITHUB_SECRET,
            }),
          ]
        : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id
      }

      return token
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }

      return session
    },
  },
  pages: {
    signIn: "/auth/login",
  },
}
