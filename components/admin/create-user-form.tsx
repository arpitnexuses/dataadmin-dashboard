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
  const [logoUrl, setLogoUrl] = useState("")
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
      formData.append("logoUrl", logoUrl)
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
      setLogoUrl("")
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title of File</Label>
          <Input
            id="title"
            placeholder="Monthly Sales Report"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
          <Input
            id="logoUrl"
            placeholder="https://example.com/logo.png"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="file">Upload Data (CSV/Excel)</Label>
          <Input
            id="file"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
          <p className="text-sm text-muted-foreground">Upload a CSV or Excel file with the data to be displayed</p>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create User"
          )}
        </Button>
      </form>
    </div>
  )
}

