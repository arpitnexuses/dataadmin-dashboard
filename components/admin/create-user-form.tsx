"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface CreateUserFormProps {
  onSuccess?: () => void
  onUserCreated?: () => void
}

export function CreateUserForm({ onSuccess, onUserCreated }: CreateUserFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!file) {
      setError("Please upload a data file")
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      formData.append("title", title)
      formData.append("file", file)

      const response = await fetch("/api/admin/users", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create user")
      }

      // Show success toast
      toast({
        title: "Success",
        description: "User created successfully",
        variant: "default",
        className: "bg-green-50 text-green-800 border-green-200",
      })

      // Reset form
      setEmail("")
      setPassword("")
      setTitle("")
      setFile(null)
      
      // Call callbacks
      onSuccess?.()
      onUserCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-400">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-[#1C1C1C] border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-zinc-700 focus:border-zinc-700"
              placeholder="user@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-zinc-400">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-[#1C1C1C] border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-zinc-700 focus:border-zinc-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-zinc-400">Title of File</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-[#1C1C1C] border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-zinc-700 focus:border-zinc-700"
              placeholder="Monthly Sales Report"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file" className="text-zinc-400">Upload Data (CSV/Excel)</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".csv,.xlsx,.xls"
              className="bg-[#1C1C1C] border-zinc-800 text-white file:bg-zinc-900 file:text-white file:border-0 file:mr-4 file:py-2 file:px-4 hover:file:bg-zinc-800"
            />
            <p className="text-sm text-zinc-500">Upload a CSV or Excel file with the data to be displayed</p>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? "Creating..." : "Create User"}
        </Button>
      </form>
    </div>
  )
}

