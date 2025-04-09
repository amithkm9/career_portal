"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { UserCircle, ArrowRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

async function getUserStatus(userId: string) {
  const { data, error } = await supabase.from("profiles").select("atp_done, payment_done").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user status:", error)
    return null
  }

  return data
}

export default function HomePage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [atpDone, setAtpDone] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      getUserStatus(user.id).then((status) => {
        if (status) {
          setAtpDone(status.atp_done)
          setPaymentDone(status.payment_done)
          if (!status.atp_done) {
            router.push("/app-to-tap")
          } else if (!status.payment_done) {
            router.push("/payments")
          }
        }
      })
    }
  }, [loading, user, router])

  if (loading || !user || !atpDone || !paymentDone) {
    return null
  }

  const content = (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4 z-50">
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

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)] px-4 md:px-6 animate-slide-up max-w-6xl mx-auto">
        <h1 className="font-space text-3xl md:text-5xl lg:text-7xl font-bold mb-6 md:mb-8 text-center gradient-text leading-tight">
          Welcome to Your Career Journey
        </h1>
        <p className="text-lg md:text-xl mb-8 md:mb-12 max-w-2xl text-center text-gray-400 leading-relaxed font-light">
          Your path to professional success starts here. Take assessments, explore opportunities, and unlock your
          potential with personalized guidance.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 md:gap-6 w-full sm:w-auto">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-6 md:px-8 py-6 text-lg hover-glow rounded-2xl w-full sm:w-auto"
            onClick={() => router.push("/assessment")}
          >
            Start Assessment
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )

  return <AuthenticatedLayout>{content}</AuthenticatedLayout>
}

