import type { NextAuthOptions } from "next-auth"
import GitHub from "next-auth/providers/github"

import { db } from "@/db/client"
import { customDrizzleAdapter } from "./custom-adapter"

export const authOptions: NextAuthOptions = {
  adapter: customDrizzleAdapter(),
  session: { strategy: "database" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
}
