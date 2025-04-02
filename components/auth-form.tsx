"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface AuthFormProps {
  type: "login" | "signup"
  isAdmin?: boolean
  showSignup?: boolean
  variant?: "default" | "admin"
}

export function AuthForm({ type, isAdmin = false, showSignup = false, variant = "default" }: AuthFormProps) {
  const router = useRouter()
  const [formType, setFormType] = useState<"login" | "signup">(type)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const colors = {
    default: {
      primary: "#1D9EE3",
      gradient: "from-[#1D9EE3] to-[#60a5fa]",
      ring: "ring-[#1D9EE3]/20",
      hover: "hover:bg-[#1D9EE3]/90",
    },
    admin: {
      primary: "#0D9488",
      gradient: "from-[#0D9488] to-[#2DD4BF]",
      ring: "ring-[#0D9488]/20",
      hover: "hover:bg-[#0D9488]/90",
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const endpoint = isAdmin ? (formType === "login" ? "/api/admin/login" : "/api/admin/signup") : "/api/login"

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed")
      }

      // Redirect based on user role
      if (isAdmin) {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const toggleFormType = () => {
    setFormType(formType === "login" ? "signup" : "login")
    setError("")
  }

  return (
    <div className="w-full max-w-md">
      <div className="relative group">
        {/* Animated background blur effect */}
        <div className={cn("absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000 group-hover:duration-200 animate-tilt", colors[variant].gradient)}></div>
        
        {/* Main card with glass effect */}
        <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl transition-all duration-300 ease-in-out transform hover:scale-[1.01] hover:shadow-2xl">
          <div className="flex flex-col items-center space-y-4 mb-8">
            {/* Logo without animation */}
            <div className="relative w-48 h-12">
              <Image
                src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses_logo_blue_(2)_3_721ee160-2cac-429c-af66-f55b7233f6ed.png"
                alt="Nexuses Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-2xl font-semibold" style={{ color: colors[variant].primary }}>{isAdmin ? "Admin" : "Welcome"}</h2>
            <p className="text-gray-600 text-sm animate-fade-in-delay">
              {isAdmin ? "Enter your admin credentials" : "Enter your credentials"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6 animate-shake">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 group/input">
              <label className="block text-sm text-gray-600 transition-colors" style={{ color: colors[variant].primary }}>Email address</label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn("w-full border border-gray-200 rounded-lg px-4 py-2.5 transition-all duration-300 hover:border-gray-300", `focus:border-[${colors[variant].primary}]`, colors[variant].ring)}
              />
            </div>
            <div className="space-y-2 group/input">
              <label className="block text-sm text-gray-600 transition-colors" style={{ color: colors[variant].primary }}>Password</label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn("w-full border border-gray-200 rounded-lg px-4 py-2.5 transition-all duration-300 hover:border-gray-300", `focus:border-[${colors[variant].primary}]`, colors[variant].ring)}
              />
            </div>
            <Button 
              type="submit" 
              className={cn("w-full text-white py-2.5 rounded-lg transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-lg disabled:hover:transform-none", colors[variant].hover)}
              style={{ backgroundColor: colors[variant].primary }}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={toggleFormType}
                className={cn("font-medium transition-all duration-300 hover:underline decoration-2 underline-offset-4", colors[variant].hover)}
                style={{ color: colors[variant].primary }}
              >
                Contact admin
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

