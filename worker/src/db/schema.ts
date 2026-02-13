import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// 1. Users
export const users = sqliteTable("users", {
    id: text("id").primaryKey(), // UUID
    email: text("email").notNull().unique(),
    password_hash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role", { enum: ["super_admin", "user"] }).default("user").notNull(),
    plan_id: text("plan_id").references(() => plans.id),
    ai_mode: text("ai_mode", { enum: ["global", "byok"] }).default("byok").notNull(),
    status: text("status", { enum: ["active", "suspended"] }).default("active").notNull(),
    gemini_api_key: text("gemini_api_key"), // Encrypted if BYOK
    telegram_chat_id: text("telegram_chat_id").unique(),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 2. Plans
export const plans = sqliteTable("plans", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(), // "Basic (BYOK)", "Pro (AI Included)"
    slug: text("slug").unique().notNull(), // "basic-byok", "pro-ai"
    ai_mode: text("ai_mode", { enum: ["global", "byok"] }).notNull(),
    price_monthly: real("price_monthly").notNull(), // 0 or 30000
    price_type: text("price_type", { enum: ["recurring", "one_time"] }).default("recurring").notNull(), // new field for 200k one-time
    max_workspaces: integer("max_workspaces").notNull(),
    max_transactions: integer("max_transactions").default(-1).notNull(), // -1 unlimited
    is_active: integer("is_active", { mode: "boolean" }).default(true),
    sort_order: integer("sort_order").default(0),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 3. Workspaces
export const workspaces = sqliteTable("workspaces", {
    id: text("id").primaryKey(), // UUID
    name: text("name").notNull(),
    type: text("type", { enum: ["personal", "business", "family", "organization", "community"] }).notNull(),
    currency: text("currency").default("IDR").notNull(),
    owner_id: text("owner_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 4. Workspace Members
export const workspaceMembers = sqliteTable("workspace_members", {
    id: text("id").primaryKey(), // UUID
    workspace_id: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    user_id: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
    role: text("role", { enum: ["owner", "member"] }).notNull(),
    joined_at: text("joined_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 5. Accounts
export const accounts = sqliteTable("accounts", {
    id: text("id").primaryKey(), // UUID
    workspace_id: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(),
    type: text("type", { enum: ["cash", "bank", "e-wallet", "credit_card", "investment", "other"] }).notNull(),
    balance: real("balance").default(0).notNull(),
    icon: text("icon"),
    is_default: integer("is_default", { mode: "boolean" }).default(false),
    is_active: integer("is_active", { mode: "boolean" }).default(true),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 6. Categories
export const categories = sqliteTable("categories", {
    id: text("id").primaryKey(), // UUID
    workspace_id: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }), // Nullable for system defaults? No, let's say null = system default, but simpler to copy defaults to each workspace or handle null as global
    // Actually easier: if workspace_id is null, it's system default.
    name: text("name").notNull(),
    type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
    icon: text("icon"),
    color: text("color"),
    is_system: integer("is_system", { mode: "boolean" }).default(false),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 7. Transactions
export const transactions = sqliteTable("transactions", {
    id: text("id").primaryKey(), // UUID
    workspace_id: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }).notNull(),
    account_id: text("account_id").references(() => accounts.id, { onDelete: "set null" }), // if account deleted, keep transaction? maybe restrict delete. set null for now.
    transfer_to_account_id: text("transfer_to_account_id").references(() => accounts.id, { onDelete: "set null" }), // For transfers
    category_id: text("category_id").references(() => categories.id, { onDelete: "set null" }),
    user_id: text("user_id").references(() => users.id, { onDelete: "set null" }), // who created it
    type: text("type", { enum: ["income", "expense", "transfer"] }).notNull(),
    amount: real("amount").notNull(),
    description: text("description"),
    date: text("date").notNull(), // ISO date YYYY-MM-DD
    source: text("source", { enum: ["web_manual", "telegram_text", "telegram_image", "api"] }).default("web_manual"),
    status: text("status", { enum: ["confirmed", "pending"] }).default("confirmed").notNull(),
    batch_id: text("batch_id"),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 8. AI Logs
export const aiLogs = sqliteTable("ai_logs", {
    id: text("id").primaryKey(), // UUID
    user_id: text("user_id").references(() => users.id).notNull(),
    request_type: text("request_type").notNull(), // "parse_text", "parse_image"
    input_summary: text("input_summary"), // truncated input
    tokens_used: integer("tokens_used"),
    latency_ms: integer("latency_ms"),
    status: text("status").notNull(), // "success", "error"
    error_message: text("error_message"),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 9. Orders (Midtrans)
export const orders = sqliteTable("orders", {
    id: text("id").primaryKey(), // UUID
    user_id: text("user_id").references(() => users.id).notNull(),
    plan_id: text("plan_id").references(() => plans.id).notNull(),
    amount: real("amount").notNull(),
    status: text("status", { enum: ["pending", "paid", "failed", "cancelled"] }).default("pending").notNull(),
    snap_token: text("snap_token"),
    midtrans_order_id: text("midtrans_order_id").unique(),
    payment_type: text("payment_type"),
    paid_at: text("paid_at"),
    created_at: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// 10. Global Settings (Super Admin)
export const settings = sqliteTable("settings", {
    key: text("key").primaryKey(), // e.g. "gemini_api_key_pro", "payment_gateway_status"
    value: text("value").notNull(),
    description: text("description"),
    updated_at: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// Relations
export const transactionsRelations = relations(transactions, ({ one }) => ({
    account: one(accounts, {
        fields: [transactions.account_id],
        references: [accounts.id],
    }),
    category: one(categories, {
        fields: [transactions.category_id],
        references: [categories.id],
    }),
    user: one(users, {
        fields: [transactions.user_id],
        references: [users.id],
    }),
}));

export const accountsRelations = relations(accounts, ({ many }) => ({
    transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
    transactions: many(transactions),
}));

