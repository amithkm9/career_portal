"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { User, Briefcase } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState<"student" | "counselor" | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleContinue = async () => {
    if (!selectedRole) return

    setIsLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      if (selectedRole === "counselor") {
        // For counselors, we don't need to update the profiles table
        // Instead, we'll check if they've already completed onboarding
        const { data: counselorData, error: counselorError } = await supabase
          .from("career_counselors")
          .select("id")
          .eq("id", user.id)
          .single()

        if (counselorError && counselorError.code === "PGRST116") {
          // Counselor hasn't completed onboarding, redirect to onboarding
          router.push("/counselor/onboarding")
        } else {
          // Counselor has already completed onboarding, redirect to dashboard
          router.push("/counselor/dashboard")
        }
      } else {
        // For students, update their profile without setting a role
        const { error: updateError } = await supabase.from("profiles").upsert({
          id: user.id,
          // No role field needed as all profiles are students
        })

        if (updateError) {
          console.error("Error updating profile:", updateError)
        }

        // Check if they've completed the assessment and payment
        const { data, error } = await supabase
          .from("profiles")
          .select("atp_done, payment_done")
          .eq("id", user.id)
          .single()

        if (error) {
          console.error("Error checking user status:", error)
          // If there's an error, assume they're new and send to app-to-tap
          router.push("/app-to-tap")
          return
        }

        // Direct to the appropriate page based on their progress
        if (!data.atp_done) {
          router.push("/app-to-tap")
        } else if (!data.payment_done) {
          router.push("/coupon")
        } else {
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Error in role selection:", error)
      // If there's an error, default to the app-to-tap page for safety
      if (selectedRole === "student") {
        router.push("/app-to-tap")
      } else {
        router.push("/counselor/onboarding")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-background to-background/95">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CLASSMENT%20(2)-lQ1Eu5tpNT330CGo4VZZN7VnNaXDRe.png"
            alt="ClassMent Logo"
            className="w-16 h-16 mb-4"
          />
          <h1 className="text-3xl font-bold text-center">
            <span className="text-white">Welcome to </span>
            <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">ClassMent</span>
          </h1>
        </div>

        <Card className="glass-effect">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-2">Tell us about yourself</h2>
            <p className="text-sm text-gray-400 mb-6">Select your role to continue</p>

            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg cursor-pointer border transition-all ${
                  selectedRole === "student"
                    ? "border-[#0066FF] bg-[#0066FF]/10"
                    : "border-gray-700 hover:border-gray-500"
                }`}
                onClick={() => setSelectedRole("student")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0066FF]/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-[#0066FF]" />
                  </div>
                  <div>
                    <h3 className="font-medium">Student</h3>
                    <p className="text-sm text-gray-400">I'm looking for career guidance and opportunities</p>
                  </div>
                </div>
              </div>

              <div
                className={`p-4 rounded-lg cursor-pointer border transition-all ${
                  selectedRole === "counselor"
                    ? "border-[#9333EA] bg-[#9333EA]/10"
                    : "border-gray-700 hover:border-gray-500"
                }`}
                onClick={() => setSelectedRole("counselor")}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#9333EA]/20 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-[#9333EA]" />
                  </div>
                  <div>
                    <h3 className="font-medium">Career Counselor</h3>
                    <p className="text-sm text-gray-400">I provide career guidance and mentorship to students</p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 text-white mt-4"
                disabled={!selectedRole || isLoading}
                onClick={handleContinue}
              >
                {isLoading ? "Processing..." : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

