"use client"

import { useSearchParams } from "next/navigation"
import { DataTable } from "@/components/user/data-table"
import { Suspense, useState, useEffect } from "react"
import Filter from "../components/Filter"
import { FilterIcon } from "lucide-react"

export default function UserDashboardPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [tableData, setTableData] = useState<any[]>([]);
  const searchParams = useSearchParams();
  const selectedFile = searchParams.get("file");

  // Fetch data for filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/data");
        if (response.ok) {
          const data = await response.json();
          if (data.dataFiles && data.dataFiles[selectedFile ? parseInt(selectedFile) : 0]) {
            setTableData(data.dataFiles[selectedFile ? parseInt(selectedFile) : 0].data);
          }
        }
      } catch (error) {
        console.error("Error fetching data for filters:", error);
      }
    };

    fetchData();
  }, [selectedFile]);

  const handleApplyFilters = (filters: Record<string, string[]>) => {
    // Remove any empty filter arrays
    const nonEmptyFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, values]) => values.length > 0)
    );
    setActiveFilters(nonEmptyFilters);
  };

  return (
    <div className="min-h-screen w-full bg-black">
      <Filter 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)} 
        onApplyFilters={handleApplyFilters}
        data={tableData}
      />
      
      <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
        <DataTable 
          selectedFileIndex={selectedFile ? parseInt(selectedFile) : 0}
          activeFilters={activeFilters}
          setIsFilterOpen={setIsFilterOpen}
        />
      </Suspense>
    </div>
  )
}

