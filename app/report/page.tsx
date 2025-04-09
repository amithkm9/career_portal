"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Download, User, Briefcase, Brain, Heart, Star, Lightbulb, ExternalLink } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

interface ReportSummary {
  name: string
  reportTitle: string
  assessmentFramework: string
  orientationStyle: {
    dominantStyle: string
    secondaryStyle: string
    description: string
  }
  interest: {
    dominantInterestAreas: string[]
  }
  personality: {
    dominantTraits: string[]
  }
  aptitude: {
    dominantStrengths: string[]
  }
  emotionalQuotient: {
    dominantAttributes: string[]
  }
  careerMatches: {
    domain: string
    details: string
    link: string
  }[]
}

async function getReportData(userId: string) {
  const { data, error } = await supabase.from("reports").select("report_url, report_summary").eq("id", userId).single()

  if (error) {
    console.error("Error fetching report:", error)
    return { pdfUrl: null, summary: null }
  }

  let parsedSummary = null
  if (data?.report_summary) {
    try {
      // Check if it's already an object
      parsedSummary = typeof data.report_summary === "string" ? JSON.parse(data.report_summary) : data.report_summary
    } catch (e) {
      console.error("Error parsing report summary:", e)
    }
  }

  return {
    pdfUrl: data?.report_url,
    summary: parsedSummary,
  }
}

function ReportSummary({ summary }: { summary: ReportSummary }) {
  return (
    <div className="space-y-6 mb-8">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{summary.name}</p>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Orientation Style
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-[#0066FF]/20 px-3 py-1 text-sm font-medium text-[#0066FF]">
              {summary.orientationStyle.dominantStyle}
            </span>
            <span className="inline-flex items-center rounded-full bg-[#0066FF]/20 px-3 py-1 text-sm font-medium text-[#0066FF]">
              {summary.orientationStyle.secondaryStyle}
            </span>
          </div>
          <p className="text-sm text-gray-300">{summary.orientationStyle.description}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Dominant Interest Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {summary.interest.dominantInterestAreas.map((area, index) => (
                <li key={index} className="text-sm">
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Dominant Personality Traits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {summary.personality.dominantTraits.map((trait, index) => (
                <li key={index} className="text-sm">
                  {trait}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Dominant Aptitude Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {summary.aptitude.dominantStrengths.map((strength, index) => (
                <li key={index} className="text-sm">
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Dominant Emotional Attributes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside">
              {summary.emotionalQuotient.dominantAttributes.map((attribute, index) => (
                <li key={index} className="text-sm">
                  {attribute}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Top Career Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {summary.careerMatches.map((career, index) => (
              <li key={index} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                <h4 className="font-semibold">{career.domain}</h4>
                <p className="text-sm text-gray-400 mt-1">{career.details}</p>
                <a
                  href={career.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-flex items-center"
                >
                  Learn More
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function ReportContent() {
  const { user } = useAuth()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null)
  const [userCouponCode, setUserCouponCode] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      getReportData(user.id).then(({ pdfUrl, summary }) => {
        setPdfUrl(pdfUrl)
        setReportSummary(summary)
      })

      // Get the user's coupon code to determine which scheduling link to use
      supabase
        .from("profiles")
        .select("coupon_code")
        .eq("id", user.id)
        .single()
        .then(({ data, error }) => {
          if (!error && data) {
            setUserCouponCode(data.coupon_code)
          }
        })
    }
  }, [user])

  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-2rem)] p-4 md:p-8 animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 text-center font-josephine">
        <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">Your Career</span>{" "}
        <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">Report</span>
      </h1>

      {reportSummary && <ReportSummary summary={reportSummary} />}

      {pdfUrl ? (
        <div className="w-full max-w-4xl mb-8">
          <Button
            size="lg"
            onClick={() => window.open(pdfUrl, "_blank")}
            className="bg-[#0066FF] hover:bg-[#0066FF]/80 text-white mx-auto flex items-center justify-center gap-2 hover-glow px-8 py-6"
          >
            <Download className="h-5 w-5" />
            Open Full PDF Report
          </Button>
        </div>
      ) : (
        <p className="text-xl mb-8 text-center text-gray-300">
          No report available. Please complete the assessment first.
        </p>
      )}

      <div className="glass-effect p-8 rounded-lg mb-8 max-w-2xl w-full card-hover">
        <h2 className="text-2xl font-semibold mb-4 text-center gradient-text font-space">
          Schedule a Career Counselling Call
        </h2>
        <p className="text-lg mb-8 text-center text-gray-300">
          Book a session with our career coaches to discuss your assessment results and get personalized guidance.
        </p>
        <div className="flex justify-center">
          <Button size="lg" asChild className="bg-[#0066FF] hover:bg-[#0066FF]/80 text-white hover-glow px-8 py-6">
            <a
              href={
                userCouponCode === "NAIROBI"
                  ? "https://cal.com/sandra-anyango/60min?duration=60"
                  : "https://cal.com/unnathi-pai/career-counselling-with-unnathi"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Calendar className="h-5 w-5" />
              Schedule Call
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <ReportContent />
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}

