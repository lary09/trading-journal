import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, numeric, date } from "drizzle-orm/pg-core"

// Auth.js tables (manual to avoid adapter import issues)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
})

export const accounts = pgTable("accounts", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  oauthTokenSecret: text("oauth_token_secret"),
  oauthToken: text("oauth_token"),
}, (account) => ({
  pk: [account.provider, account.providerAccountId],
}))

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
})

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
}, (vt) => ({
  pk: [vt.identifier, vt.token],
}))

export const authenticators = pgTable("authenticators", {
  credentialID: text("credential_id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerAccountId: text("provider_account_id").notNull(),
  credentialPublicKey: text("credential_public_key").notNull(),
  counter: integer("counter").notNull(),
  credentialDeviceType: text("credential_device_type").notNull(),
  credentialBackedUp: boolean("credential_backed_up").notNull(),
  transports: text("transports"),
})

// User profile extension
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name"),
  tradingExperience: text("trading_experience"),
  preferredCurrency: text("preferred_currency").default("USD"),
  timezone: text("timezone").default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const symbols = pgTable("symbols", {
  id: uuid("id").primaryKey().defaultRandom(),
  ticker: text("ticker").notNull().unique(),
  name: text("name"),
  exchange: text("exchange"),
  assetType: text("asset_type"),
  currency: text("currency").default("USD"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const tradingStrategies = pgTable("trading_strategies", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  riskLevel: text("risk_level"),
  maxRiskPerTrade: numeric("max_risk_per_trade", { precision: 5, scale: 2 }),
  targetProfitRatio: numeric("target_profit_ratio", { precision: 5, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const bars1d = pgTable("bars_1d", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbolId: uuid("symbol_id").references(() => symbols.id, { onDelete: "cascade" }).notNull(),
  tradingDay: date("trading_day").notNull(),
  open: numeric("open", { precision: 18, scale: 8 }).notNull(),
  high: numeric("high", { precision: 18, scale: 8 }).notNull(),
  low: numeric("low", { precision: 18, scale: 8 }).notNull(),
  close: numeric("close", { precision: 18, scale: 8 }).notNull(),
  volume: numeric("volume", { precision: 20, scale: 0 }),
  vwap: numeric("vwap", { precision: 18, scale: 8 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const corpActions = pgTable("corp_actions", {
  id: uuid("id").primaryKey().defaultRandom(),
  symbolId: uuid("symbol_id").references(() => symbols.id, { onDelete: "cascade" }).notNull(),
  actionType: text("action_type").notNull(),
  recordDate: date("record_date"),
  effectiveDate: date("effective_date"),
  cashAmount: numeric("cash_amount", { precision: 18, scale: 8 }),
  ratio: numeric("ratio", { precision: 18, scale: 8 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const trades = pgTable("trades", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  strategyId: uuid("strategy_id").references(() => tradingStrategies.id, { onDelete: "set null" }),
  symbol: text("symbol").notNull(),
  tradeType: text("trade_type").notNull(),
  marketType: text("market_type").notNull(),
  entryPrice: numeric("entry_price", { precision: 15, scale: 8 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 15, scale: 8 }),
  quantity: numeric("quantity", { precision: 15, scale: 8 }).notNull(),
  stopLoss: numeric("stop_loss", { precision: 15, scale: 8 }),
  takeProfit: numeric("take_profit", { precision: 15, scale: 8 }),
  riskAmount: numeric("risk_amount", { precision: 15, scale: 2 }),
  profitLoss: numeric("profit_loss", { precision: 15, scale: 2 }),
  profitLossPct: numeric("profit_loss_percentage", { precision: 8, scale: 4 }),
  commission: numeric("commission", { precision: 10, scale: 2 }).default("0"),
  swap: numeric("swap", { precision: 10, scale: 2 }).default("0"),
  entryTime: timestamp("entry_time", { withTimezone: true }).notNull(),
  exitTime: timestamp("exit_time", { withTimezone: true }),
  status: text("status").default("open").notNull(),
  tradeSetup: text("trade_setup"),
  tradeOutcome: text("trade_outcome"),
  lessonsLearned: text("lessons_learned"),
  confidenceLevel: text("confidence_level"),
  emotionalState: text("emotional_state"),
  marketCondition: text("market_condition"),
  newsImpact: text("news_impact"),
  chartScreenshotUrl: text("chart_screenshot_url"),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const backtests = pgTable("backtests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  strategyId: uuid("strategy_id").references(() => tradingStrategies.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  status: text("status").default("pending").notNull(),
  parameters: jsonb("parameters"),
  metrics: jsonb("metrics"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const ingestionRuns = pgTable("ingestion_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  source: text("source").notNull(),
  status: text("status").default("pending").notNull(),
  rowCount: numeric("row_count", { precision: 10, scale: 0 }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Risk management rules per user
export const riskRules = pgTable("risk_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  dailyLossLimit: numeric("daily_loss_limit", { precision: 15, scale: 2 }),
  weeklyLossLimit: numeric("weekly_loss_limit", { precision: 15, scale: 2 }),
  maxRiskPerTrade: numeric("max_risk_per_trade", { precision: 6, scale: 2 }),
  alertsEnabled: boolean("alerts_enabled").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

// Daily journal entries
export const dailyJournals = pgTable("daily_journals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  tradingDay: date("trading_day").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})
