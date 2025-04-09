"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { CounselorLayout } from "@/components/layouts/counselor-layout"
import { Users, Search, FileText, Calendar, Upload, UserCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Student {
  id: string
  name: string
  email: string
  phone_number: string
  atp_done: boolean
  payment_done: boolean
  created_at: string
  has_report: boolean
  has_session: boolean
}

export default function CounselorStudents() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    const fetchStudents = async () => {
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
            .select("id, name, email, phone_number, atp_done, payment_done, created_at")
            .in("id", studentIds)

          if (studentError) {
            console.error("Error fetching student details:", studentError)
            return
          }

          // Fetch reports to check which students have reports
          const { data: reportData, error: reportError } = await supabase
            .from("reports")
            .select("student_id, report_url")
            .eq("counselor_id", user.id)

          if (reportError) {
            console.error("Error fetching reports:", reportError)
          }

          // Fetch sessions to check which students have sessions
          const { data: sessionData, error: sessionError } = await supabase
            .from("counseling_sessions")
            .select("student_id")
            .eq("counselor_id", user.id)

          if (sessionError) {
            console.error("Error fetching sessions:", sessionError)
          }

          // Enrich student data with report and session info
          const enrichedStudents = studentData.map((student) => {
            const hasReport = reportData?.some((report) => report.student_id === student.id && report.report_url)
            const hasSession = sessionData?.some((session) => session.student_id === student.id)

            return {
              ...student,
              has_report: hasReport || false,
              has_session: hasSession || false,
            }
          })

          setStudents(enrichedStudents)
        }
      } catch (error) {
        console.error("Error fetching students:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStudents()
  }, [user, loading, router])

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const viewStudentDetails = (student: Student) => {
    setSelectedStudent(student)
    setIsStudentDetailsOpen(true)
  }

  if (loading || isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <CounselorLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Students</h1>
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

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search students..."
              className="pl-10 bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Card className="glass-effect card-hover mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="h-5 w-5 text-[#0066FF]" />
              Your Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStudents.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone_number || "N/A"}</TableCell>
                        <TableCell>
                          {student.atp_done && student.payment_done ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                              Onboarding
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => viewStudentDetails(student)}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium">No students found</h3>
                <p className="text-gray-400 mt-1">
                  {searchQuery ? "No students match your search criteria" : "You don't have any students assigned yet"}
                </p>
                <p className="text-sm mt-2">Students will appear here once they are assigned to you.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isStudentDetailsOpen} onOpenChange={setIsStudentDetailsOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Student Details</DialogTitle>
            </DialogHeader>
            {selectedStudent && (
              <div className="py-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Name</h3>
                    <p className="mt-1">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Email</h3>
                    <p className="mt-1">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Phone</h3>
                    <p className="mt-1">{selectedStudent.phone_number || "Not provided"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Joined</h3>
                    <p className="mt-1">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400">Status</h3>
                    <div className="mt-1 flex gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedStudent.atp_done
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {selectedStudent.atp_done ? "Assessment Complete" : "Assessment Pending"}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          selectedStudent.payment_done
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                        }`}
                      >
                        {selectedStudent.payment_done ? "Payment Complete" : "Payment Pending"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <Button
                      variant="outline"
                      className={`justify-start ${!selectedStudent.has_report ? "text-gray-400" : ""}`}
                      disabled={!selectedStudent.has_report}
                      onClick={() => {
                        setIsStudentDetailsOpen(false)
                        router.push(`/counselor/reports?student=${selectedStudent.id}`)
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {selectedStudent.has_report ? "View Report" : "No Report Available"}
                    </Button>

                    <Button
                      variant="outline"
                      className={`justify-start ${!selectedStudent.has_session ? "text-gray-400" : ""}`}
                      disabled={!selectedStudent.has_session}
                      onClick={() => {
                        setIsStudentDetailsOpen(false)
                        router.push(`/counselor/sessions?student=${selectedStudent.id}`)
                      }}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedStudent.has_session ? "View Sessions" : "No Sessions Scheduled"}
                    </Button>

                    <Button
                      variant="outline"
                      className="justify-start"
                      onClick={() => {
                        setIsStudentDetailsOpen(false)
                        router.push(`/counselor/reports?upload=true&student=${selectedStudent.id}`)
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Report
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStudentDetailsOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CounselorLayout>
  )
}

