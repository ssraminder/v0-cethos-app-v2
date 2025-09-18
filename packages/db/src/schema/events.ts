import { pgTable, uuid, text, timestamp, boolean } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { quotes } from "./quotes"
import { users, customers } from "./users"

export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(createId()),
  quoteId: uuid("quote_id").references(() => quotes.id),
  type: text("type").notNull(),
  metadata: text("metadata"), // JSON stored as text
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const quoteRejections = pgTable("quote_rejections", {
  id: uuid("id").primaryKey().default(createId()),
  quoteId: uuid("quote_id")
    .references(() => quotes.id)
    .notNull(),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const internalAdjustments = pgTable("internal_adjustments", {
  id: uuid("id").primaryKey().default(createId()),
  quoteId: uuid("quote_id")
    .references(() => quotes.id)
    .notNull(),
  changedBy: uuid("changed_by")
    .references(() => users.id)
    .notNull(),
  fields: text("fields"), // JSON stored as text
  noCustomerImpact: boolean("no_customer_impact").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
