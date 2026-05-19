import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL
const sql = connectionString ? neon(connectionString) : null

export const db = sql
  ? drizzle(sql, { schema })
  : new Proxy(
      {},
      {
        get() {
          throw new Error("DATABASE_URL is not configured")
        },
      },
    ) as ReturnType<typeof drizzle<typeof schema>>
