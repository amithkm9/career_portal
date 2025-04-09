"use client"

import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

function AssessmentContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)] p-4 md:p-8 animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 text-center font-josephine">
        <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">Take the</span>{" "}
        <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">Assessment</span>
      </h1>
      <p className="text-xl mb-12 text-center text-gray-300 max-w-2xl">
        Click the button below to start your career assessment and discover your ideal path.
      </p>
      <Button size="lg" asChild className="bg-[#0066FF] hover:bg-[#0066FF]/80 text-white px-8 py-6 text-lg hover-glow">
        <a href="https://theclassment.mindler.com/" target="_blank" rel="noopener noreferrer">
          Start Assessment
        </a>
      </Button>
    </div>
  )
}

export default function AssessmentPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <AssessmentContent />
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}

