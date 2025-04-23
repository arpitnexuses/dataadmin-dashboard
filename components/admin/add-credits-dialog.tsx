import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { CheckCircle2 } from "lucide-react"

interface AddCreditsDialogProps {
  userId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (newCredits: number) => void
}

export function AddCreditsDialog({ userId, isOpen, onClose, onSuccess }: AddCreditsDialogProps) {
  const [credits, setCredits] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!credits || isNaN(Number(credits)) || Number(credits) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of credits",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/users/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          credits: Number(credits)
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add credits')
      }

      const data = await response.json()
      
      // Show success state
      setShowSuccess(true)
      
      // Update parent component
      onSuccess(data.credits)

      // Refresh user's dashboard data
      try {
        await fetch('/api/user/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        })
      } catch (error) {
        console.error('Error refreshing user dashboard:', error)
      }

      // Close dialog after 2 seconds
      setTimeout(() => {
        onClose()
        setShowSuccess(false)
        setCredits("")
      }, 2000)
    } catch (error) {
      console.error('Error adding credits:', error)
      toast({
        title: "Error",
        description: "Failed to add credits. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <DialogTitle className="text-xl font-semibold text-center">
              Credits Added Successfully!
            </DialogTitle>
            <p className="text-muted-foreground text-center mt-2">
              {credits} credits have been added to the user's account.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Add Credits</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="credits" className="text-right">
                  Credits
                </Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  value={credits}
                  onChange={(e) => setCredits(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter number of credits"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                {isLoading ? "Adding..." : "Add Credits"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
} 