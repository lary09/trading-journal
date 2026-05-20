ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bars_1d_symbol_day_idx" ON "bars_1d" ("symbol_id", "trading_day");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "daily_journals_user_day_idx" ON "daily_journals" ("user_id", "trading_day");
