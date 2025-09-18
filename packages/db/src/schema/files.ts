import { pgTable, uuid, text, bigint, integer, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"
import { quotes } from "./quotes"

export const fileStatusEnum = pgEnum("file_status", ["uploaded", "scanned", "parsed", "quarantined", "processed"])

export const files = pgTable("files", {
  id: uuid("id").primaryKey().default(createId()),
  quoteId: uuid("quote_id")
    .references(() => quotes.id)
    .notNull(),
  gcsUri: text("gcs_uri").notNull(),
  originalName: text("original_name").notNull(),
  bytes: bigint("bytes", { mode: "number" }).notNull(),
  mimeType: text("mime_type").notNull(),
  checksum: text("checksum"),
  status: fileStatusEnum("status").notNull().default("uploaded"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const complexityClassEnum = pgEnum("complexity_class", ["easy", "medium", "hard"])

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().default(createId()),
  fileId: uuid("file_id")
    .references(() => files.id)
    .notNull(),
  pageIndex: integer("page_index").notNull(),
  words: integer("words").notNull(),
  complexityClass: complexityClassEnum("complexity_class"),
  primaryLang: text("primary_lang"),
  secondaryLang: text("secondary_lang"),
  primaryProminence: integer("primary_prominence"),
  secondaryProminence: integer("secondary_prominence"),
  confidencePct: integer("confidence_pct"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const pageAnalysis = pgTable("page_analysis", {
  id: uuid("id").primaryKey().default(createId()),
  pageId: uuid("page_id")
    .references(() => pages.id)
    .notNull(),
  documentType: text("document_type"),
  languages: text("languages"), // JSON stored as text
  confidencePct: integer("confidence_pct"),
  docGroupId: text("doc_group_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
