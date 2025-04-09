"use client"

import type React from "react"
import { AppSidebar } from "@/components/sidebar/sidebar"
import { usePathname } from "next/navigation"

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showSidebar = pathname !== "/app-to-tap"

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showSidebar && <AppSidebar />}
      <main className={showSidebar ? "md:ml-64" : ""}>{children}</main>
    </div>
  )
}

