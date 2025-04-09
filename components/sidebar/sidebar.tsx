"use client"

import { ClipboardList, FileText, GitGraphIcon as Graph, HelpCircle, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"

const menuItems = [
  {
    title: "Take the Assessment",
    icon: ClipboardList,
    href: "/assessment",
  },
  {
    title: "View My Report",
    icon: FileText,
    href: "/report",
  },
  {
    title: "Explorer Graph",
    icon: Graph,
    href: "/explorer-graph",
    beta: true,
  },
  {
    title: "Externship",
    icon: HelpCircle,
    href: "/externship",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-6">
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CLASSMENT%20(2)-lQ1Eu5tpNT330CGo4VZZN7VnNaXDRe.png"
          alt="ClassMent Logo"
          className="w-10 h-10 mr-3"
        />
        <h1 className="text-xl font-bold font-josephine text-white uppercase">CLASSMENT</h1>
      </div>
      <nav className="px-3 flex-1">
        <ul className="space-y-1">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 hover:bg-[#1E3A59]/50 ${
                  pathname === item.href ? "bg-[#1E3A59] text-white" : "text-gray-300"
                }`}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium flex items-center gap-2">
                  {item.title}
                  {item.beta && (
                    <span className="px-1.5 py-0.5 text-xs font-medium bg-[#0066FF]/20 text-[#0066FF] rounded-full">
                      Beta
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 hover:bg-background/10"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent
            side="left"
            className="w-[280px] p-0 bg-[#0A1629]/95 backdrop-blur-md border-r border-[#1E3A59]"
          >
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#0A1629]/95 backdrop-blur-md border-r border-[#1E3A59] hidden md:block">
      <SidebarContent />
    </aside>
  )
}

