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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { AdminLayout } from "@/components/layout/admin-layout"

interface DataRequest {
  _id: string
  userId: {
    email: string
  }
  title: string
  description: string
  jobTitles: string[]
  geography: {
    target: string[]
    exclude: string[]
  }
  industry: {
    target: string[]
    exclude: string[]
  }
  companySize: {
    minEmployees?: number
    maxEmployees?: number
    minRevenue?: number
    maxRevenue?: number
  }
  ownershipType: string[]
  competitorProducts: string[]
  seniorityLevel: string[]
  engagementPreferences: string[]
  budget: {
    min?: number
    max?: number
    currency: string
  }
  financialIndicators: string[]
  technologyStack: string[]
  status: "pending" | "approved" | "rejected"
  createdAt: string
  updatedAt: string
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<DataRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<DataRequest | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/admin/requests")
      if (!response.ok) throw new Error("Failed to fetch requests")
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      toast.error("Failed to fetch requests")
    } finally {
      setLoading(false)
    }
  }

  const updateRequestStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/admin/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (!response.ok) throw new Error("Failed to update request status")

      toast.success(`Request ${status} successfully`)
      fetchRequests()
    } catch (error) {
      toast.error("Failed to update request status")
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
          <h1 className="text-3xl font-bold text-white">Data Requests</h1>
        </div>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Manage Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-800">
                  <TableHead className="text-white/70">User</TableHead>
                  <TableHead className="text-white/70">Title</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Created At</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request._id} className="border-zinc-800 hover:bg-zinc-800/50">
                    <TableCell className="text-white">{request.userId?.email || 'Unknown User'}</TableCell>
                    <TableCell className="text-white">{request.title}</TableCell>
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
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/70">
                      {format(new Date(request.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 hover:text-blue-300 hover:border-blue-500/30 transition-all duration-200 font-medium"
                              onClick={() => setSelectedRequest(request)}
                            >
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl bg-zinc-900 border-zinc-800">
                            <DialogHeader>
                              <DialogTitle className="text-white">Request Details</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="h-[600px] pr-4">
                              <div className="space-y-4 text-white">
                                <div>
                                  <h3 className="font-semibold text-white/70">Submitted By</h3>
                                  <p>{request.userId?.email || 'Unknown User'}</p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white/70">Title</h3>
                                  <p>{request.title}</p>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white/70">Description</h3>
                                  <p>{request.description}</p>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Job Titles & Functions</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {request.jobTitles.map((title, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                                      >
                                        {title}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Geography</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-white/70">Target Regions</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {request.geography.target.map((region, index) => (
                                          <Badge 
                                            key={index} 
                                            variant="secondary" 
                                            className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                                          >
                                            {region}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-white/70">Excluded Regions</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {request.geography.exclude.map((region, index) => (
                                          <Badge 
                                            key={index} 
                                            variant="secondary" 
                                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                          >
                                            {region}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Industry</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-white/70">Target Industries</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {request.industry.target.map((industry, index) => (
                                          <Badge 
                                            key={index} 
                                            variant="secondary" 
                                            className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20"
                                          >
                                            {industry}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-white/70">Excluded Industries</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {request.industry.exclude.map((industry, index) => (
                                          <Badge 
                                            key={index} 
                                            variant="secondary" 
                                            className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                          >
                                            {industry}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Company Size</h3>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-medium text-white/70">Employees</h4>
                                      <p>
                                        {request.companySize.minEmployees} - {request.companySize.maxEmployees}
                                      </p>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-white/70">Revenue</h4>
                                      <p>
                                        {request.companySize.minRevenue} - {request.companySize.maxRevenue}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Ownership Type</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {request.ownershipType.map((type, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 border border-teal-500/20"
                                      >
                                        {type}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Competitor Products</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {request.competitorProducts.map((product, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"
                                      >
                                        {product}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Seniority Level</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {request.seniorityLevel.map((level, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"
                                      >
                                        {level}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Engagement Preferences</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {request.engagementPreferences.map((preference, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 border border-pink-500/20"
                                      >
                                        {preference}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Budget</h3>
                                  <p>
                                    {request.budget.min} - {request.budget.max} {request.budget.currency}
                                  </p>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Financial Indicators</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {request.financialIndicators.map((indicator, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                      >
                                        {indicator}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div>
                                  <h3 className="font-semibold text-white/70">Technology Stack</h3>
                                  <div className="flex flex-wrap gap-2">
                                    {request.technologyStack.map((tech, index) => (
                                      <Badge 
                                        key={index} 
                                        variant="secondary" 
                                        className="bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20"
                                      >
                                        {tech}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateRequestStatus(request._id, "approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateRequestStatus(request._id, "rejected")}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
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