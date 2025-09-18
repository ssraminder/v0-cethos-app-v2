/**
 * Human-in-the-loop (HITL) business rules
 */

export interface PageConfidenceData {
  confidencePct: number
}

/**
 * Check if language pair requires HITL
 * Auto-HITL if neither source nor target is English
 */
export function languagePairRequiresHITL(sourceLang: string, targetLang: string): boolean {
  const isSourceEnglish = sourceLang.toLowerCase() === "en"
  const isTargetEnglish = targetLang.toLowerCase() === "en"

  // Require HITL if neither is English
  return !isSourceEnglish && !isTargetEnglish
}

/**
 * Compute average confidence from pages
 */
export function computeAverageConfidence(pages: PageConfidenceData[]): number {
  if (pages.length === 0) return 0

  const totalConfidence = pages.reduce((sum, page) => sum + page.confidencePct, 0)
  return totalConfidence / pages.length
}

/**
 * Check if confidence requires HITL
 * Auto-HITL if average confidence < 80%
 */
export function confidenceRequiresHITL(avgConfidence: number, threshold = 80): boolean {
  return avgConfidence < threshold
}

/**
 * Determine if quote requires HITL based on all rules
 */
export function requiresHITL(
  sourceLang: string,
  targetLang: string,
  pages: PageConfidenceData[],
  confidenceThreshold = 80,
): boolean {
  const languageHITL = languagePairRequiresHITL(sourceLang, targetLang)
  const avgConfidence = computeAverageConfidence(pages)
  const confidenceHITL = confidenceRequiresHITL(avgConfidence, confidenceThreshold)

  return languageHITL || confidenceHITL
}
