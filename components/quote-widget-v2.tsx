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
}

interface QuoteFormData {
  files: UploadedFile[]
  sourceLanguage: string
  targetLanguage: string
  intendedUse: string
  fullName: string
  email: string
  phone: string
}

export function QuoteWidget() {
  const [currentStep, setCurrentStep] = useState(1)
  const [languages, setLanguages] = useState<Language[]>([])
  const [intendedUses, setIntendedUses] = useState<IntendedUse[]>([])
  const [formData, setFormData] = useState<QuoteFormData>({
    files: [],
    sourceLanguage: "",
    targetLanguage: "",
    intendedUse: "",
    fullName: "",
    email: "",
    phone: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<string>("")

  // Load languages and intended uses on component mount
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
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const removeFile = (fileId: string) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((f) => f.id !== fileId),
    }))
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

      // Default mapping - you may need to adjust based on your intended uses
      let serviceType = "translation"
      const urgencyLevel = "standard"
      let certificationRequired = false

      // Map intended use to service type and certification
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

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceLanguageId: formData.sourceLanguage,
          targetLanguageId: formData.targetLanguage,
          serviceType,
          urgencyLevel,
          certificationRequired,
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
        return formData.sourceLanguage && formData.targetLanguage && formData.intendedUse
      case 3:
        return formData.fullName && formData.email
      default:
        return true
    }
  }

  if (quote) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Quote Generated</CardTitle>
          <CardDescription>Quote #{quote.quote_number}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 text-center">
              <strong>This quote is for a certified translation.</strong>
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span>Base Translation ({quote.word_count} words)</span>
              <span>${quote.base_amount.toFixed(2)}</span>
            </div>
            {quote.certification_amount > 0 && (
              <div className="flex justify-between">
                <span>Certification Fee</span>
                <span>${quote.certification_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Tax</span>
              <span>${quote.tax_amount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${quote.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-sm text-gray-600 text-center">
            Quote expires on {new Date(quote.expires_at).toLocaleDateString()}
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
        {/* Step 1: Upload Files */}
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

        {/* Step 2: Languages & Intended Use */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Step 2: Languages & Intended Use</h3>
              <p className="text-sm text-muted-foreground">Select source language, target language, and intended use</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>From Language *</Label>
                <Select
                  value={formData.sourceLanguage}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, sourceLanguage: value }))}
                >
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
                <Select
                  value={formData.targetLanguage}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, targetLanguage: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target language" />
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
            </div>

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

        {/* Step 3: Customer Details */}
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
                <Label>Phone (Optional)</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
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
                {languages.find((l) => l.id === formData.targetLanguage)?.name}
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

        {/* Navigation Buttons */}
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
