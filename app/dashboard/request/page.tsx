"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { X, ArrowLeft, Edit2, Clock, CheckCircle2, XCircle, Trash2, Plus, Upload, FilePlus } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

const SENIORITY_LEVELS = ["Executive", "Management", "Operational"]
const OWNERSHIP_TYPES = ["Public", "Private", "Government"]
const CURRENCIES = ["USD", "EUR", "GBP", "INR"]
const ENGAGEMENT_PREFERENCES = ["Email", "Phone", "Webinar", "In-person Meeting"]

interface DataRequest {
  _id: string
  userId: string
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
  hasBeenEdited: boolean
  createdAt: string
  updatedAt: string
}

function UserSheetUpload({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [sheetName, setSheetName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)
    if (!file || !sheetName) {
      setError("Please select a file and enter a sheet name.")
      setLoading(false)
      return
    }
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("sheetName", sheetName)
      formData.append("description", description)
      const response = await fetch("/api/upload-sheet", {
        method: "POST",
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to upload file")
      setSuccess("File uploaded successfully")
      setFile(null)
      setSheetName("")
      setDescription("")
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Failed to upload file")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
      <div className="space-y-2">
        <Label htmlFor="sheetName">Sheet Name</Label>
        <Input id="sheetName" value={sheetName} onChange={e => setSheetName(e.target.value)} placeholder="Enter a name for your sheet" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="file">Upload Data (CSV/Excel)</Label>
        <Input id="file" type="file" accept=".csv,.xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} ref={inputRef} required />
        <p className="text-sm text-muted-foreground">Supports .xlsx, .xls, .csv</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your data (optional)" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : "Upload Sheet"}</Button>
    </form>
  )
}

export default function RequestPage() {
  const [showForm, setShowForm] = useState(false)
  const [editingRequest, setEditingRequest] = useState<DataRequest | null>(null)
  const [userRequests, setUserRequests] = useState<DataRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    jobTitles: [] as string[],
    geography: { target: [] as string[], exclude: [] as string[] },
    industry: { target: [] as string[], exclude: [] as string[] },
    companySize: { minEmployees: "", maxEmployees: "", minRevenue: "", maxRevenue: "" },
    ownershipType: [] as string[],
    competitorProducts: [] as string[],
    seniorityLevel: [] as string[],
    engagementPreferences: [] as string[],
    budget: { min: "", max: "", currency: "USD" },
    financialIndicators: [] as string[],
    technologyStack: [] as string[],
  })

  const [currentJobTitle, setCurrentJobTitle] = useState("")
  const [currentGeographyTarget, setCurrentGeographyTarget] = useState("")
  const [currentGeographyExclude, setCurrentGeographyExclude] = useState("")
  const [currentIndustryTarget, setCurrentIndustryTarget] = useState("")
  const [currentIndustryExclude, setCurrentIndustryExclude] = useState("")
  const [currentCompetitor, setCurrentCompetitor] = useState("")
  const [currentFinancialIndicator, setCurrentFinancialIndicator] = useState("")
  const [currentTechnology, setCurrentTechnology] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchUserRequests()
  }, [])

  const fetchUserRequests = async () => {
    try {
      setLoading(true)
      console.log('Fetching user requests...')
      const response = await fetch('/api/request', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        console.error('Failed to fetch requests:', response.status)
        throw new Error("Failed to fetch requests")
      }
      
      const data = await response.json()
      console.log('Fetched requests:', data)
      setUserRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
      toast.error("Failed to fetch requests")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          ...(editingRequest && { _id: editingRequest._id })
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 400 && errorData.error === "Request has already been edited and cannot be modified further") {
          toast.error("This request has already been edited and cannot be modified further")
          setShowForm(false)
          setEditingRequest(null)
          return
        }
        console.error('Failed to submit request:', response.status)
        throw new Error("Failed to submit request")
      }

      const data = await response.json()
      console.log('Submission response:', data)
      
      if (editingRequest) {
        setUserRequests(prev => 
          prev.map(req => req._id === editingRequest._id ? data : req)
        )
      } else {
        setUserRequests(prev => [...prev, data])
      }

      toast.success(editingRequest ? "Request updated successfully!" : "Request submitted successfully!")
      
      // Reset form and state
      setFormData({
        title: "",
        description: "",
        jobTitles: [],
        geography: { target: [], exclude: [] },
        industry: { target: [], exclude: [] },
        companySize: { minEmployees: "", maxEmployees: "", minRevenue: "", maxRevenue: "" },
        ownershipType: [],
        competitorProducts: [],
        seniorityLevel: [],
        engagementPreferences: [],
        budget: { min: "", max: "", currency: "USD" },
        financialIndicators: [],
        technologyStack: [],
      })
      setShowForm(false)
      setEditingRequest(null)
      
      // Fetch updated list after submission
      fetchUserRequests()
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error("Failed to submit request")
    }
  }

  const startEdit = (request: DataRequest) => {
    if (request.hasBeenEdited) {
      toast.error("This request has already been edited once and cannot be edited again.")
      return
    }
    setEditingRequest(request)
    setFormData({
      title: request.title,
      description: request.description,
      jobTitles: request.jobTitles,
      geography: request.geography,
      industry: request.industry,
      companySize: {
        minEmployees: request.companySize.minEmployees?.toString() ?? "",
        maxEmployees: request.companySize.maxEmployees?.toString() ?? "",
        minRevenue: request.companySize.minRevenue?.toString() ?? "",
        maxRevenue: request.companySize.maxRevenue?.toString() ?? "",
      },
      ownershipType: request.ownershipType,
      competitorProducts: request.competitorProducts,
      seniorityLevel: request.seniorityLevel,
      engagementPreferences: request.engagementPreferences,
      budget: {
        min: request.budget.min?.toString() ?? "",
        max: request.budget.max?.toString() ?? "",
        currency: request.budget.currency,
      },
      financialIndicators: request.financialIndicators,
      technologyStack: request.technologyStack,
    })
    setShowForm(true)
  }

  const addItem = (field: keyof typeof formData, value: string, setCurrent: (value: string) => void) => {
    if (!value.trim()) return
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) ? [...prev[field] as string[], value] : prev[field]
    }))
    setCurrent("")
  }

  const removeItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field]) ? (prev[field] as string[]).filter((_, i) => i !== index) : prev[field]
    }))
  }

  const handleDelete = async (requestId: string) => {
    try {
      const response = await fetch(`/api/request?id=${requestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error("Failed to delete request")
      }

      setUserRequests(prev => prev.filter(req => req._id !== requestId))
      toast.success("Request deleted successfully")
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error("Failed to delete request")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-zinc-900">Loading your requests...</div>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4">
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false)
              setEditingRequest(null)
            }}
            className="bg-white text-black border-zinc-200 hover:bg-zinc-50 w-fit mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
          <h1 className="text-2xl font-bold text-zinc-900 mb-6">
            {editingRequest ? "Edit Request" : "New Data Request"}
          </h1>
        </div>

        <div className="px-4 pb-8">
          <Card className="bg-white border border-zinc-200 shadow-sm">
            <CardHeader className="border-b border-zinc-100 bg-white z-10">
              <CardTitle className="text-xl text-zinc-900">
                Request New Data
              </CardTitle>
              {editingRequest && (
                <CardDescription className="text-amber-600">
                  Note: You can only edit a request once. After saving, no further edits will be allowed.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-zinc-900">Request Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a title for your request"
                    className="border-zinc-200 focus:border-black focus:ring-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-zinc-900">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the data you need and how you plan to use it"
                    className="min-h-[100px] border-zinc-200 focus:border-black focus:ring-black"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-900">Job Titles & Functions</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentJobTitle}
                      onChange={(e) => setCurrentJobTitle(e.target.value)}
                      placeholder="Add job title"
                      className="border-zinc-200 focus:border-black focus:ring-black"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addItem("jobTitles", currentJobTitle, setCurrentJobTitle)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addItem("jobTitles", currentJobTitle, setCurrentJobTitle)}
                      className="bg-black text-white hover:bg-zinc-800"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.jobTitles.map((title, index) => (
                      <Badge key={index} variant="secondary" className="bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200">
                        {title}
                        <button
                          type="button"
                          onClick={() => removeItem("jobTitles", index)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Geography</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentGeographyTarget}
                        onChange={(e) => setCurrentGeographyTarget(e.target.value)}
                        placeholder="Add target region"
                        className="border-zinc-200 focus:border-black focus:ring-black"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            setFormData(prev => ({
                              ...prev,
                              geography: {
                                ...prev.geography,
                                target: [...prev.geography.target, currentGeographyTarget]
                              }
                            }))
                            setCurrentGeographyTarget("")
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            geography: {
                              ...prev.geography,
                              target: [...prev.geography.target, currentGeographyTarget]
                            }
                          }))
                          setCurrentGeographyTarget("")
                        }}
                        className="bg-black text-white hover:bg-zinc-800"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.geography.target.map((region, index) => (
                        <Badge key={index} variant="secondary">
                          {region}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                geography: {
                                  ...prev.geography,
                                  target: prev.geography.target.filter((_, i) => i !== index)
                                }
                              }))
                            }}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-900">Excluded Geography</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentGeographyExclude}
                        onChange={(e) => setCurrentGeographyExclude(e.target.value)}
                        placeholder="Add excluded region"
                        className="border-zinc-200 focus:border-black focus:ring-black"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            setFormData(prev => ({
                              ...prev,
                              geography: {
                                ...prev.geography,
                                exclude: [...prev.geography.exclude, currentGeographyExclude]
                              }
                            }))
                            setCurrentGeographyExclude("")
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            geography: {
                              ...prev.geography,
                              exclude: [...prev.geography.exclude, currentGeographyExclude]
                            }
                          }))
                          setCurrentGeographyExclude("")
                        }}
                        className="bg-black text-white hover:bg-zinc-800"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.geography.exclude.map((region, index) => (
                        <Badge key={index} variant="secondary" className="bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200">
                          {region}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                geography: {
                                  ...prev.geography,
                                  exclude: prev.geography.exclude.filter((_, i) => i !== index)
                                }
                              }))
                            }}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Target Industries</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentIndustryTarget}
                        onChange={(e) => setCurrentIndustryTarget(e.target.value)}
                        placeholder="Add target industry"
                        className="border-zinc-200 focus:border-black focus:ring-black"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            setFormData(prev => ({
                              ...prev,
                              industry: {
                                ...prev.industry,
                                target: [...prev.industry.target, currentIndustryTarget]
                              }
                            }))
                            setCurrentIndustryTarget("")
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            industry: {
                              ...prev.industry,
                              target: [...prev.industry.target, currentIndustryTarget]
                            }
                          }))
                          setCurrentIndustryTarget("")
                        }}
                        className="bg-black text-white hover:bg-zinc-800"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.industry.target.map((industry, index) => (
                        <Badge key={index} variant="secondary">
                          {industry}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                industry: {
                                  ...prev.industry,
                                  target: prev.industry.target.filter((_, i) => i !== index)
                                }
                              }))
                            }}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-zinc-900">Excluded Industries</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentIndustryExclude}
                        onChange={(e) => setCurrentIndustryExclude(e.target.value)}
                        placeholder="Add excluded industry"
                        className="border-zinc-200 focus:border-black focus:ring-black"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            setFormData(prev => ({
                              ...prev,
                              industry: {
                                ...prev.industry,
                                exclude: [...prev.industry.exclude, currentIndustryExclude]
                              }
                            }))
                            setCurrentIndustryExclude("")
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            industry: {
                              ...prev.industry,
                              exclude: [...prev.industry.exclude, currentIndustryExclude]
                            }
                          }))
                          setCurrentIndustryExclude("")
                        }}
                        className="bg-black text-white hover:bg-zinc-800"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.industry.exclude.map((industry, index) => (
                        <Badge key={index} variant="secondary" className="bg-zinc-50 text-zinc-900 hover:bg-zinc-100 border border-zinc-200">
                          {industry}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                industry: {
                                  ...prev.industry,
                                  exclude: prev.industry.exclude.filter((_, i) => i !== index)
                                }
                              }))
                            }}
                            className="ml-2 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Size (Employees)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.companySize.minEmployees}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          companySize: { ...prev.companySize, minEmployees: e.target.value }
                        }))}
                        placeholder="Min employees"
                      />
                      <Input
                        type="number"
                        value={formData.companySize.maxEmployees}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          companySize: { ...prev.companySize, maxEmployees: e.target.value }
                        }))}
                        placeholder="Max employees"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Company Size (Revenue)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={formData.companySize.minRevenue}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          companySize: { ...prev.companySize, minRevenue: e.target.value }
                        }))}
                        placeholder="Min revenue"
                      />
                      <Input
                        type="number"
                        value={formData.companySize.maxRevenue}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          companySize: { ...prev.companySize, maxRevenue: e.target.value }
                        }))}
                        placeholder="Max revenue"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ownership Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {OWNERSHIP_TYPES.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        variant={formData.ownershipType.includes(type) ? "default" : "outline"}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            ownershipType: prev.ownershipType.includes(type)
                              ? prev.ownershipType.filter(t => t !== type)
                              : [...prev.ownershipType, type]
                          }))
                        }}
                        className={
                          formData.ownershipType.includes(type)
                            ? "bg-black text-white hover:bg-zinc-800"
                            : "border-zinc-200 text-zinc-900 hover:bg-zinc-100"
                        }
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Competitor Products</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentCompetitor}
                      onChange={(e) => setCurrentCompetitor(e.target.value)}
                      placeholder="Add competitor product"
                      className="border-zinc-200 focus:border-black focus:ring-black"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addItem("competitorProducts", currentCompetitor, setCurrentCompetitor)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addItem("competitorProducts", currentCompetitor, setCurrentCompetitor)}
                      className="bg-black text-white hover:bg-zinc-800"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.competitorProducts.map((product, index) => (
                      <Badge key={index} variant="secondary">
                        {product}
                        <button
                          type="button"
                          onClick={() => removeItem("competitorProducts", index)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Seniority Level</Label>
                  <div className="flex flex-wrap gap-2">
                    {SENIORITY_LEVELS.map((level) => (
                      <Button
                        key={level}
                        type="button"
                        variant={formData.seniorityLevel.includes(level) ? "default" : "outline"}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            seniorityLevel: prev.seniorityLevel.includes(level)
                              ? prev.seniorityLevel.filter(l => l !== level)
                              : [...prev.seniorityLevel, level]
                          }))
                        }}
                        className={
                          formData.seniorityLevel.includes(level)
                            ? "bg-black text-white hover:bg-zinc-800"
                            : "border-zinc-200 text-zinc-900 hover:bg-zinc-100"
                        }
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Engagement Preferences</Label>
                  <div className="flex flex-wrap gap-2">
                    {ENGAGEMENT_PREFERENCES.map((preference) => (
                      <Button
                        key={preference}
                        type="button"
                        variant={formData.engagementPreferences.includes(preference) ? "default" : "outline"}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            engagementPreferences: prev.engagementPreferences.includes(preference)
                              ? prev.engagementPreferences.filter(p => p !== preference)
                              : [...prev.engagementPreferences, preference]
                          }))
                        }}
                        className={
                          formData.engagementPreferences.includes(preference)
                            ? "bg-black text-white hover:bg-zinc-800"
                            : "border-zinc-200 text-zinc-900 hover:bg-zinc-100"
                        }
                      >
                        {preference}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Budget</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={formData.budget.min}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        budget: { ...prev.budget, min: e.target.value }
                      }))}
                      placeholder="Min budget"
                    />
                    <Input
                      type="number"
                      value={formData.budget.max}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        budget: { ...prev.budget, max: e.target.value }
                      }))}
                      placeholder="Max budget"
                    />
                    <Select
                      value={formData.budget.currency}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        budget: { ...prev.budget, currency: value }
                      }))}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Financial Indicators</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentFinancialIndicator}
                      onChange={(e) => setCurrentFinancialIndicator(e.target.value)}
                      placeholder="Add financial indicator"
                      className="border-zinc-200 focus:border-black focus:ring-black"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addItem("financialIndicators", currentFinancialIndicator, setCurrentFinancialIndicator)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addItem("financialIndicators", currentFinancialIndicator, setCurrentFinancialIndicator)}
                      className="bg-black text-white hover:bg-zinc-800"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.financialIndicators.map((indicator, index) => (
                      <Badge key={index} variant="secondary">
                        {indicator}
                        <button
                          type="button"
                          onClick={() => removeItem("financialIndicators", index)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Technology Stack</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentTechnology}
                      onChange={(e) => setCurrentTechnology(e.target.value)}
                      placeholder="Add technology"
                      className="border-zinc-200 focus:border-black focus:ring-black"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addItem("technologyStack", currentTechnology, setCurrentTechnology)
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => addItem("technologyStack", currentTechnology, setCurrentTechnology)}
                      className="bg-black text-white hover:bg-zinc-800"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.technologyStack.map((tech, index) => (
                      <Badge key={index} variant="secondary">
                        {tech}
                        <button
                          type="button"
                          onClick={() => removeItem("technologyStack", index)}
                          className="ml-2 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  <Button type="submit" className="w-full bg-black text-white hover:bg-zinc-800">
                    {editingRequest ? "Save Changes" : "Submit Request"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <h1 className="text-2xl font-bold text-zinc-900 px-6 pt-6 mb-4">Data Requests</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        {/* Create ICP Request Card */}
        <Card className="border border-zinc-200 shadow-sm cursor-pointer hover:shadow-md transition bg-zinc-50" onClick={() => setShowForm(true)}>
          <CardHeader className="flex flex-row items-center gap-3">
            <div className="bg-purple-50 p-2 rounded-full"><FilePlus className="h-6 w-6 text-purple-600" /></div>
            <div>
              <CardTitle className="text-lg">Create ICP Request</CardTitle>
              <CardDescription>Create a new Ideal Customer Profile request</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="w-full text-center text-zinc-500 font-medium">Click to create ICP request<br /><span className="text-xs">Define your target customer profile</span></div>
          </CardContent>
        </Card>
        {/* Upload a Sheet Card */}
        <div className="relative">
          <Card className="border border-zinc-200 shadow-sm bg-blue-50 select-none pointer-events-none">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="bg-blue-50 p-2 rounded-full"><Upload className="h-6 w-6 text-blue-600" /></div>
              <div>
                <CardTitle className="text-lg">Upload a Target Sheet</CardTitle>
                <CardDescription>Upload your data sheet for processing and analysis</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="w-full text-center text-zinc-500 font-medium">Click to upload your sheet<br /><span className="text-xs">Supports .xlsx, .xls, .csv</span></div>
            </CardContent>
          </Card>
          <div className="absolute inset-0 flex items-center justify-center rounded-lg z-10" style={{ backgroundColor: '#E6E1FF', opacity: 0.7 }}>
            <span className="text-lg font-semibold" style={{ color: '#8370FC' }}>Coming Soon</span>
          </div>
        </div>
      </div>
      {/* Upload Sheet Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Upload a Target Sheet</DialogTitle>
          </DialogHeader>
          <UserSheetUpload onSuccess={() => setShowUploadModal(false)} />
        </DialogContent>
      </Dialog>
      {/* ICP Form Section (existing logic) */}
      {showForm ? (
        // ... existing ICP form code ...
        // (leave as is, already present in your file)
        <>{/* existing form UI */}</>
      ) : (
        <div className="p-6">
          {userRequests.length === 0 ? (
            <Card className="bg-white border border-zinc-200 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-zinc-500 text-center space-y-2">
                  <p>You haven't submitted any data requests yet.</p>
                  <Button 
                    onClick={() => setShowForm(true)}
                    variant="outline"
                    className="mt-4 border-zinc-200 text-zinc-900 hover:bg-zinc-50"
                  >
                    Create Your First Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userRequests.map((request) => (
                <Card key={request._id} className={`bg-white border border-gray-400 shadow-sm hover:shadow-md transition-all duration-200 ${
                  request.status === "approved" 
                    ? "bg-green-50" 
                    : request.status === "pending" 
                    ? "bg-yellow-50" 
                    : "bg-white"
                }`}>
                  <CardHeader className="border-b border-gray-200 p-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-zinc-900 text-lg font-semibold truncate">{request.title}</CardTitle>
                        <CardDescription className="text-zinc-500 text-sm line-clamp-2">
                          {request.description}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          request.status === "approved"
                            ? "default"
                            : request.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className={`capitalize font-medium px-2 py-1 ${
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
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-zinc-700 text-sm font-medium">Target Industries</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {request.industry.target.map((industry, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200 text-xs px-2 py-0.5"
                            >
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-zinc-700 text-sm font-medium">Target Regions</Label>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {request.geography.target.map((region, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-200 text-xs px-2 py-0.5"
                            >
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 flex justify-end gap-2 border-t border-gray-200">
                        {request.status !== "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(request)}
                            disabled={request.hasBeenEdited}
                            className={`text-black border-zinc-200 hover:bg-zinc-50 h-8 ${
                              request.hasBeenEdited ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                            {request.hasBeenEdited ? "Already Edited" : "Edit"}
                          </Button>
                        )}
                        {request.status !== "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(request._id)}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
} 