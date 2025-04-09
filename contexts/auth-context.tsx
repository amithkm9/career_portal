"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithEmail: (email: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Update the checkUserStatus function to handle counselor onboarding
  const checkUserStatus = async (userId: string | undefined) => {
    if (!userId) return

    try {
      // First, check if the user is a counselor
      const { data: counselorData, error: counselorError } = await supabase
        .from("career_counselors")
        .select("id")
        .eq("id", userId)
        .single()

      // If user exists in career_counselors table, they're a counselor
      if (!counselorError) {
        // Counselor has completed onboarding
        router.push("/counselor/dashboard")
        return
      }

      // If not a counselor or onboarding not complete, check if they're a student
      const { data, error } = await supabase.from("profiles").select("atp_done, payment_done").eq("id", userId).single()

      if (error) {
        console.error("Error checking user status:", error)
        router.push("/app-to-tap")
        return
      }

      // Handle student flow
      if (!data.atp_done) {
        router.push("/app-to-tap")
      } else if (!data.payment_done) {
        // If ATP is done but payment is not, redirect to coupon page
        router.push("/coupon")
      } else {
        // If both ATP and payment are done, redirect to home
        router.push("/")
      }
    } catch (error) {
      console.error("Error in checkUserStatus:", error)
      router.push("/app-to-tap")
    }
  }

  // Update the onAuthStateChange event handler
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Update the onAuthStateChange event handler in the useEffect
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)

      // Redirect based on auth state
      if (event === "SIGNED_IN") {
        // Check if user exists in the database
        if (session?.user) {
          // First check if user is a counselor
          supabase
            .from("career_counselors")
            .select("id")
            .eq("id", session.user.id)
            .single()
            .then(({ data: counselorData, error: counselorError }) => {
              if (!counselorError) {
                // User is a counselor and has completed onboarding
                router.push("/counselor/dashboard")
                return
              }

              // If not a counselor with completed onboarding, check if they're in profiles
              supabase
                .from("profiles")
                .select("atp_done, payment_done")
                .eq("id", session.user.id)
                .single()
                .then(({ data: profile, error: profileError }) => {
                  if (profileError) {
                    // User doesn't exist in either table, send to role selection
                    router.push("/role-selection")
                    return
                  }

                  // User is a student, check their progress
                  if (!profile.atp_done) {
                    router.push("/app-to-tap")
                  } else if (!profile.payment_done) {
                    router.push("/coupon")
                  } else {
                    router.push("/")
                  }
                })
            })
        } else {
          router.push("/role-selection")
        }
      } else if (event === "SIGNED_OUT") {
        router.push("/login")
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router])

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

