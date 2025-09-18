import { pgTable, uuid, text, numeric, integer, boolean, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const pricingTiers = pgTable("pricing_tiers", {
  id: uuid("id").primaryKey().default(createId()),
  name: text("name").unique().notNull(),
  multiplier: numeric("multiplier", { precision: 6, scale: 3 }).notNull(),
})

export const pricingLanguages = pgTable("pricing_languages", {
  id: uuid("id").primaryKey().default(createId()),
  languageCode: text("language_code").unique().notNull(),
  tierId: uuid("tier_id")
    .references(() => pricingTiers.id)
    .notNull(),
})

export const pricingModeEnum = pgEnum("pricing_mode", ["flat", "multiplier"])

export const certificationTypes = pgTable("certification_types", {
  id: uuid("id").primaryKey().default(createId()),
  name: text("name").unique().notNull(),
  priceCents: integer("price_cents").notNull(),
  pricingMode: pricingModeEnum("pricing_mode").notNull().default("flat"),
  multiplier: numeric("multiplier", { precision: 6, scale: 3 }),
})

export const complexityCategories = pgTable("complexity_categories", {
  id: uuid("id").primaryKey().default(createId()),
  name: text("name").unique().notNull(),
  multiplier: numeric("multiplier", { precision: 6, scale: 3 }).notNull(),
})

export const shippingMethods = pgTable("shipping_methods", {
  id: uuid("id").primaryKey().default(createId()),
  name: text("name").unique().notNull(),
  priceCents: integer("price_cents").notNull(),
  hasTracking: boolean("has_tracking").notNull(),
})

export const settings = pgTable("settings", {
  id: uuid("id").primaryKey().default(createId()),
  singleton: boolean("singleton").default(true).unique(),
  baseRate: numeric("base_rate", { precision: 10, scale: 2 }).notNull(),
  divisor: integer("divisor").notNull().default(225),
  roundingThreshold: numeric("rounding_threshold", { precision: 6, scale: 3 }).notNull().default("0.20"),
  rushDefaultPct: numeric("rush_default_pct", { precision: 6, scale: 3 }).notNull().default("30.0"),
  slaJson: text("sla_json"), // JSON stored as text
})
