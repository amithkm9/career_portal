"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

function ExplorerGraphContent() {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-2rem)] p-4 md:p-8 animate-fade-in">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-6 text-center font-josephine">
          <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">Career</span>{" "}
          <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">
            Explorer Graph
          </span>
          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400">
            Beta
          </span>
        </h1>

        <Alert className="mb-8 border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-400">
            The Explorer Graph is currently in beta. We're actively improving it based on user feedback.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 mb-8">
          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>What is Explorer Graph?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <p>
                Explorer Graph is our innovative career visualization tool that helps you understand the relationships
                between different career paths, skills, and opportunities.
              </p>
              <ul className="space-y-2 list-disc pl-6">
                <li>Visualize career paths and their interconnections</li>
                <li>Explore skill requirements and progression paths</li>
                <li>Understand salary ranges and growth potential</li>
                <li>Discover related careers based on your interests</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardHeader>
              <CardTitle>Beta Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-300">
              <ul className="space-y-2 list-disc pl-6">
                <li>Interactive career path visualization</li>
                <li>Skill mapping and requirements analysis</li>
                <li>Salary insights and trends</li>
                <li>Career similarity clustering</li>
                <li>Custom path recommendations</li>
              </ul>
              <p className="text-sm text-gray-400 mt-4">
                Note: Features and functionality may change as we continue to improve the Explorer Graph based on user
                feedback.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center">
          <Button
            size="lg"
            className="bg-[#0066FF] hover:bg-[#0066FF]/80 text-white px-8 py-6 text-lg hover-glow"
            asChild
          >
            <a
              href="https://theclassment.streamlit.app/Explorer_Lab"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              Launch Explorer Graph
              <ExternalLink className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ExplorerGraphPage() {
  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <ExplorerGraphContent />
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}

