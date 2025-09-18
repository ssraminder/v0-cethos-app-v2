import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { users } from "./users"

export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().default(createId()),
  role: text("role").notNull(),
  permission: text("permission").notNull(),
})

export const approvalStateEnum = pgEnum("approval_state", ["pending", "approved", "denied"])

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().default(createId()),
  targetType: text("target_type").notNull(),
  targetId: uuid("target_id").notNull(),
  requestedBy: uuid("requested_by")
    .references(() => users.id)
    .notNull(),
  approvedBy: uuid("approved_by").references(() => users.id),
  state: approvalStateEnum("state").notNull().default("pending"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
