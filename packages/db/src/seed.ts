import { db } from "./client"
import {
  pricingTiers,
  pricingLanguages,
  certificationTypes,
  complexityCategories,
  shippingMethods,
  settings,
  taxRegions,
  rolePermissions,
} from "./schema"
import { logger } from "@cethos/utils"

async function seed() {
  logger.info("Starting database seed...")

  try {
    // Seed pricing tiers
    const tiers = await db
      .insert(pricingTiers)
      .values([
        { name: "A", multiplier: "1.00" },
        { name: "B", multiplier: "1.20" },
        { name: "C", multiplier: "1.35" },
        { name: "D", multiplier: "1.50" },
      ])
      .returning()

    logger.info("Seeded pricing tiers")

    // Seed pricing languages
    await db.insert(pricingLanguages).values([
      // Tier A
      { languageCode: "pa", tierId: tiers[0].id },
      { languageCode: "hi", tierId: tiers[0].id },
      { languageCode: "mr", tierId: tiers[0].id },
      // Tier B
      { languageCode: "ar", tierId: tiers[1].id },
      { languageCode: "zh", tierId: tiers[1].id },
      { languageCode: "th", tierId: tiers[1].id },
      // Tier C
      { languageCode: "fr", tierId: tiers[2].id },
      { languageCode: "de", tierId: tiers[2].id },
      { languageCode: "it", tierId: tiers[2].id },
      { languageCode: "el", tierId: tiers[2].id },
      // Tier D
      { languageCode: "no", tierId: tiers[3].id },
      { languageCode: "sv", tierId: tiers[3].id },
      { languageCode: "fi", tierId: tiers[3].id },
      { languageCode: "nl", tierId: tiers[3].id },
    ])

    logger.info("Seeded pricing languages")

    // Seed certification types
    await db.insert(certificationTypes).values([
      { name: "Notarization", priceCents: 5000, pricingMode: "flat" },
      { name: "PPTC", priceCents: 3500, pricingMode: "flat" },
      { name: "Standard", priceCents: 0, pricingMode: "flat" },
    ])

    logger.info("Seeded certification types")

    // Seed complexity categories
    await db.insert(complexityCategories).values([
      { name: "Easy", multiplier: "1.00" },
      { name: "Medium", multiplier: "1.15" },
      { name: "Hard", multiplier: "1.30" },
    ])

    logger.info("Seeded complexity categories")

    // Seed shipping methods
    await db.insert(shippingMethods).values([
      { name: "Online Copy", priceCents: 0, hasTracking: false },
      { name: "Canada Post", priceCents: 500, hasTracking: true },
      { name: "Pickup Calgary", priceCents: 0, hasTracking: false },
      { name: "Express Post", priceCents: 2500, hasTracking: true },
    ])

    logger.info("Seeded shipping methods")

    // Seed settings
    await db.insert(settings).values([
      {
        singleton: true,
        baseRate: "40.00",
        divisor: 225,
        roundingThreshold: "0.20",
        rushDefaultPct: "30.0",
        slaJson: JSON.stringify({
          rules: [
            { pages: "1-3", businessDays: 2 },
            { pages: "4+", additionalDaysPerFourPages: 1 },
          ],
        }),
      },
    ])

    logger.info("Seeded settings")

    // Seed tax regions
    await db.insert(taxRegions).values([
      // HST provinces
      { country: "CA", province: "NB", taxPct: "15.0" },
      { country: "CA", province: "NL", taxPct: "15.0" },
      { country: "CA", province: "NS", taxPct: "14.0" },
      { country: "CA", province: "ON", taxPct: "13.0" },
      { country: "CA", province: "PE", taxPct: "15.0" },
      // GST provinces
      { country: "CA", province: "AB", taxPct: "5.0" },
      { country: "CA", province: "NT", taxPct: "5.0" },
      { country: "CA", province: "NU", taxPct: "5.0" },
      { country: "CA", province: "YT", taxPct: "5.0" },
      // Outside Canada
      { country: "US", province: null, taxPct: "0.0" },
    ])

    logger.info("Seeded tax regions")

    // Seed role permissions
    await db.insert(rolePermissions).values([
      // Admin permissions
      { role: "admin", permission: "quotes:read" },
      { role: "admin", permission: "quotes:create" },
      { role: "admin", permission: "quotes:edit" },
      { role: "admin", permission: "quotes:override" },
      { role: "admin", permission: "quotes:approve_business" },
      { role: "admin", permission: "quotes:reports_full" },
      { role: "admin", permission: "customers:create" },
      { role: "admin", permission: "customers:approve_business" },
      { role: "admin", permission: "invoices:read" },
      { role: "admin", permission: "invoices:send" },

      // Manager permissions (same as admin)
      { role: "manager", permission: "quotes:read" },
      { role: "manager", permission: "quotes:create" },
      { role: "manager", permission: "quotes:edit" },
      { role: "manager", permission: "quotes:override" },
      { role: "manager", permission: "quotes:approve_business" },
      { role: "manager", permission: "quotes:reports_full" },
      { role: "manager", permission: "customers:create" },
      { role: "manager", permission: "customers:approve_business" },
      { role: "manager", permission: "invoices:read" },
      { role: "manager", permission: "invoices:send" },

      // PM permissions (same as admin/manager)
      { role: "pm", permission: "quotes:read" },
      { role: "pm", permission: "quotes:create" },
      { role: "pm", permission: "quotes:edit" },
      { role: "pm", permission: "quotes:override" },
      { role: "pm", permission: "quotes:approve_business" },
      { role: "pm", permission: "quotes:reports_full" },
      { role: "pm", permission: "customers:create" },
      { role: "pm", permission: "customers:approve_business" },
      { role: "pm", permission: "invoices:read" },
      { role: "pm", permission: "invoices:send" },

      // Accountant permissions
      { role: "accountant", permission: "quotes:read" },
      { role: "accountant", permission: "invoices:read" },
      { role: "accountant", permission: "invoices:create" },
      { role: "accountant", permission: "invoices:send" },
      { role: "accountant", permission: "reports:finance" },

      // Sales permissions
      { role: "sales", permission: "customers:create" },
      { role: "sales", permission: "quotes:read" },
      { role: "sales", permission: "reports:sales" },

      // Assistant permissions
      { role: "assistant", permission: "quotes:propose_edits" },
      { role: "assistant", permission: "customers:read" },
    ])

    logger.info("Seeded role permissions")
    logger.info("Database seed completed successfully!")
  } catch (error) {
    logger.error("Error seeding database:", error)
    process.exit(1)
  }
}

// Run seed if called directly
if (require.main === module) {
  seed()
}

export { seed }
