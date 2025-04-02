"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AddFileFormProps {
  userId: string
  onSuccess?: () => void
}

export function AddFileForm({ userId, onSuccess }: AddFileFormProps) {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!file) {
      setError("Please upload a data file")
      setLoading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("title", title || file.name)

      const response = await fetch(`/api/admin/users/${userId}/file`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file")
      }

      setSuccess("File uploaded successfully")
      // Reset form
      setTitle("")
      setFile(null)
      // Call onSuccess callback if provided
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="title">File Title (Optional)</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for the file"
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
            Uploading...
          </>
        ) : (
          "Upload File"
        )}
      </Button>
    </form>
  )
} 