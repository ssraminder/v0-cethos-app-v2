import { pgTable, uuid, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "manager",
  "pm",
  "accountant",
  "sales",
  "assistant",
  "customer",
])

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(createId()),
  email: text("email").unique().notNull(),
  phone: text("phone"),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  isBusiness: boolean("is_business").default(false),
  businessApproved: boolean("business_approved").default(false),
  netTerms: text("net_terms").default("NET30"),
  requiresApproval: boolean("requires_approval").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const customerTypeEnum = pgEnum("customer_type", ["business", "individual"])

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(createId()),
  userId: uuid("user_id").references(() => users.id),
  type: customerTypeEnum("type").notNull(),
  legalName: text("legal_name").notNull(),
  billingAddress: text("billing_address"), // JSON stored as text
  shippingAddress: text("shipping_address"), // JSON stored as text
  businessApproved: boolean("business_approved").default(false),
  netTerms: text("net_terms").default("NET30"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
