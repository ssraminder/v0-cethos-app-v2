import { describe, it, expect } from "vitest"
import {
  languagePairRequiresHITL,
  computeAverageConfidence,
  confidenceRequiresHITL,
  requiresHITL,
  type PageConfidenceData,
} from "../hitl"

describe("HITL Rules", () => {
  describe("languagePairRequiresHITL", () => {
    it("should require HITL when neither language is English", () => {
      expect(languagePairRequiresHITL("fr", "de")).toBe(true)
      expect(languagePairRequiresHITL("zh", "ar")).toBe(true)
      expect(languagePairRequiresHITL("es", "pt")).toBe(true)
    })

    it("should not require HITL when one language is English", () => {
      expect(languagePairRequiresHITL("en", "fr")).toBe(false)
      expect(languagePairRequiresHITL("fr", "en")).toBe(false)
      expect(languagePairRequiresHITL("EN", "de")).toBe(false) // Case insensitive
    })

    it("should not require HITL for English to English", () => {
      expect(languagePairRequiresHITL("en", "en")).toBe(false)
    })
  })

  describe("computeAverageConfidence", () => {
    it("should calculate average confidence correctly", () => {
      const pages: PageConfidenceData[] = [{ confidencePct: 80 }, { confidencePct: 90 }, { confidencePct: 70 }]

      expect(computeAverageConfidence(pages)).toBe(80)
    })

    it("should handle empty pages array", () => {
      expect(computeAverageConfidence([])).toBe(0)
    })

    it("should handle single page", () => {
      expect(computeAverageConfidence([{ confidencePct: 85 }])).toBe(85)
    })
  })

  describe("confidenceRequiresHITL", () => {
    it("should require HITL when confidence < 80%", () => {
      expect(confidenceRequiresHITL(79)).toBe(true)
      expect(confidenceRequiresHITL(50)).toBe(true)
      expect(confidenceRequiresHITL(0)).toBe(true)
    })

    it("should not require HITL when confidence >= 80%", () => {
      expect(confidenceRequiresHITL(80)).toBe(false)
      expect(confidenceRequiresHITL(85)).toBe(false)
      expect(confidenceRequiresHITL(100)).toBe(false)
    })

    it("should respect custom threshold", () => {
      expect(confidenceRequiresHITL(75, 70)).toBe(false)
      expect(confidenceRequiresHITL(69, 70)).toBe(true)
    })
  })

  describe("requiresHITL", () => {
    const highConfidencePages: PageConfidenceData[] = [{ confidencePct: 85 }, { confidencePct: 90 }]

    const lowConfidencePages: PageConfidenceData[] = [{ confidencePct: 70 }, { confidencePct: 75 }]

    it("should require HITL for non-English language pairs", () => {
      expect(requiresHITL("fr", "de", highConfidencePages)).toBe(true)
    })

    it("should require HITL for low confidence", () => {
      expect(requiresHITL("en", "fr", lowConfidencePages)).toBe(true)
    })

    it("should require HITL when both conditions are met", () => {
      expect(requiresHITL("fr", "de", lowConfidencePages)).toBe(true)
    })

    it("should not require HITL when neither condition is met", () => {
      expect(requiresHITL("en", "fr", highConfidencePages)).toBe(false)
    })
  })
})
