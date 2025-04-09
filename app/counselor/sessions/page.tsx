"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { CounselorLayout } from "@/components/layouts/counselor-layout"
import { Calendar, UserCircle, Plus } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Session {
  id: string
  student_id: string
  student_name: string
  student_email: string
  session_date: string
  session_time: string
  duration: number
  meeting_link: string
  status: "scheduled" | "completed" | "cancelled"
  notes: string | null
}

export default function CounselorSessions() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
      return
    }

    const fetchSessions = async () => {
      if (!user) return

      try {
        // Fetch sessions
        const { data: sessionData, error: sessionError } = await supabase
          .from("counseling_sessions")
          .select("*, student_id")
          .eq("counselor_id", user.id)
          .order("session_date", { ascending: true })

        if (sessionError) {
          console.error("Error fetching sessions:", sessionError)
          return
        }

        if (sessionData.length > 0) {
          // Get unique student IDs
          const studentIds = [...new Set(sessionData.map((session) => session.student_id))]

          // Fetch student details
          const { data: studentData, error: studentError } = await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", studentIds)

          if (studentError) {
            console.error("Error fetching student details:", studentError)
            return
          }

          // Enrich sessions with student data
          const enrichedSessions = sessionData.map((session) => {
            const student = studentData.find((s) => s.id === session.student_id)
            return {
              ...session,
              student_name: student?.name || "Unknown",
              student_email: student?.email || "Unknown",
            }
          })

          setSessions(enrichedSessions)
        }
      } catch (error) {
        console.error("Error fetching sessions:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [user, loading, router])

  const filteredSessions = sessions.filter(
    (session) =>
      session.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.student_email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const upcomingSessions = filteredSessions.filter(
    (session) => new Date(session.session_date) >= new Date() && session.status !== "cancelled",
  )

  const pastSessions = filteredSessions.filter(
    (session) => new Date(session.session_date) < new Date() || session.status === "cancelled",
  )

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">Scheduled</Badge>
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400 hover:bg-red-500/30">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 hover:bg-gray-500/30">Unknown</Badge>
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Counseling Sessions</h1>
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
          <Button className="bg-[#0066FF] hover:bg-[#0066FF]/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Session
          </Button>
        </div>

        <Card className="glass-effect card-hover mb-8">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#0066FF]" />
              Upcoming Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-400">
              <p>No upcoming sessions scheduled.</p>
              <p className="text-sm mt-2">Schedule sessions with your students to provide guidance.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </CounselorLayout>
  )
}

