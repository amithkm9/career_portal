"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { AlertCircle, CheckCircle2 } from "lucide-react"

interface PhoneCheckProps {
  userId: string
  userEmail: string | undefined
  isOpen: boolean
  onClose: () => void
}

export function PhoneCheck({ userId, userEmail, isOpen, onClose }: PhoneCheckProps) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber.trim()) {
      setStatus("error")
      setErrorMessage("Please enter a phone number")
      return
    }

    setIsSubmitting(true)
    setStatus("idle")

    try {
      // Update the user profile with the phone number
      const { error } = await supabase
        .from("profiles")
        .update({ phone_number: phoneNumber })
        .eq("id", userId)

      if (error) throw error

      setStatus("success")
      
      // Wait 1 second before closing the dialog and redirecting
      setTimeout(() => {
        onClose()
        checkUserStatus(userId)
      }, 1000)
    } catch (error) {
      console.error("Error updating phone number:", error)
      setStatus("error")
      setErrorMessage("Failed to update phone number. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Function to check user status and redirect accordingly
  const checkUserStatus = async (userId: string) => {
    try {
      // First check if user is a counselor
      const { data: counselorData, error: counselorError } = await supabase
        .from("career_counselors")
        .select("id")
        .eq("id", userId)
        .single()

      if (!counselorError) {
        // User is a counselor and has completed onboarding
        router.push("/counselor/dashboard")
        return
      }

      // Check if they're a student and their progress
      const { data, error } = await supabase
        .from("profiles")
        .select("atp_done, payment_done")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error checking user status:", error)
        router.push("/app-to-tap")
        return
      }

      // Handle student flow
      if (!data.atp_done) {
        router.push("/app-to-tap")
      } else if (!data.payment_done) {
        router.push("/coupon")
      } else {
        router.push("/")
      }
    } catch (error) {
      console.error("Error in checkUserStatus:", error)
      router.push("/app-to-tap")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] glass-effect">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Welcome to ClassMent!
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-400">
              Please provide your phone number so we can contact you during our beta phase.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
            />
          </div>

          {status === "success" && (
            <Alert className="bg-green-600/20 border border-green-500 text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>Phone number updated successfully!</AlertDescription>
            </Alert>
          )}

          {status === "error" && (
            <Alert className="bg-red-600/20 border border-red-500 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-[#0066FF] hover:bg-[#0066FF]/90 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Continue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}