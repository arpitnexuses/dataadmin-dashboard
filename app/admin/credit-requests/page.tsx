"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { format } from "date-fns"
import { AdminLayout } from "@/components/layout/admin-layout"
import { CheckCircle2, XCircle, Clock } from "lucide-react"

interface CreditRequest {
  _id: string
  userId: {
    email: string
  }
  amount: number
  status: "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
}

export default function CreditRequestsPage() {
  const [requests, setRequests] = useState<CreditRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/credit-requests")
      if (!response.ok) throw new Error("Failed to fetch requests")
      const data = await response.json()
      setRequests(data.requests)
    } catch (error) {
      toast.error("Failed to fetch requests")
    } finally {
      setLoading(false)
    }
  }

  const handleRequestAction = async (requestId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch("/api/admin/credit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      })

      if (!response.ok) throw new Error("Failed to process request")

      toast.success(`Request ${action}d successfully`)
      fetchRequests()
    } catch (error) {
      toast.error("Failed to process request")
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-white">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Credit Requests</h1>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Manage Credit Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="text-white/70">User</TableHead>
                  <TableHead className="text-white/70">Amount</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Created At</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request._id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-white">{request.userId?.email || 'Unknown User'}</TableCell>
                    <TableCell className="text-white">{request.amount}</TableCell>
                    <TableCell>
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
                            ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                            : request.status === "rejected"
                            ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                            : "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                        }`}
                      >
                        {request.status === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {request.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                        {request.status === "pending" && <Clock className="h-3 w-3 mr-1" />}
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/70">
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRequestAction(request._id, "approve")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRequestAction(request._id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
} 