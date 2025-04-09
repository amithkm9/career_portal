"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/protected-route"
import { AuthenticatedLayout } from "@/components/layouts/authenticated-layout"

async function getJobs() {
  const { data, error } = await supabase.from("jobs").select("*")
  if (error) {
    console.error("Error fetching jobs:", error)
    return []
  }
  return data
}

function JobsContent({ jobs }: { jobs: any[] }) {
  return (
    <div className="flex flex-col items-center justify-start min-h-[calc(100vh-2rem)] p-4 md:p-8 animate-fade-in">
      <h1 className="text-4xl font-bold mb-6 text-center font-josephine">
        <span className="bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent">Job</span>{" "}
        <span className="bg-gradient-to-r from-white/80 to-[#0055FE] bg-clip-text text-transparent">Marketplace</span>
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
        {jobs.map((job) => (
          <Card key={job.id} className="bg-muted/50 glass-effect card-hover">
            <CardHeader>
              <CardTitle className="text-lg font-space">{job.title}</CardTitle>
              <CardDescription className="text-gray-400">{job.company}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow h-[100px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#0066FF] scrollbar-track-transparent hover:scrollbar-thumb-[#0066FF]/70">
              <p className="text-sm text-gray-300">{job.description}</p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild className="w-full bg-[#0066FF] hover:bg-[#0066FF]/80 text-white hover-glow">
                <a href={job.application_link} target="_blank" rel="noopener noreferrer">
                  Apply Now
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default async function JobsPage() {
  const jobs = await getJobs()

  return (
    <ProtectedRoute>
      <AuthenticatedLayout>
        <JobsContent jobs={jobs} />
      </AuthenticatedLayout>
    </ProtectedRoute>
  )
}

