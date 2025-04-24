"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Copy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

interface DeleteUserDialogProps {
  userId: string
  userEmail: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeleteUserDialog({ userId, userEmail, isOpen, onClose, onSuccess }: DeleteUserDialogProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(userEmail)
    toast({
      title: "Email copied",
      description: "The email has been copied to your clipboard",
      variant: "default",
      className: "bg-green-50 text-green-800 border-green-200",
    })
  }

  const handleDelete = async () => {
    if (email !== userEmail) {
      setError("Email does not match")
      return
    }

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete user")
      }

      toast({
        title: "Success",
        description: "User deleted successfully",
        variant: "default",
        className: "bg-green-50 text-green-800 border-green-200",
      })

      onSuccess()
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete user"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white">Delete User</DialogTitle>
          <DialogDescription className="text-zinc-400">
            This action cannot be undone. Please type the user's email to confirm deletion.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-zinc-400">Email to delete</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyEmail}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="p-2 rounded-md bg-zinc-800 text-zinc-300 text-sm">
              {userEmail}
            </div>
            <Label htmlFor="email" className="text-zinc-400">Confirm by typing the email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Type the email to confirm"
              className="bg-[#1C1C1C] border-zinc-800 text-white placeholder:text-zinc-500 focus:ring-zinc-700 focus:border-zinc-700"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || email !== userEmail}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Deleting..." : "Delete User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 