"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

function ExternshipContent() {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    interest: "",
  })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")

    try {
      const { error } = await supabase.from("externship").insert({
        user_id: user?.id,
        name: formData.name,
        contact_number: formData.phone,
        interest: formData.interest,
      })
      if (error) throw error
      setStatus("success")
      setFormData({ name: "", phone: "", interest: "" })
    } catch (error) {
      console.error("Error submitting form:", error)
      setStatus("error")
    }
  }

  return (
    <div className="flex flex-col items-center justify-start pt-8 px-4 space-y-8 animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 text-center font-josephine">
        <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">Apply for</span>{" "}
        <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">Externship</span>
      </h1>
      <div className="grid gap-6 w-full max-w-2xl">
        <Card className="glass-effect card-hover">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold font-space">What is an Externship?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg mb-6 text-gray-300">
              An externship is a short-term work experience opportunity that allows you to observe industry
              professionals in your field of interest. It can last from two to four weeks.
            </p>
            <h3 className="text-xl font-semibold mb-4 gradient-text font-space">Why sign up for an externship?</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-2">
                <span className="text-[#0066FF]">•</span> Work directly with industry leaders
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#0066FF]">•</span> Deliver a project by the end of it
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#0066FF]">•</span> Get a score card that details your skillset
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#0066FF]">•</span> Chance to have a referral from the industry leader
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#0066FF]">•</span> Guaranteed certification upon completion
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#0066FF]">•</span> Network with leaders and join the community
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-2xl glass-effect p-8 rounded-lg card-hover">
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-300">
            Name
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            required
            className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-2 text-gray-300">
            Contact Number
          </label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            required
            className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
          />
        </div>

        <div>
          <label htmlFor="interest" className="block text-sm font-medium mb-2 text-gray-300">
            Area of Interest
          </label>
          <Textarea
            id="interest"
            value={formData.interest}
            onChange={(e) => setFormData((prev) => ({ ...prev, interest: e.target.value }))}
            required
            className="bg-background/50 border-[#0066FF]/30 focus:border-[#0066FF]"
          />
        </div>

        <Button
          type="submit"
          disabled={status === "loading"}
          className="w-full bg-[#0066FF] hover:bg-[#0066FF]/80 text-white hover-glow"
        >
          {status === "loading" ? "Submitting..." : "Submit"}
        </Button>

        {status === "success" && (
          <Alert className="bg-green-600/20 border border-green-500 text-green-400">
            <AlertDescription>Thank you for your interest! We will get back to you soon.</AlertDescription>
          </Alert>
        )}

        {status === "error" && (
          <Alert className="bg-red-600/20 border border-red-500 text-red-400">
            <AlertDescription>Something went wrong. Please try again.</AlertDescription>
          </Alert>
        )}
      </form>
    </div>
  )
}

export default function ExternshipPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <ExternshipContent />
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}

