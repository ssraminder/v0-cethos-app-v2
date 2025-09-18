"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Loader2, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react"
import { useDropzone } from "react-dropzone"
import { cn } from "@/lib/utils"
import { PhoneInput } from "@/components/ui/phone-input"

interface Language {
  id: string
  code: string
  name: string
  native_name: string
}

interface IntendedUse {
  id: string
  name: string
  certification_type_id: string
}

interface UploadedFile {
  file: File
  id: string
  wordCount?: number
  pageCount?: number
}

interface Quote {
  id: string
  quote_number: string
  total_amount: number
  base_amount: number
  rush_amount: number
  certification_amount: number
  tax_amount: number
  word_count: number
  expires_at: string
  billed_units?: number
  billedUnits?: number
  billed_rate?: number
  billedRate?: number
  files?: any[]
}

export function QuoteWidget() {
  const [currentStep, setCurrentStep] = useState(1)
  const [languages, setLanguages] = useState<Language[]>([])
  const [intendedUses, setIntendedUses] = useState<IntendedUse[]>([])
  const [formData, setFormData] = useState<{
    files: UploadedFile[]
    sourceLanguage: string
    targetLanguage: string
    intendedUse: string
    fullName: string
    email: string
    phone: string
  }>({
    files: [],
    sourceLanguage: "",
    targetLanguage: "",
    intendedUse: "",
    fullName: "",
    email: "",
    phone: "",
  })
  const [showTargetOtherInput, setShowTargetOtherInput] = useState(false)
  const [targetOtherText, setTargetOtherText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>("")

  useEffect(() => {
    Promise.all([
      fetch("/api/languages").then((res) => res.json()),
      fetch("/api/intended-uses").then((res) => res.json()),
    ])
      .then(([languagesData, intendedUsesData]) => {
        setLanguages(languagesData.languages || [])
        setIntendedUses(intendedUsesData.intendedUses || [])
      })
      .catch((err) => {
        console.error("[v0] Failed to load data:", err)
        setError("Failed to load form data. Please refresh the page.")
      })
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      wordCount: file.type.includes("text") ? Math.floor(file.size / 6) : Math.floor(file.size / 12),
      pageCount: Math.max(1, Math.floor(file.size / 2000)),
    }))
    setFormData((prev) => ({ ...prev, files: [...prev.files, ...newFiles] }))
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: 50 * 1024 * 1024,
  })

  const removeFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }))
  }

  const handleSourceLanguageChange = (value: string) => {
    const englishLanguage = languages.find((lang) => lang.name.toLowerCase() === "english")
    const isSourceEnglish = value === englishLanguage?.id

    setFormData((prev) => ({ ...prev, sourceLanguage: value }))

    if (isSourceEnglish) {
      setShowTargetOtherInput(false)
      setTargetOtherText("")
    } else {
      const currentTarget = formData.targetLanguage
      if (currentTarget && currentTarget !== englishLanguage?.id && currentTarget !== "other") {
        setFormData((prev) => ({ ...prev, targetLanguage: "" }))
      }
    }
  }

  const handleTargetLanguageChange = (value: string) => {
    setFormData((prev) => ({ ...prev, targetLanguage: value }))

    if (value === "other") {
      setShowTargetOtherInput(true)
    } else {
      setShowTargetOtherInput(false)
      setTargetOtherText("")
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    setUploadStatus("Uploading files and processing...")

    try {
      const selectedIntendedUse = intendedUses.find((use) => use.id === formData.intendedUse)

      let serviceType = "translation"
      const urgencyLevel = "standard"
      let certificationRequired = false

      if (
        selectedIntendedUse?.name.toLowerCase().includes("certification") ||
        selectedIntendedUse?.name.toLowerCase().includes("certified")
      ) {
        certificationRequired = true
      }

      if (selectedIntendedUse?.name.toLowerCase().includes("interpretation")) {
        serviceType = "interpretation"
      } else if (selectedIntendedUse?.name.toLowerCase().includes("proofreading")) {
        serviceType = "proofreading"
      }

      const finalTargetLanguage = formData.targetLanguage === "other" ? targetOtherText : formData.targetLanguage
      const englishLanguage = languages.find((lang) => lang.name.toLowerCase() === "english")
      const isSourceEnglish = formData.sourceLanguage === englishLanguage?.id
      const shouldTriggerHITL = !isSourceEnglish && formData.targetLanguage === "other"

      // For "other" target language, we need to use a placeholder UUID or handle it differently
      let targetLanguageId = finalTargetLanguage
      if (formData.targetLanguage === "other") {
        // Use English as fallback for "other" languages to satisfy UUID validation
        // The actual language will be handled by the HITL process
        targetLanguageId = englishLanguage?.id || formData.sourceLanguage
      }

      console.log("[v0] Submitting quote with:", {
        sourceLanguageId: formData.sourceLanguage,
        targetLanguageId,
        finalTargetLanguage,
        shouldTriggerHITL,
      })

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguageId: formData.sourceLanguage,
          targetLanguageId, // Use the processed targetLanguageId instead of finalTargetLanguage
          serviceType,
          urgencyLevel,
          certificationRequired,
          ...(shouldTriggerHITL && { hitlHint: true, customTargetLanguage: targetOtherText }),
          customerDetails: {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
          },
          files: formData.files.map((f) => ({
            filename: f.file.name,
            size: f.file.size,
            mimeType: f.file.type,
            wordCount: f.wordCount,
            pageCount: f.pageCount,
          })),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create quote")
      }

      setQuote(data.quote)
      setUploadStatus("Quote generated successfully!")
    } catch (err) {
      console.error("[v0] Quote creation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.files.length > 0
      case 2:
        const hasValidTarget =
          formData.targetLanguage && (formData.targetLanguage !== "other" || targetOtherText.trim().length > 0)
        return formData.sourceLanguage && hasValidTarget && formData.intendedUse
      case 3:
        return formData.fullName && formData.email && formData.phone.trim().length > 0
      default:
        return true
    }
  }

  if (quote) {
    const sourceLanguage = languages.find((l) => l.id === formData.sourceLanguage)
    const targetLanguage =
      formData.targetLanguage === "other"
        ? { name: targetOtherText }
        : languages.find((l) => l.id === formData.targetLanguage)
    const selectedIntendedUse = intendedUses.find((u) => u.id === formData.intendedUse)

    const billedUnits = quote.billed_units ?? quote.billedUnits ?? null
    const billedRate = quote.billed_rate ?? quote.billedRate ?? null
    const fileCount = quote.files?.length ?? formData.files.length

    const formatCurrency = (n: number) =>
      n.toLocaleString("en-CA", {
        style: "currency",
        currency: "CAD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    const formatUnits = (n: number) =>
      n.toLocaleString("en-CA", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " pages"

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Review Your Quote</CardTitle>
          <CardDescription>Quote #{quote.quote_number}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="mt-4 border rounded-xl p-4 bg-white">
            <h4 className="font-semibold mb-3">Files & Certifications ({fileCount})</h4>
            <div className="space-y-2">
              {formData.files.length > 0 ? (
                formData.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-sm">
                          {file.file.name.length > 30 ? `${file.file.name.substring(0, 30)}...` : file.file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(1)} MB •{" "}
                          {file.file.type.split("/")[1]?.toUpperCase() || "FILE"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600">
                        Pending analysis
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-2 text-sm text-gray-500">(No files attached)</div>
              )}
            </div>
            <div className="mt-3 text-right">
              <span className="text-sm font-medium">
                Certifications Required: <strong>1</strong>
              </span>
              <span className="text-xs text-gray-500 ml-1">(default; will update after analysis)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Languages</div>
              <div className="text-sm">
                {sourceLanguage?.name || "Unknown"} → {targetLanguage?.name || "Unknown"}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Intended Use</div>
              <div className="text-sm">{selectedIntendedUse?.name || "Unknown"}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Billable Pages</div>
              <div className="text-sm">
                {billedUnits !== null ? formatUnits(billedUnits) : Math.ceil(quote.word_count / 250)}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Rate / Page (CAD)</div>
              <div className="text-sm">
                {billedRate !== null
                  ? formatCurrency(billedRate)
                  : `$${(quote.base_amount / Math.ceil(quote.word_count / 250)).toFixed(2)}`}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(quote.base_amount + quote.certification_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <span>{formatCurrency(quote.tax_amount)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>{formatCurrency(quote.total_amount)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1">Accept & Pay</Button>
            <Button
              variant="outline"
              onClick={() => {
                setQuote(null)
                setCurrentStep(1)
                setFormData({
                  files: [],
                  sourceLanguage: "",
                  targetLanguage: "",
                  intendedUse: "",
                  fullName: "",
                  email: "",
                  phone: "",
                })
                setShowTargetOtherInput(false)
                setTargetOtherText("")
              }}
            >
              New Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Get Your Translation Quote</CardTitle>
        <CardDescription>
          This quote is for a certified translation. Complete the 4-step process to get your instant quote.
        </CardDescription>

        <div className="flex items-center justify-center space-x-2 mt-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step < currentStep
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-600",
              )}
            >
              {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Step 1: Upload Files</h3>
              <p className="text-sm text-muted-foreground">Upload your documents (PDF, Images, DOC, DOCX)</p>
            </div>

            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
              )}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium mb-2">{isDragActive ? "Drop files here" : "Drag & drop files here"}</p>
              <p className="text-sm text-gray-500">or click to browse • PDF, DOC, DOCX, JPG, PNG • Max 50MB</p>
            </div>

            {formData.files.length > 0 && (
              <div className="space-y-2">
                {formData.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{file.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.file.size / 1024 / 1024).toFixed(1)} MB • ~{file.wordCount} words
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Step 2: Languages & Intended Use</h3>
              <p className="text-sm text-muted-foreground">Select source language, target language, and intended use</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Language *</Label>
                <Select value={formData.sourceLanguage} onValueChange={handleSourceLanguageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name} ({lang.native_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To Language *</Label>
                <Select value={formData.targetLanguage} onValueChange={handleTargetLanguageChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      const englishLanguage = languages.find((lang) => lang.name.toLowerCase() === "english")
                      const isSourceEnglish = formData.sourceLanguage === englishLanguage?.id

                      if (isSourceEnglish) {
                        return languages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name} ({lang.native_name})
                          </SelectItem>
                        ))
                      } else {
                        return [
                          englishLanguage && (
                            <SelectItem key={englishLanguage.id} value={englishLanguage.id}>
                              {englishLanguage.name} ({englishLanguage.native_name})
                            </SelectItem>
                          ),
                          <SelectItem key="other" value="other">
                            Other
                          </SelectItem>,
                        ].filter(Boolean)
                      }
                    })()}
                  </SelectContent>
                </Select>
                {formData.targetLanguage === "other" && targetOtherText.trim().length === 0 && (
                  <p className="text-sm text-red-600">Please specify the target language.</p>
                )}
              </div>
            </div>

            {showTargetOtherInput && (
              <div className="space-y-2">
                <Label>Target Language *</Label>
                <Input
                  placeholder="Enter target language"
                  value={targetOtherText}
                  onChange={(e) => setTargetOtherText(e.target.value)}
                  aria-describedby="target-other-help"
                />
                <p id="target-other-help" className="text-sm text-muted-foreground">
                  If your target language is not listed, type it here.
                </p>
              </div>
            )}

            {(() => {
              const englishLanguage = languages.find((lang) => lang.name.toLowerCase() === "english")
              const isSourceEnglish = formData.sourceLanguage === englishLanguage?.id
              const isTargetOther = formData.targetLanguage === "other"

              if (!isSourceEnglish && isTargetOther) {
                return (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-600">A human review will be requested for this language pair.</p>
                  </div>
                )
              }
              return null
            })()}

            <div className="space-y-2">
              <Label>Intended Use *</Label>
              <Select
                value={formData.intendedUse}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, intendedUse: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select intended use" />
                </SelectTrigger>
                <SelectContent>
                  {intendedUses.map((use) => (
                    <SelectItem key={use.id} value={use.id}>
                      {use.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Step 3: Customer Details</h3>
              <p className="text-sm text-muted-foreground">Provide your contact information</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email address"
                />
              </div>

              <div className="space-y-2">
                <Label>Phone number *</Label>
                <PhoneInput
                  defaultCountry="CA"
                  value={formData.phone ?? ""}
                  onChange={(val) => setFormData({ ...formData, phone: val })}
                  inputClassName="w-full"
                  placeholder="Phone number"
                />
                <p className="text-sm text-muted-foreground">Example: (201) 555-0123</p>
                {formData.phone.trim().length === 0 && (
                  <p className="text-sm text-red-600">Phone number is required.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Step 4: Review & Submit</h3>
              <p className="text-sm text-muted-foreground">Review your information and submit for quote</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <strong>Files:</strong> {formData.files.length} file(s) uploaded
              </div>
              <div>
                <strong>Languages:</strong> {languages.find((l) => l.id === formData.sourceLanguage)?.name} →{" "}
                {formData.targetLanguage === "other"
                  ? targetOtherText
                  : languages.find((l) => l.id === formData.targetLanguage)?.name}
              </div>
              <div>
                <strong>Intended Use:</strong> {intendedUses.find((u) => u.id === formData.intendedUse)?.name}
              </div>
              <div>
                <strong>Contact:</strong> {formData.fullName} ({formData.email})
              </div>
            </div>

            {uploadStatus && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-600">{uploadStatus}</p>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceedFromStep(currentStep)}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit & Get Quote"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
