"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import { DataTable } from "@/components/user/data-table"
import Filter from "@/app/components/Filter"

interface File {
  id: string
  name: string
  description: string
  data: any[]
}

interface DataRow {
  [key: string]: string;
}

export default function ListPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({})
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/data")
        if (response.ok) {
          const data = await response.json()
          
          // Debug: Log the first file's data to see what columns are available
          if (data.dataFiles && data.dataFiles.length > 0 && data.dataFiles[0].data.length > 0) {
            console.log("Available columns:", Object.keys(data.dataFiles[0].data[0]));
            console.log("First row of data:", data.dataFiles[0].data[0]);
          }
          
          setFiles(data.dataFiles.map((file: any) => ({
            id: file.id,
            name: file.title,
            description: file.filename.replace(/\.csv$/, ''),
            data: file.data
          })))
        }
      } catch (error) {
        console.error("Error fetching files:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleFileClick = (file: File) => {
    setSelectedFile(file)
  }

  const handleApplyFilters = (filters: Record<string, string[]>) => {
    setActiveFilters(filters)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <>
          <h1 className="text-3xl font-bold text-gray-800">Files</h1>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* All Files Card */}
            <Card 
              className="group hover:shadow-xl transition-all duration-300 cursor-pointer border border-[#8370FC]/20 hover:border-[#8370FC] bg-white"
              onClick={() => {
                const allFilesData: File = {
                  id: 'all-files',
                  name: 'All Files',
                  description: 'Combined data from all files',
                  data: files.reduce<any[]>((acc, file) => [...acc, ...file.data], [])
                }
                handleFileClick(allFilesData)
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-semibold text-[#8370FC] group-hover:text-[#8370FC]/90">
                    All Files
                  </CardTitle>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    Combined data from all files
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-[#8370FC]/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-[#8370FC]" />
                  <span className="text-sm font-medium text-[#8370FC]">
                    {files.reduce((acc, file) => acc + file.data.length, 0)} records
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#8370FC] animate-pulse" />
                    <span className="text-xs text-gray-500">Click to view all data</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date().toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {files.map((file) => (
              <Card 
                key={file.id} 
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-[#8370FC] bg-white"
                onClick={() => handleFileClick(file)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-gray-800 group-hover:text-[#8370FC]">
                      {file.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {file.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 group-hover:bg-[#8370FC]/10 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600 group-hover:text-[#8370FC]" />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-[#8370FC]">
                      {file.data.length} records
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-gray-400 group-hover:bg-[#8370FC] animate-pulse" />
                      <span className="text-xs text-gray-500">Click to view details</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date().toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => setSelectedFile(null)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#8370FC] transition-colors w-fit group"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="lucide lucide-arrow-left group-hover:-translate-x-1 transition-transform"
              >
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              Back to Files
            </button>
            <h1 className="text-3xl font-bold text-gray-800">{selectedFile.name}</h1>
          </div>
          
          <DataTable 
            selectedFileIndex={selectedFile.id === 'all-files' ? 0 : files.findIndex(f => f.id === selectedFile.id)}
            activeFilters={activeFilters}
            setIsFilterOpen={setIsFilterOpen}
            allFilesData={selectedFile.id === 'all-files' ? selectedFile.data : undefined}
          />
          <Filter
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApplyFilters={handleApplyFilters}
            data={selectedFile.data}
          />
        </div>
      )}
    </div>
  )
} 