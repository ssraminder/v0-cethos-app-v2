/**
 * Service Level Agreement (SLA) calculations
 */

export interface SLARule {
  pages: string // e.g., "1-3", "4+", "10-20"
  businessDays?: number
  additionalDaysPerFourPages?: number
}

export interface SLASettings {
  rules: SLARule[]
}

/**
 * Parse page range string to check if page count matches
 */
function matchesPageRange(pageCount: number, range: string): boolean {
  if (range.includes("-")) {
    const [min, max] = range.split("-").map((s) => s.trim())
    const minPages = Number.parseInt(min)
    const maxPages = max === "+" ? Number.POSITIVE_INFINITY : Number.parseInt(max)
    return pageCount >= minPages && pageCount <= maxPages
  }

  if (range.endsWith("+")) {
    const minPages = Number.parseInt(range.replace("+", ""))
    return pageCount >= minPages
  }

  return pageCount === Number.parseInt(range)
}

/**
 * Calculate delivery SLA based on page count and settings
 */
export function deliverySLA(pageCount: number, slaSettings: SLASettings): number {
  // Find matching rule
  const matchingRule = slaSettings.rules.find((rule) => matchesPageRange(pageCount, rule.pages))

  if (!matchingRule) {
    // Default fallback: 2 days base + 1 day per 4 pages
    return 2 + Math.ceil((pageCount - 3) / 4)
  }

  if (matchingRule.businessDays !== undefined) {
    return matchingRule.businessDays
  }

  if (matchingRule.additionalDaysPerFourPages !== undefined) {
    const baseDays = 2 // Default base
    const additionalPages = Math.max(0, pageCount - 3)
    const additionalDays = Math.ceil(additionalPages / 4) * matchingRule.additionalDaysPerFourPages
    return baseDays + additionalDays
  }

  return 2 // Default fallback
}

/**
 * Default SLA settings
 */
export const defaultSLASettings: SLASettings = {
  rules: [
    { pages: "1-3", businessDays: 2 },
    { pages: "4+", additionalDaysPerFourPages: 1 },
  ],
}
