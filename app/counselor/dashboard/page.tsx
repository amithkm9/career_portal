"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserCircle, Users, Calendar, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CounselorLayout } from "@/components/layouts/counselor-layout"

export default function CounselorDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
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
          <h1 className="text-3xl font-bold">Counselor Dashboard</h1>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-[#0066FF]" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">0</div>
              <p className="text-sm text-gray-400">Students assigned to you</p>
            </CardContent>
          </Card>

          <Card className="glass-effect card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#9333EA]" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">0</div>
              <p className="text-sm text-gray-400">Sessions scheduled</p>
            </CardContent>
          </Card>

          <Card className="glass-effect card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#0066FF]" />
                Pending Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">0</div>
              <p className="text-sm text-gray-400">Reports to be uploaded</p>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-effect card-hover">
          <CardHeader>
            <CardTitle className="text-2xl">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              Welcome to the ClassMent Counselor Dashboard. As a career counselor, you can:
            </p>
            <ul className="space-y-2 list-disc pl-6 text-gray-300">
              <li>View and manage your assigned students</li>
              <li>Upload and manage career assessment reports</li>
              <li>Schedule and conduct counseling sessions</li>
              <li>Track student progress and provide guidance</li>
            </ul>
            <p className="text-gray-300 mt-4">
              To get started, explore the navigation menu on the left to access different sections of the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    </CounselorLayout>
  )
}

