import { pgTable, uuid, text, numeric, date, timestamp, integer } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { quotes, customers, shippingMethods } from "./index"

export const taxRegions = pgTable("tax_regions", {
  id: uuid("id").primaryKey().default(createId()),
  country: text("country").notNull(),
  province: text("province"),
  taxPct: numeric("tax_pct", { precision: 6, scale: 3 }).notNull(),
})

export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(createId()),
  quoteId: uuid("quote_id").references(() => quotes.id),
  customerId: uuid("customer_id")
    .references(() => customers.id)
    .notNull(),
  stripeInvoiceId: text("stripe_invoice_id"),
  totalCents: integer("total_cents").notNull(),
  taxCents: integer("tax_cents").notNull(),
  status: text("status").notNull(),
  dueDate: date("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().default(createId()),
  quoteId: uuid("quote_id")
    .references(() => quotes.id)
    .notNull(),
  methodId: uuid("method_id")
    .references(() => shippingMethods.id)
    .notNull(),
  trackingNumber: text("tracking_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
