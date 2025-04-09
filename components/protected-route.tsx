"use client"

import type React from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [paymentDone, setPaymentDone] = useState<boolean | null>(null)
  const [atpDone, setAtpDone] = useState<boolean | null>(null)

  useEffect(() => {
    async function checkUserStatus() {
      if (user) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("payment_done, atp_done")
            .eq("id", user.id)
            .single()

          if (error) {
            console.error("Error fetching user status:", error)
            return
          }

          setPaymentDone(data.payment_done)
          setAtpDone(data.atp_done)

          // Don't redirect if we're on the app-to-tap page or coupon page
          const currentPath = window.location.pathname
          if (currentPath === "/app-to-tap" || currentPath === "/coupon" || currentPath === "/payments") {
            return
          }

          // If ATP is not done, redirect to app-to-tap
          if (!data.atp_done) {
            router.replace("/app-to-tap")
            return
          }

          // If ATP is done but payment is not, redirect to coupon page
          if (data.atp_done && !data.payment_done) {
            router.replace("/coupon")
            return
          }
        } catch (error) {
          console.error("Error in checkUserStatus:", error)
        }
      }
    }

    if (!loading) {
      if (!user) {
        router.replace("/login")
      } else {
        checkUserStatus()
      }
    }
  }, [user, loading, router])

  if (loading || paymentDone === null || atpDone === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin" size={48} />
      </div>
    )
  }

  // Allow access to app-to-tap regardless of payment status
  if (window.location.pathname === "/app-to-tap") {
    return children
  }

  // Allow access to coupon and payments pages if ATP is done
  if ((window.location.pathname === "/coupon" || window.location.pathname === "/payments") && atpDone) {
    return children
  }

  // For all other protected routes, require both ATP and payment
  if (!user || !paymentDone || !atpDone) {
    return null
  }

  return children
}

