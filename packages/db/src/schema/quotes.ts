import { pgTable, uuid, text, numeric, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { customers } from "./users"

export const quoteStatusEnum = pgEnum("quote_status", [
  "draft",
  "analyzing",
  "pending_customer",
  "accepted",
  "paid",
  "in_production",
  "draft_shared",
  "revisions",
  "finalized",
  "delivered",
  "closed",
  "rejected_by_customer",
])

export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().default(createId()),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  status: quoteStatusEnum("status").notNull().default("draft"),
  baseRate: numeric("base_rate", { precision: 10, scale: 2 }),
  sourceLang: text("source_lang"),
  targetLang: text("target_lang"),
  certificationTypeId: uuid("certification_type_id"),
  rushPct: numeric("rush_pct", { precision: 5, scale: 2 }),
  shippingMethodId: uuid("shipping_method_id"),
  gstRegion: text("gst_region"),

  // Billed amounts (what customer pays)
  billedUnits: numeric("billed_units", { precision: 10, scale: 2 }),
  billedRate: numeric("billed_rate", { precision: 10, scale: 2 }),
  billedTotal: numeric("billed_total", { precision: 12, scale: 2 }),

  // Calculated amounts (engine results)
  calcUnits: numeric("calc_units", { precision: 10, scale: 2 }),
  calcRate: numeric("calc_rate", { precision: 10, scale: 2 }),
  calcTotal: numeric("calc_total", { precision: 12, scale: 2 }),

  requiresHitl: boolean("requires_hitl").default(false),
  avgConfidence: numeric("avg_confidence", { precision: 5, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const quoteItems = pgTable("quote_items", {
  id: uuid("id").primaryKey().default(createId()),
  quoteId: uuid("quote_id")
    .references(() => quotes.id)
    .notNull(),
  docType: text("doc_type"),
  languagePair: text("language_pair"),
  billedUnits: numeric("billed_units", { precision: 10, scale: 2 }),
  calcUnits: numeric("calc_units", { precision: 10, scale: 2 }),
  rate: numeric("rate", { precision: 10, scale: 2 }),
  certificationTypeId: uuid("certification_type_id"),
  subtotal: numeric("subtotal", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
