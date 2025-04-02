"use client"

import { useSearchParams } from "next/navigation"
import { DataTable } from "@/components/user/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, Suspense } from "react"

function SearchParamsWrapper() {
  const searchParams = useSearchParams()
  const selectedFile = searchParams.get("file")
  return <DataTable selectedFileIndex={selectedFile ? parseInt(selectedFile) : 0} />
}

function DashboardContent() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gray-600 bg-clip-text text-transparent">
          Data Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          View and analyze your data files
        </p>
      </div>

      <Card className="border-none shadow-none">
        <CardHeader className="px-0 pt-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in data..."
                  className="pl-8 w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="shrink-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div> */}
            {/* <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="gap-2">
                <FileText className="h-4 w-4" />
                New File
              </Button>
            </div> */}
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <Suspense fallback={<div>Loading data...</div>}>
            <SearchParamsWrapper />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

export default function UserDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  )
}

