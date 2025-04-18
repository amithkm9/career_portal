"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { PhoneCheck } from "@/components/auth/phone-check"

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
  const [showPhoneCheck, setShowPhoneCheck] = useState(false)
  const router = useRouter()

  // Function to check if phone number exists
  const checkPhoneNumber = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("phone_number")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error checking phone number:", error)
        return true // Default to not showing prompt if there's an error
      }

      // If phone_number is null, empty, or doesn't exist, show the prompt
      return data && data.phone_number && data.phone_number.trim() !== ""
    } catch (error) {
      console.error("Error in checkPhoneNumber:", error)
      return true // Default to not showing prompt if there's an error
    }
  }

  // Update the checkUserStatus function to handle counselor onboarding
  const checkUserStatus = async (userId: string | undefined) => {
    if (!userId) return

    try {
      // First, check if the user has a phone number
      const hasPhoneNumber = await checkPhoneNumber(userId)
      
      if (!hasPhoneNumber) {
        setShowPhoneCheck(true)
        return // Stop here and wait for phone number entry
      }

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
      
      if (session?.user) {
        checkPhoneNumber(session.user.id).then(hasPhoneNumber => {
          if (!hasPhoneNumber) {
            setShowPhoneCheck(true)
          }
        })
      }
      
      setLoading(false)
    })

    // Update the onAuthStateChange event handler in the useEffect
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)

      // Redirect based on auth state
      if (event === "SIGNED_IN") {
        // Check if user has a phone number
        if (session?.user) {
          checkPhoneNumber(session.user.id).then(hasPhoneNumber => {
            if (!hasPhoneNumber) {
              setShowPhoneCheck(true)
              return
            }
            
            // Phone number exists, continue with normal flow
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

  // Handler for when phone check dialog is closed
  const handlePhoneCheckClose = () => {
    setShowPhoneCheck(false)
    if (user) {
      checkUserStatus(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithEmail, signInWithGoogle, signOut }}>
      {children}
      {showPhoneCheck && user && (
        <PhoneCheck 
          userId={user.id} 
          userEmail={user.email} 
          isOpen={showPhoneCheck} 
          onClose={handlePhoneCheckClose} 
        />
      )}
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