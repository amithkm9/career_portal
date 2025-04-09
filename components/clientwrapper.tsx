"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/components/store/store"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { AuthProvider } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import type React from "react" // Added import for React

export function ClientWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const userSession = useStore((state) => state.userSession)
  const setUserSessionAndProfileDetails = useStore((state) => state.setUserSessionAndProfileDetails)

  useEffect(() => {
    const sessionFunc = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        const {
          data: [profileDetails],
          error,
        } = await supabase.from("users").select().eq("id", session.user.id)
        if (profileDetails) {
          setUserSessionAndProfileDetails(session, profileDetails)
        } else {
          router.push("/")
        }
      } else {
        router.push("/")
      }
    }

    if (!userSession || !Object.keys(userSession).length) {
      sessionFunc()
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUserSessionAndProfileDetails(null, null)
        router.push("/")
      } else if (event === "SIGNED_IN") {
        sessionFunc()
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [userSession, router, setUserSessionAndProfileDetails])

  return (
    <AuthProvider>
      <div className="flex min-h-screen bg-background text-foreground">
        <div className="w-0">
          <AppSidebar />
        </div>
        <main className="flex-1 pl-64 p-6 animate-fade-in">{children}</main>
      </div>
    </AuthProvider>
  )
}

