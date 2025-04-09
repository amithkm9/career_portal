"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, FileText, Upload, Search, AlertCircle, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CounselorLayout } from "@/components/layouts/counselor-layout"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

interface Student {
  id: string
  name: string
  email: string
}

interface Report {
  id: string
  student_id: string
  student_name: string
  student_email: string
  report_url: string | null
  created_at: string
  updated_at: string
}

export default function CounselorReportsPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [reportSummary, setReportSummary] = useState("")
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch assigned students
        const { data: assignedStudents, error: assignmentError } = await supabase
          .from("student_counselor_assignments")
          .select("student_id")
          .eq("counselor_id", user.id)

        if (assignmentError) {
          console.error("Error fetching student assignments:", assignmentError)
          return
        }

        const studentIds = assignedStudents.map((assignment) => assignment.student_id)

        if (studentIds.length > 0) {
          // Fetch student details
          const { data: studentData, error: studentError } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", studentIds)

          if (!studentError && studentData) {
            setStudents(studentData)
          }

          // Fetch reports
          const { data: reportData, error: reportError } = await supabase
            .from("reports")
            .select("*")
            .eq("counselor_id", user.id)

          if (!reportError && reportData) {
            // Enrich reports with student data
            const enrichedReports = reportData.map((report) => {
              const student = studentData?.find((s) => s.id === report.student_id)
              return {
                ...report,
                student_name: student?.name || "Unknown",
                student_email: student?.email || "Unknown",
              }
            })
            setReports(enrichedReports)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, loading, router])

  const filteredReports = reports.filter(
    (report) =>
      report.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.student_email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleUploadReport = async () => {
    if (!user || !selectedStudent || !reportFile) return

    setIsUploading(true)
    setUploadStatus("idle")
    setStatusMessage("")

    try {
      // Upload file to storage
      const fileExt = reportFile.name.split(".").pop()
      const fileName = `${Date.now()}_${selectedStudent.id}.${fileExt}`
      const filePath = `reports/${fileName}`

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("reports")
        .upload(filePath, reportFile)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage.from("reports").getPublicUrl(filePath)

      if (!urlData.publicUrl) throw new Error("Failed to get public URL")

      // Create report summary JSON
      const summaryData = {
        name: selectedStudent.name,
        reportTitle: "Career Assessment Report",
        assessmentFramework: "ClassMent Career Framework",
        orientationStyle: {
          dominantStyle: "Analytical",
          secondaryStyle: "Creative",
          description: "You have a balanced approach combining analytical thinking with creative problem-solving.",
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
            details:
              "Your analytical skills and problem-solving abilities make you well-suited for software development roles.",
            link: "https://theclassment.com/careers/software-development",
          },
          {
            domain: "UX/UI Design",
            details: "Your creative thinking and attention to detail align well with user experience design.",
            link: "https://theclassment.com/careers/ux-design",
          },
          {
            domain: "Data Science",
            details: "Your pattern recognition and logical reasoning skills are valuable in data science.",
            link: "https://theclassment.com/careers/data-science",
          },
        ],
      }

      // Check if report already exists
      const { data: existingReport, error: checkError } = await supabase
        .from("reports")
        .select("id")
        .eq("student_id", selectedStudent.id)
        .eq("counselor_id", user.id)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingReport) {
        // Update existing report
        const { error: updateError } = await supabase
          .from("reports")
          .update({
            report_url: urlData.publicUrl,
            report_summary: reportSummary || JSON.stringify(summaryData),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingReport.id)

        if (updateError) throw updateError
      } else {
        // Create new report
        const { error: insertError } = await supabase.from("reports").insert({
          student_id: selectedStudent.id,
          counselor_id: user.id,
          report_url: urlData.publicUrl,
          report_summary: reportSummary || JSON.stringify(summaryData),
        })

        if (insertError) throw insertError
      }

      // Success
      setUploadStatus("success")
      setStatusMessage("Report uploaded successfully!")

      // Refresh reports list
      const { data: updatedReports, error: refreshError } = await supabase
        .from("reports")
        .select("*")
        .eq("counselor_id", user.id)

      if (!refreshError && updatedReports) {
        const enrichedReports = updatedReports.map((report) => {
          const student = students.find((s) => s.id === report.student_id)
          return {
            ...report,
            student_name: student?.name || "Unknown",
            student_email: student?.email || "Unknown",
          }
        })
        setReports(enrichedReports)
      }

      // Close dialog after a delay
      setTimeout(() => {
        setIsUploadDialogOpen(false)
        setSelectedStudent(null)
        setReportFile(null)
        setReportSummary("")
        setUploadStatus("idle")
      }, 2000)
    } catch (error) {
      console.error("Error uploading report:", error)
      setUploadStatus("error")
      setStatusMessage("Failed to upload report. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0066FF]"></div>
      </div>
    )
  }

  return (
    <CounselorLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Student Reports</h1>
            <p className="text-gray-400">Upload and manage career assessment reports for your students</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover-glow rounded-full h-10 w-10">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-effect">
              <DropdownMenuItem onClick={() => signOut()}>Sign Out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mb-6 flex justify-end">
          <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white">
            <Upload className="h-4 w-4 mr-2" />
            Upload Report
          </Button>
        </div>

        <Card className="glass-effect card-hover mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#0066FF]" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student name or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
                />
              </div>
            </div>

            {filteredReports.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.student_name}</TableCell>
                        <TableCell>{report.student_email}</TableCell>
                        <TableCell>
                          {report.report_url ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{new Date(report.updated_at || report.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          {report.report_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(report.report_url!, "_blank")}
                            >
                              View
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedStudent({
                                  id: report.student_id,
                                  name: report.student_name,
                                  email: report.student_email,
                                })
                                setIsUploadDialogOpen(true)
                              }}
                            >
                              Upload
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No reports uploaded yet.</p>
                <p className="text-sm mt-2">Upload reports for your students to track their progress.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Student Report</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {!selectedStudent ? (
                <div className="space-y-4">
                  <Label>Select Student</Label>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-gray-400">{student.email}</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <Label>Selected Student</Label>
                    <div className="p-3 rounded-md bg-muted/50 mt-1">
                      <p className="font-medium">{selectedStudent.name}</p>
                      <p className="text-sm text-gray-400">{selectedStudent.email}</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="report-file">Upload PDF Report</Label>
                    <Input
                      id="report-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setReportFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="report-summary">Report Summary (Optional JSON)</Label>
                    <Textarea
                      id="report-summary"
                      placeholder="Paste JSON summary data here or leave blank for default template"
                      value={reportSummary}
                      onChange={(e) => setReportSummary(e.target.value)}
                      className="mt-1 min-h-[100px]"
                    />
                    <p className="text-xs text-gray-400 mt-1">If left blank, a default summary template will be used</p>
                  </div>

                  {uploadStatus === "success" && (
                    <Alert className="bg-green-600/20 border border-green-500 text-green-400">
                      <Check className="h-4 w-4" />
                      <AlertDescription>{statusMessage}</AlertDescription>
                    </Alert>
                  )}

                  {uploadStatus === "error" && (
                    <Alert className="bg-red-600/20 border border-red-500 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{statusMessage}</AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false)
                  setSelectedStudent(null)
                  setReportFile(null)
                  setReportSummary("")
                }}
              >
                Cancel
              </Button>
              {selectedStudent && (
                <Button
                  onClick={handleUploadReport}
                  disabled={!reportFile || isUploading}
                  className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
                >
                  {isUploading ? "Uploading..." : "Upload Report"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CounselorLayout>
  )
}

