import { handlers } from "@/auth"

export const { GET, POST } = handlers

// Force Node runtime to avoid Edge CompressionStream warnings with NextAuth/Jose
export const runtime = "nodejs"
