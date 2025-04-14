"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { DataTable } from "@/components/user/data-table"
import { DataItems } from "@/components/user/data-items"
import { Suspense, useState, useEffect } from "react"
import Filter from "../components/Filter"
import { FilterIcon } from "lucide-react"

export default function UserDashboardPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [tableData, setTableData] = useState<any[]>([]);
  const [dataFiles, setDataFiles] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFile = searchParams.get("file");

  // Fetch data for filters and data items
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/data");
        if (response.ok) {
          const data = await response.json();
          if (data.dataFiles) {
            setDataFiles(data.dataFiles);
            
            // If no file is selected but files are available, select the first one
            if (!selectedFile && data.dataFiles.length > 0) {
              router.push("/dashboard?file=0");
              return;
            }

            // Set table data if a file is selected
            if (selectedFile && data.dataFiles[parseInt(selectedFile)]) {
              setTableData(data.dataFiles[parseInt(selectedFile)].data);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [selectedFile, router]);

  const handleApplyFilters = (filters: Record<string, string[]>) => {
    const nonEmptyFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, values]) => values.length > 0)
    );
    setActiveFilters(nonEmptyFilters);
  };

  if (dataFiles.length === 0) {
    return (
      <div className="min-h-screen w-full bg-black">
        <div className="container mx-auto py-8">
          <div className="text-center text-white">
            <h2 className="text-2xl font-bold mb-4">No Data Files Available</h2>
            <p className="text-gray-400">Please contact your administrator to add data files.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black">
      <div className="container mx-auto py-8">
        {/* <h1 className="text-2xl font-bold text-white mb-6">Your Data Files</h1>
        
        <DataItems 
          items={dataItems} 
          currentFileIndex={selectedFile ? parseInt(selectedFile) : undefined} 
        /> */}

        {selectedFile && (
          <>
            <Filter 
              isOpen={isFilterOpen} 
              onClose={() => setIsFilterOpen(false)} 
              onApplyFilters={handleApplyFilters}
              data={tableData}
            />
            
            <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
              <DataTable 
                selectedFileIndex={parseInt(selectedFile)}
                activeFilters={activeFilters}
                setIsFilterOpen={setIsFilterOpen}
              />
            </Suspense>
          </>
        )}
      </div>
    </div>
  )
}

