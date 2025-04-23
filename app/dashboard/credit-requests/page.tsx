"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, XCircle, Clock, Plus, CreditCard, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { format } from "date-fns"
import Link from "next/link"

interface CreditRequest {
  _id: string
  amount: number
  status: "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
}

export default function CreditRequestsPage() {
  const [requests, setRequests] = useState<CreditRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [amount, setAmount] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/user/credit-requests")
      if (!response.ok) throw new Error("Failed to fetch requests")
      const data = await response.json()
      setRequests(data.requests)
    } catch (error) {
      toast.error("Failed to fetch requests")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch("/api/user/credit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount) }),
      })

      if (!response.ok) throw new Error("Failed to create request")

      toast.success("Credit request created successfully")
      setShowDialog(false)
      setAmount("")
      fetchRequests()
    } catch (error) {
      toast.error("Failed to create request")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-900">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Credit Requests</h1>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-zinc-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Request Credits
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Credits</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-black hover:bg-zinc-800 text-white">
                Submit Request
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.length === 0 ? (
          <Card className="bg-white border border-zinc-200 shadow-sm col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-zinc-500 text-center space-y-2">
                <p>You haven't submitted any credit requests yet.</p>
                <Button 
                  onClick={() => setShowDialog(true)}
                  variant="outline"
                  className="mt-4 border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                >
                  Request Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request._id} className="bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-zinc-900">{request.amount} Credits</p>
                      <p className="text-sm text-zinc-500">
                        {format(new Date(request.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      request.status === "approved"
                        ? "default"
                        : request.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className={`capitalize font-medium ${
                      request.status === "approved"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : request.status === "rejected"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}
                  >
                    {request.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                    {request.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                    {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                    {request.status}
                  </Badge>
                </div>
                {request.status === "approved" && (
                  <div className="mt-3 p-2 bg-green-50 rounded-md border border-green-100">
                    <p className="text-sm text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Credits have been added to your account
                    </p>
                  </div>
                )}
                {request.status === "pending" && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-md border border-yellow-100">
                    <p className="text-sm text-yellow-700 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Request sent to admin
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 