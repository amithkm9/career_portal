"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Ticket, ArrowRight, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react"

export default function CouponPage() {
  const [couponCode, setCouponCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error" | "info">("idle")
  const [message, setMessage] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Check if user already has payment done
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (user) {
        try {
          const { data, error } = await supabase.from("profiles").select("payment_done").eq("id", user.id).single()

          if (!error && data?.payment_done) {
            // User has already paid, redirect to home
            router.push("/")
          }
        } catch (error) {
          console.error("Error checking payment status:", error)
        }
      }
    }

    checkPaymentStatus()
  }, [user, router])

  // Handle countdown for redirection
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      router.push("/")
    }
  }, [countdown, router])

  const validateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsValidating(true)
    setStatus("idle")
    setMessage(null)

    try {
      // Trim the coupon code to handle whitespace
      const trimmedCode = couponCode.trim()
      
      if (!trimmedCode) {
        setStatus("error")
        setMessage("Please enter a coupon code")
        setIsValidating(false)
        return
      }

      if (!user) {
        setStatus("error")
        setMessage("You must be logged in to apply a coupon")
        setIsValidating(false)
        return
      }

      // Call our new API endpoint to validate the coupon
      const response = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          couponCode: trimmedCode,
          userId: user.id,
        }),
      })

      const data = await response.json()

      if (data.valid) {
        // Show success message and start countdown
        setStatus("success")
        setMessage(data.message || "Coupon applied successfully! You now have full access to the platform.")
        setCountdown(5) // 5 second countdown before redirect
      } else {
        // Invalid coupon code
        setStatus("error")
        setMessage(data.message || "Invalid coupon code. Please try again or proceed to payment.")
      }
    } catch (error) {
      console.error("Error validating coupon:", error)
      setStatus("error")
      setMessage(`An error occurred: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsValidating(false)
    }
  }

  const skipToPayment = () => {
    router.push("/payments")
  }

  const getSchedulingLink = () => {
    // Check if the coupon code is NAIROBI to determine which counselor to use
    if (couponCode.trim().toUpperCase() === "NAIROBI") {
      return "https://cal.com/sandra-anyango/60min?duration=60"
    }
    return "https://cal.com/unnathi-pai/career-counselling-with-unnathi"
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
            <span className="text-white">Enter</span>{" "}
            <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">
              Coupon Code
            </span>
          </h1>
        </div>

        <Alert className="bg-blue-500/20 border border-blue-500 text-blue-400">
          <Info className="h-4 w-4" />
          <AlertDescription>Enter a coupon code to get instant access or proceed to payment.</AlertDescription>
        </Alert>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="text-xl">Have a coupon?</CardTitle>
            <CardDescription>Enter your coupon code to get instant access</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={validateCoupon} className="space-y-4">
              <div className="flex items-center space-x-2">
                <Ticket className="h-5 w-5 text-[#0066FF]" />
                <Input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
                  autoFocus
                />
              </div>

              {status === "success" && (
                <Alert className="bg-green-600/20 border border-green-500 text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Success!</AlertTitle>
                  <AlertDescription>
                    {message}
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        className="bg-green-600/20 border-green-500 text-green-400 hover:bg-green-600/30 hover:text-green-300"
                        onClick={() => window.open(getSchedulingLink(), "_blank")}
                      >
                        Schedule Counseling Session
                      </Button>
                    </div>
                    {countdown !== null && (
                      <div className="mt-2">
                        Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {status === "error" && (
                <Alert className="bg-red-600/20 border border-red-500 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              {status === "info" && (
                <Alert className="bg-yellow-600/20 border border-yellow-500 text-yellow-400">
                  <Info className="h-4 w-4" />
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
                disabled={isValidating || status === "success"}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  "Apply Coupon"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-muted px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button variant="outline" onClick={skipToPayment} className="w-full" disabled={status === "success"}>
              Continue to Payment
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            {status === "error" && (
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => window.open("https://cal.com/unnathi-pai/career-counselling-with-unnathi", "_blank")}
              >
                Schedule with Unnathi Pai
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}