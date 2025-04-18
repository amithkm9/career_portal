"use client"

import type React from "react"

import { useState, Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { RoleSelector } from "@/components/auth/role-selector"
import { Loader2 } from "lucide-react"

function getRedirectFrom(searchParams: URLSearchParams) {
  return searchParams.get("redirectedFrom") || "/"
}

function LoginPageContent() {
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const { signInWithGoogle, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is already logged in
  useEffect(() => {
    if (user) {
      setShowRoleSelector(true)
    }
  }, [user])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      setShowOtpInput(true)
      setMessage("Check your email for the OTP!")
    } catch (error) {
      setMessage("Error sending OTP")
    } finally {
      setLoading(false)
    }
  }

  // Update the verifyOTP function
  const verifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      })
      if (error) throw error

      // If verification successful, auth context will handle the phone number check and redirects
      if (data.user) {
        // The auth context will handle redirects based on whether phone number exists
        setMessage("Verification successful! Redirecting...")
      }
    } catch (error) {
      setMessage("Invalid OTP")
    } finally {
      setLoading(false)
    }
  }

  // Update the handleGoogleSignIn function
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle()
      // Auth context will handle the phone number check and role selection
    } catch (error) {
      console.error("Google sign in error:", error)
      setMessage("Error signing in with Google")
    }
  }

  if (showRoleSelector) {
    return <RoleSelector />
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
            <span className="text-white">Login to Career</span>{" "}
            <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">
              Accelerator
            </span>
          </h1>
        </div>

        <div className="glass-effect p-6 md:p-8 rounded-lg space-y-6">
          {!showOtpInput ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
              />
              <Button type="submit" className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Continue with Email"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={verifyOTP} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
              />
              <Button type="submit" className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </Button>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-muted px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {message && (
            <Alert className="mt-4">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}