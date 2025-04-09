"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { AlertCircle } from "lucide-react"

export default function CounselorOnboarding() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    age: "",
    country: "",
    experience_years: "",
    specialization: "",
    linkedin_profile: "",
    bio: "",
  })
  const [specializations, setSpecializations] = useState<string[]>([])
  const [specializationInput, setSpecializationInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const addSpecialization = () => {
    if (specializationInput.trim() && !specializations.includes(specializationInput.trim())) {
      setSpecializations([...specializations, specializationInput.trim()])
      setSpecializationInput("")
    }
  }

  const removeSpecialization = (index: number) => {
    setSpecializations(specializations.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!user) throw new Error("User not authenticated")

      // Create counselor profile
      const { error: insertError } = await supabase.from("career_counselors").insert({
        id: user.id,
        email: user.email,
        name: formData.name,
        phone_number: formData.phone_number,
        age: Number.parseInt(formData.age) || null,
        country: formData.country,
        experience_years: Number.parseInt(formData.experience_years) || null,
        specialization: specializations.join(", "),
        linkedin_profile: formData.linkedin_profile,
        bio: formData.bio,
      })

      if (insertError) throw insertError

      // Update profile to grant full access
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          payment_done: true,
          atp_done: true,
        })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Redirect to counselor dashboard
      router.push("/counselor/dashboard")
    } catch (err) {
      console.error("Error creating counselor profile:", err)
      setError("Failed to create your profile. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto p-4 py-8">
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CLASSMENT%20(2)-lQ1Eu5tpNT330CGo4VZZN7VnNaXDRe.png"
            alt="ClassMent Logo"
            className="w-16 h-16 mb-4"
          />
          <h1 className="text-3xl font-bold text-center">
            <span className="text-white">Career Counselor </span>
            <span className="bg-gradient-to-r from-white/80 to-[#9333EA] bg-clip-text text-transparent">
              Onboarding
            </span>
          </h1>
          <p className="text-gray-400 mt-2 text-center">
            Please provide your professional details to complete your profile setup
          </p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-500/10 border-red-500 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 glass-effect p-6 rounded-lg">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Professional Information</h2>
            <p className="text-sm text-gray-400">
              This information will be visible to students and help them connect with you
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                className="bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">
                Age <span className="text-gray-400 text-sm">(must be over 18)</span>
              </Label>
              <Input
                id="age"
                name="age"
                type="number"
                min="18"
                value={formData.age}
                onChange={handleChange}
                className="bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">
                Country <span className="text-red-500">*</span>
              </Label>
              <Input
                id="country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                required
                className="bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years">Years of Experience</Label>
              <Input
                id="experience_years"
                name="experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={handleChange}
                className="bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin_profile">LinkedIn Profile URL</Label>
              <Input
                id="linkedin_profile"
                name="linkedin_profile"
                placeholder="https://linkedin.com/in/yourprofile"
                value={formData.linkedin_profile}
                onChange={handleChange}
                className="bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Specializations <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., STEM, Business, Arts"
                value={specializationInput}
                onChange={(e) => setSpecializationInput(e.target.value)}
                className="bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
              />
              <Button type="button" onClick={addSpecialization} className="bg-[#9333EA] hover:bg-[#9333EA]/90">
                Add
              </Button>
            </div>
            {specializations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {specializations.map((spec, index) => (
                  <div
                    key={index}
                    className="bg-[#9333EA]/20 text-[#9333EA] px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    {spec}
                    <button
                      type="button"
                      className="ml-2 text-[#9333EA] hover:text-[#9333EA]/70"
                      onClick={() => removeSpecialization(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="Tell students about your experience, expertise, and approach to career counseling..."
              value={formData.bio}
              onChange={handleChange}
              className="min-h-[150px] bg-background/50 border-[#9333EA]/30 focus:border-[#9333EA]"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-[#9333EA] hover:bg-[#9333EA]/90 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Profile..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  )
}

