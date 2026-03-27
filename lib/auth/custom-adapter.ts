import { and, eq } from "drizzle-orm"
import type { Adapter } from "next-auth/adapters"

import { db } from "@/db/client"
import { accounts, sessions, users, verificationTokens, authenticators } from "@/db/schema"

export function customDrizzleAdapter(): Adapter {
  return {
    createUser: async (data) => {
      const [row] = await db.insert(users).values({
        id: data.id ?? crypto.randomUUID(),
        email: data.email,
        name: data.name,
        image: data.image,
      }).returning()
      return row
    },
    getUser: async (id) => {
      const [row] = await db.select().from(users).where(eq(users.id, id))
      return row ?? null
    },
    getUserByEmail: async (email) => {
      const [row] = await db.select().from(users).where(eq(users.email, email))
      return row ?? null
    },
    getUserByAccount: async ({ provider, providerAccountId }) => {
      const rows = await db
        .select({ userId: accounts.userId })
        .from(accounts)
        .where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
      if (!rows.length) return null
      const [userRow] = await db.select().from(users).where(eq(users.id, rows[0].userId))
      return userRow ?? null
    },
    updateUser: async (data) => {
      const [row] = await db.update(users).set({
        name: data.name ?? null,
        email: data.email,
        image: data.image ?? null,
      }).where(eq(users.id, data.id!)).returning()
      return row!
    },
    deleteUser: async (id) => {
      await db.delete(users).where(eq(users.id, id))
    },
    linkAccount: async (acc) => {
      await db.insert(accounts).values({
        userId: acc.userId,
        type: acc.type,
        provider: acc.provider,
        providerAccountId: acc.providerAccountId,
        refreshToken: acc.refresh_token ?? null,
        accessToken: acc.access_token ?? null,
        expiresAt: acc.expires_at ?? null,
        tokenType: acc.token_type ?? null,
        scope: acc.scope ?? null,
        idToken: acc.id_token ?? null,
        sessionState: acc.session_state ?? null,
      })
      return acc
    },
    unlinkAccount: async ({ provider, providerAccountId }) => {
      await db.delete(accounts).where(and(eq(accounts.provider, provider), eq(accounts.providerAccountId, providerAccountId)))
    },
    createSession: async (session) => {
      const [row] = await db.insert(sessions).values({
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      }).returning()
      return row
    },
    getSessionAndUser: async (sessionToken) => {
      const rows = await db
        .select({ session: sessions, user: users })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.sessionToken, sessionToken))
      if (!rows.length) return null
      return { session: rows[0].session, user: rows[0].user }
    },
    updateSession: async (session) => {
      const [row] = await db.update(sessions).set({
        expires: session.expires,
      }).where(eq(sessions.sessionToken, session.sessionToken)).returning()
      return row ?? null
    },
    deleteSession: async (sessionToken) => {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken))
    },
    createVerificationToken: async (token) => {
      const [row] = await db.insert(verificationTokens).values({
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      }).returning()
      return row
    },
    useVerificationToken: async (params) => {
      const [row] = await db
        .delete(verificationTokens)
        .where(and(eq(verificationTokens.identifier, params.identifier), eq(verificationTokens.token, params.token)))
        .returning()
      return row ?? null
    },
    createAuthenticator: async (authenticatorItem) => {
      const [row] = await db.insert(authenticators).values({
        credentialID: authenticatorItem.credentialID,
        userId: authenticatorItem.userId,
        providerAccountId: authenticatorItem.providerAccountId,
        credentialPublicKey: authenticatorItem.credentialPublicKey,
        counter: authenticatorItem.counter,
        transports: authenticatorItem.transports,
        credentialDeviceType: authenticatorItem.credentialDeviceType,
        credentialBackedUp: authenticatorItem.credentialBackedUp,
      }).returning()
      return row
    },
    getAuthenticator: async (credentialID) => {
      const [row] = await db.select().from(authenticators).where(eq(authenticators.credentialID, credentialID))
      return row ?? null
    },
    listAuthenticatorsByUserId: async (userId) => {
      return await db.select().from(authenticators).where(eq(authenticators.userId, userId))
    },
    updateAuthenticatorCounter: async (credentialID, counter) => {
      await db.update(authenticators).set({ counter }).where(eq(authenticators.credentialID, credentialID))
    },
  }
}
