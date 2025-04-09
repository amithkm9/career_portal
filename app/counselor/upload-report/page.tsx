"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CounselorLayout } from "@/components/layouts/counselor-layout"
import { FileUp, AlertCircle, CheckCircle2, FileText } from "lucide-react"

export default function UploadReportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [studentEmail, setStudentEmail] = useState("")
  const [reportSummary, setReportSummary] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [fileName, setFileName] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check if file is a PDF
      if (selectedFile.type !== "application/pdf") {
        setStatus("error")
        setMessage("Only PDF files are allowed")
        return
      }

      setFile(selectedFile)
      setFileName(selectedFile.name)
      setStatus("idle")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file || !studentEmail) {
      setStatus("error")
      setMessage("Please select a file and enter student email")
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(studentEmail)) {
      setStatus("error")
      setMessage("Please enter a valid email address")
      return
    }

    // Validate JSON format if provided
    if (reportSummary) {
      try {
        JSON.parse(reportSummary)
      } catch (error) {
        setStatus("error")
        setMessage("Invalid JSON format for report summary")
        return
      }
    } else {
      // Create a default report summary if none provided
      const defaultSummary = {
        name: "Student Report",
        reportTitle: "Career Assessment Report",
        assessmentFramework: "ClassMent Career Framework",
        orientationStyle: {
          dominantStyle: "Analytical",
          secondaryStyle: "Creative",
          description: "Balanced approach combining analytical thinking with creative problem-solving.",
        },
        interest: {
          dominantInterestAreas: ["Technology", "Design", "Research"],
        },
        personality: {
          dominantTraits: ["Detail-oriented", "Innovative", "Persistent"],
        },
        aptitude: {
          dominantStrengths: ["Logical reasoning", "Pattern recognition", "Spatial awareness"],
        },
        emotionalQuotient: {
          dominantAttributes: ["Self-awareness", "Empathy", "Adaptability"],
        },
        careerMatches: [
          {
            domain: "Software Development",
            details: "Analytical skills and problem-solving abilities make you well-suited for software development.",
            link: "https://theclassment.com/careers/software-development",
          },
          {
            domain: "UX/UI Design",
            details: "Creative thinking and attention to detail align well with user experience design.",
            link: "https://theclassment.com/careers/ux-design",
          },
          {
            domain: "Data Science",
            details: "Pattern recognition and logical reasoning skills are valuable in data science.",
            link: "https://theclassment.com/careers/data-science",
          },
        ],
      }
      setReportSummary(JSON.stringify(defaultSummary, null, 2))
    }

    setIsUploading(true)
    setStatus("idle")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("email", studentEmail)
      formData.append("summary", reportSummary || JSON.stringify({}))

      const response = await fetch("/api/upload-report", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload report")
      }

      setStatus("success")
      setMessage("Report uploaded successfully!")

      // Reset form after successful upload
      setTimeout(() => {
        setFile(null)
        setFileName("")
        setStudentEmail("")
        setReportSummary("")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }, 3000)
    } catch (error) {
      console.error("Error uploading report:", error)
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]

    if (droppedFile) {
      if (droppedFile.type !== "application/pdf") {
        setStatus("error")
        setMessage("Only PDF files are allowed")
        return
      }

      setFile(droppedFile)
      setFileName(droppedFile.name)
      setStatus("idle")
    }
  }

  if (loading) {
    return (
      <CounselorLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066FF]"></div>
        </div>
      </CounselorLayout>
    )
  }

  return (
    <CounselorLayout>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Upload Student Report</h1>
          <p className="text-gray-400">Upload PDF reports for your students and provide a summary of the assessment.</p>
        </div>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0066FF]" />
              Report Upload Form
            </CardTitle>
            <CardDescription>Upload a PDF report and provide the student's email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">
                  Student Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  required
                  className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">
                  PDF Report <span className="text-red-500">*</span>
                </Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    file ? "border-green-500/50 bg-green-500/5" : "border-[#0066FF]/30 hover:border-[#0066FF]/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <FileUp className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                  {fileName ? (
                    <div>
                      <p className="text-sm font-medium text-green-500">File selected:</p>
                      <p className="text-sm text-gray-300 truncate max-w-full">{fileName}</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">Drag and drop your PDF file here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Only PDF files are accepted</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">
                  Report Summary (JSON format)
                  <span className="text-xs text-gray-400 ml-2">
                    (Optional - default template will be used if empty)
                  </span>
                </Label>
                <Textarea
                  id="summary"
                  placeholder='{"name": "Student Name", "reportTitle": "Career Assessment Report", ...}'
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  className="min-h-[200px] font-mono text-sm bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
                />
                <p className="text-xs text-gray-400">
                  Enter a valid JSON object containing the report summary. If left empty, a default template will be
                  used.
                </p>
              </div>

              {status === "success" && (
                <Alert className="bg-green-600/20 border border-green-500 text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert className="bg-red-600/20 border border-red-500 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              disabled={isUploading || !file || !studentEmail}
              className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
            >
              {isUploading ? "Uploading..." : "Upload Report"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </CounselorLayout>
  )
}

