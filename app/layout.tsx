import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"
import type React from "react"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
})
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${plusJakarta.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="icon"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20BG%20removed-TvHIn4fFUVIkNYDsmZZHnJG7c7hKwM.png"
        />
        <link
          rel="apple-touch-icon"
          href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20BG%20removed-TvHIn4fFUVIkNYDsmZZHnJG7c7hKwM.png"
        />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={plusJakarta.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'

export const metadata = {
      generator: 'v0.dev'
    };
