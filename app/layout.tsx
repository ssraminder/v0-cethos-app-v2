import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AppNavigation } from "@/components/app-navigation"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "Cethos Quote Platform",
  description: "Professional translation services platform",
  generator: "v0.app",
  robots: "noindex",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="robots" content="noindex" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <AppNavigation />
          <main className="min-h-screen bg-background">{children}</main>
          <footer className="border-t border-border py-4">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">© Cethos</div>
          </footer>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
