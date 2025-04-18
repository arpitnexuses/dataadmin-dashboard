import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Suspense } from "react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Admin & User Authentication System",
  description: "A full-stack authentication system with file upload functionality",
    generator: 'v0.dev'
}

export default function RootLayout({
  
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className='main'>
            <div className='gradient'/>
          </div>
          <main className="app">
            <Suspense fallback={<div className="min-h-screen w-full bg-[#1C1C1C] text-gray-400">Loading...</div>}>
              {children}
            </Suspense>
          </main>
          <link rel="icon" href="/assets/images/logo.svg" sizes="any" />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'