"use client"

import type React from "react"
import { CounselorSidebar } from "@/components/sidebar/counselor-sidebar"
import { usePathname } from "next/navigation"

export function CounselorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <CounselorSidebar />
      <main className="md:ml-64 p-6 animate-fade-in">{children}</main>
    </div>
  )
}

