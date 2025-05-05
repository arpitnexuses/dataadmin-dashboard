"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Download, LogOut, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import * as XLSX from 'xlsx'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Column,
  HeaderGroup,
  Row,
  Cell,
  FilterFn,
  FilterFnOption,
  VisibilityState,
} from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"
import { Search } from "lucide-react"
import { Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Building2, Mail, Phone, Users, Globe, LinkedinIcon, DollarSign, Briefcase, MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { BarChart, PieChart, LineChart } from "lucide-react"
import { AnalyticsModal } from "./analytics-modal"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RowDetailsModal } from "./row-details-modal"

declare module '@tanstack/table-core' {
  interface FilterFns {
    employeeSize: FilterFn<DataRow>
    revenue: FilterFn<DataRow>
  }
}

// Function to generate consistent colors for different columns
const getColumnColor = (value: string, columnKey: string) => {
  // Create a hash of the value string to get a consistent number
  const hash = value.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  // Use different color ranges for different columns
  let baseHue;
  switch (columnKey) {
    case 'Industry':
      baseHue = Math.abs(hash % 30) + 0; // Warm oranges and reds (0-30)
      break;
    case 'Title':
      baseHue = Math.abs(hash % 60) + 180; // Blues (180-240)
      break;
    case 'Country':
      baseHue = Math.abs(hash % 30) + 270; // Purples (270-300)
      break;
    case 'Technologies':
      baseHue = Math.abs(hash % 60) + 90; // Greens (90-150)
      break;
    default:
      baseHue = Math.abs(hash % 360);
  }
  
  return `hsl(${baseHue}, 70%, 45%)`; // Medium saturation and lightness for subtle but noticeable colors
}

interface DataRow {
  First_Name: string
  Last_Name: string
  Title: string
  Company: string
  Email: string
  Corporate_Phone: string
  Personal_Phone: string
  Employees_Size: string
  Industry: string
  Person_Linkedin_Url: string
  Website: string
  Company_Linkedin_Url: string
  Country: string
  Technologies: string
  Annual_Revenue: string
}

interface UserData {
  title: string
  logoUrl: string
  dataFiles: Array<{
    id: string
    title: string
    filename: string
    data: DataRow[]
  }>
  credits: number
}

interface DataTableProps {
  selectedFileIndex: number
  activeFilters: Record<string, string[]>
  setIsFilterOpen: (isOpen: boolean) => void
  allFilesData?: DataRow[]
}

// Add this helper function at the top with other functions
const getGeneralFilters = (data: DataRow[]) => {
  // Get unique titles and sort them
  const titles = Array.from(new Set(data.map(row => row.Title)))
    .filter(Boolean)
    .sort();

  // Get unique industries and sort them
  const industries = Array.from(new Set(data.map(row => row.Industry)))
    .filter(Boolean)
    .sort();

  // Create general employee size ranges
  const employeeSizeRanges = [
    { label: "< 100", value: "lt100" },
    { label: "100 - 500", value: "100-500" },
    { label: "500+", value: "gt500" }
  ];

  // Create general revenue ranges
  const revenueRanges = [
    { label: "< 1M", value: "lt1M" },
    { label: "1M - 50M", value: "1M-50M" },
    { label: "50M+", value: "gt50M" }
  ];

  return {
    titles: titles.slice(0, 5), // Limit to top 5 titles
    industries: industries.slice(0, 5), // Limit to top 5 industries
    employeeSizeRanges,
    revenueRanges
  };
};

// Add custom filter functions
const employeeSizeFilter: FilterFn<DataRow> = (row, columnId, value) => {
  const employeeCount = parseInt(row.getValue<string>(columnId).replace(/[^0-9]/g, '')) || 0;
  switch (value) {
    case 'lt100': return employeeCount < 100;
    case '100-500': return employeeCount >= 100 && employeeCount <= 500;
    case 'gt500': return employeeCount > 500;
    default: return true;
  }
};

const revenueFilter: FilterFn<DataRow> = (row, columnId, value) => {
  const revenue = parseFloat(row.getValue<string>(columnId).replace(/[^0-9.-]+/g, "")) || 0;
  switch (value) {
    case 'lt1M': return revenue < 1000000;
    case '1M-50M': return revenue >= 1000000 && revenue <= 50000000;
    case 'gt50M': return revenue > 50000000;
    default: return true;
  }
};

// Keep only copy protection functions
const preventCopy = (e: ClipboardEvent) => {
  e.preventDefault();
  return false;
};

const preventContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  return false;
};

const preventSelection = (e: Event) => {
  e.preventDefault();
  return false;
};

export function DataTable({ selectedFileIndex, activeFilters, setIsFilterOpen, allFilesData }: DataTableProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null)
  const [isFilterOpen, setIsFilterOpenState] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [showNoSelectionWarning, setShowNoSelectionWarning] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [isRowDetailsOpen, setIsRowDetailsOpen] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  // Add useEffect for auto-closing export success dialog
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (showExportSuccess) {
      timeoutId = setTimeout(() => {
        setShowExportSuccess(false);
      }, 5000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [showExportSuccess]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First fetch user data to get credits regardless of view
        const userResponse = await fetch("/api/user/data")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUserCredits(userData.credits || 0)
          
          if (allFilesData) {
            // If allFilesData is provided, use it but keep the credits from userData
            setUserData({
              title: "All Files",
              logoUrl: "",
              dataFiles: [{
                id: "all-files",
                title: "All Files",
                filename: "all-files.csv",
                data: allFilesData
              }],
              credits: userData.credits || 0  // Use the actual credits from userData
            })
          } else {
            // If no allFilesData, use the complete userData
            setUserData(userData)
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [allFilesData])

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (!userData?.dataFiles[selectedFileIndex]?.data[0]) {
      console.log("No data available for columns")
      return []
    }
    
    // console.log("Creating columns from data:", userData.dataFiles[selectedFileIndex].data[0])
    
    const defaultColumns: ColumnDef<DataRow>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => {
              table.toggleAllPageRowsSelected(!!value)
            }}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center">
              <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
                onClick={(e) => e.stopPropagation()}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          )
        },
        enableSorting: false,
        enableHiding: false,
      }
    ]

    const dataColumns: ColumnDef<DataRow>[] = [
      "First_Name",
      "Last_Name",
      "Title",
      "Company",
      "Email",
      "Corporate_Phone",
      "Personal_Phone",
      "Employees_Size",
      "Industry",
      "Person_Linkedin_Url",
      "Website",
      "Company_Linkedin_Url",
      "Country",
      "Technologies",
      "Annual_Revenue"
    ].map(columnKey => {
      const baseColumn: Partial<ColumnDef<DataRow>> = {
        accessorKey: columnKey,
        header: ({ column }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 -ml-3 data-[state=open]:bg-gray-100 font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100/50 tracking-wide text-sm"
                >
                  <span>{columnKey.replace(/_/g, ' ')}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border border-gray-200 shadow-lg rounded-md">
                <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Sort</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(false)}
                  className="text-sm hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                >
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(true)}
                  className="text-sm hover:bg-gray-50 focus:bg-gray-50 cursor-pointer"
                >
                  Descending
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Filter</DropdownMenuLabel>
                <div className="p-2">
                  <Input
                    placeholder={`Filter ${columnKey.replace(/_/g, ' ')}...`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      column.setFilterValue(event.target.value)
                    }
                    className="h-8 w-full border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-blue-500 focus-visible:ring-opacity-30 focus-visible:border-blue-500 text-sm"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
        cell: ({ row }) => {
          const value = row.getValue(columnKey) as string;
          if ((columnKey === "Industry" || columnKey === "Title" || columnKey === "Country" || columnKey === "Technologies") && value) {
            const bgColor = getColumnColor(value, columnKey);
            
            // For Technologies column, show limited badges with "+X more"
            if (columnKey === "Technologies" && value.includes(',')) {
              const techs = value.split(',').map(t => t.trim());
              const MAX_VISIBLE = 2; // Show only first 2 technologies
              const remainingCount = techs.length - MAX_VISIBLE;
              
              return (
                <div className="flex items-center gap-1.5 max-w-[350px]">
                  {techs.slice(0, MAX_VISIBLE).map((tech, index) => (
                    <div 
                      key={index}
                      className="px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap border"
                      style={{ 
                        backgroundColor: `${getColumnColor(tech, columnKey)}10`, // Use 10% opacity
                        color: getColumnColor(tech, columnKey),
                        borderColor: `${getColumnColor(tech, columnKey)}30`, // 30% opacity border
                      }}
                    >
                      {tech}
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div 
                      className="px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap bg-gray-50 text-gray-500 border border-gray-200"
                      title={techs.slice(MAX_VISIBLE).join(', ')} // Show remaining on hover
                    >
                      +{remainingCount}
                    </div>
                  )}
                </div>
              );
            }

            // Special styling for Title column
            if (columnKey === "Title") {
              return (
                <div 
                  className="inline-flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                  title={value} // Show full text on hover
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                    style={{ backgroundColor: getColumnColor(value, columnKey) }}
                  />
                  <span className="text-sm text-gray-700 font-medium truncate">
                    {value}
                  </span>
                </div>
              );
            }

            // Industry, Country and other badge columns
            return (
              <div 
                className="px-2 py-0.5 rounded-md inline-block max-w-[200px] text-xs font-medium border"
                style={{ 
                  backgroundColor: `${bgColor}10`, // Use 10% opacity for background
                  color: bgColor,
                  borderColor: `${bgColor}30`, // 30% opacity border
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
                title={value} // Show full text on hover
              >
                {value}
              </div>
            );
          }

          // For other columns with long text
          if (columnKey === "Email") {
            return (
              <div 
                className="text-black h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[230px]"
                title={value}
              >
                {value}
              </div>
            );
          }

          if (columnKey === "Website" || columnKey === "Person_Linkedin_Url" || columnKey === "Company_Linkedin_Url") {
            return (
              <div 
                className="text-black max-w-[180px] truncate h-6 flex items-center"
                title={value}
              >
                {value}
              </div>
            );
          }

          // Default rendering for other columns
          if (columnKey === "Company") {
            return (
              <div 
                className="text-black h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                title={value}
              >
                {value}
              </div>
            );
          }
          return <div className="text-black h-6 flex items-center">{value}</div>;
        },
      };

      // Add specific filter functions for special columns
      if (columnKey === "Employees_Size") {
        baseColumn.filterFn = employeeSizeFilter;
      } else if (columnKey === "Annual_Revenue") {
        baseColumn.filterFn = revenueFilter;
      }

      return baseColumn as ColumnDef<DataRow>;
    })

    return [...defaultColumns, ...dataColumns]
  }, [userData, selectedFileIndex])

  // Apply filters to the data
  const filteredData = useMemo(() => {
    if (!userData?.dataFiles[selectedFileIndex]?.data) return [];

    let data = userData.dataFiles[selectedFileIndex].data;

    // Apply active filters
    if (Object.keys(activeFilters).length > 0) {
      data = data.filter(row => {
        return Object.entries(activeFilters).every(([filterKey, filterValues]) => {
          if (filterValues.length === 0) return true;

          const rowValue = row[filterKey as keyof DataRow];
          if (!rowValue) return false;

          // Handle different types of filters
          switch (filterKey) {
            case 'Industry':
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
            case 'Title':
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
            case 'Employees_Size':
              const employeeCount = parseInt(rowValue.replace(/[^0-9]/g, '')) || 0;
              return filterValues.some(value => {
                switch (value) {
                  case 'lt100': return employeeCount < 100;
                  case '100-500': return employeeCount >= 100 && employeeCount <= 500;
                  case 'gt500': return employeeCount > 500;
                  default: return false;
                }
              });
            case 'Annual_Revenue':
              const revenue = parseFloat(rowValue.replace(/[^0-9.-]+/g, "")) || 0;
              return filterValues.some(value => {
                switch (value) {
                  case 'lt1M': return revenue < 1000000;
                  case '1M-50M': return revenue >= 1000000 && revenue <= 50000000;
                  case 'gt50M': return revenue > 50000000;
                  default: return false;
                }
              });
            case 'Country':
              return filterValues.includes(rowValue);
            case 'Technologies':
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
            default:
              return true;
          }
        });
      });
    }

    return data;
  }, [userData, selectedFileIndex, activeFilters]);

  // Add this after the filteredData calculation
  const generalFilters = useMemo(() => {
    if (!filteredData.length) return null;
    return getGeneralFilters(filteredData);
  }, [filteredData]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    filterFns: {
      employeeSize: employeeSizeFilter,
      revenue: revenueFilter,
    },
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
    },
    enableRowSelection: true,
    enableMultiRowSelection: true,
  })

  // Remove the pagination effect since we don't need it anymore
  useEffect(() => {
    setRowSelection({})
  }, [])

  // Keep only copy protection effect
  useEffect(() => {
    document.addEventListener('copy', preventCopy);
    document.addEventListener('selectstart', preventSelection);
    
    return () => {
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('selectstart', preventSelection);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Clear any local storage or session storage if needed
        localStorage.clear();
        sessionStorage.clear();
        // Force reload to ensure clean state
        window.location.replace('/');
      } else {
        const data = await response.json().catch(() => null);
        console.error('Logout failed:', data?.message || 'Unknown error');
        // Still redirect to home page even if logout API fails
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      // Still redirect to home page even if there's an error
      window.location.replace('/');
    }
  };

  const handleExport = async () => {
    if (table.getSelectedRowModel().rows.length === 0) {
      setShowExportConfirm(false)
      setShowNoSelectionWarning(true)
      return
    }

    if (userCredits < table.getSelectedRowModel().rows.length) {
      alert(`Not enough credits! You need ${table.getSelectedRowModel().rows.length} credits but only have ${userCredits}`)
      return
    }

    setExporting(true)
    try {
      // First deduct credits
      const creditResponse = await fetch('/api/user/credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: -table.getSelectedRowModel().rows.length
        }),
      })

      if (!creditResponse.ok) {
        throw new Error('Failed to update credits')
      }

      // Get the selected row indices
      const selectedIndices = table.getSelectedRowModel().rows.map(row => row.index)

      // Then trigger the export
      const exportResponse = await fetch('/api/user/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'selected',
          selectedRecords: table.getSelectedRowModel().rows.length,
          selectedIndices: selectedIndices
        }),
      })

      if (!exportResponse.ok) {
        throw new Error('Failed to export data')
      }

      // Get the blob from the response
      const blob = await exportResponse.blob()
      
      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'exported_data.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Refresh user data to update credits
      const userResponse = await fetch("/api/user/data")
      if (userResponse.ok) {
        const data = await userResponse.json()
        setUserCredits(data.credits)
        setUserData(data) // Update the entire user data to ensure UI is in sync
      }

      // Clear row selection after successful export
      table.resetRowSelection()
      
      setShowExportSuccess(true)
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setExporting(false)
      setShowExportConfirm(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-none shadow-none w-full bg-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userData || !userData.dataFiles[selectedFileIndex]) {
    // Check if we have allFilesData
    if (allFilesData) {
      const selectedFile = {
        id: "all-files",
        title: "All Files",
        filename: "all-files.csv",
        data: allFilesData
      }
      return (
        <Card className="border-none shadow-none w-full bg-white text-black">
          <CardContent 
            className="p-1 select-none" 
            onContextMenu={preventContextMenu}
          >
            {/* Logo and Header */}
            <div className="flex flex-col mb-1 w-full">
              
              
              
              
            </div>

            {/* Filters Section */}
            <div className="flex flex-col gap-2 mb-3 px-1">
              {/* Top Row - Search and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 w-full max-w-sm">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search in all columns..."
                      value={globalFilter ?? ""}
                      onChange={(event) => setGlobalFilter(event.target.value)}
                      className="pl-9 py-2 h-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-blue-500 focus-visible:ring-opacity-30 focus-visible:border-blue-500 rounded-md"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const openDropdown = document.querySelector('[data-state="open"]');
                      if (openDropdown) {
                        (openDropdown as HTMLElement).click();
                      }
                      setIsFilterOpen(true);
                    }}
                    className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 h-10 rounded-md"
                  >
                    <Filter className="h-4 w-4" />
                    Advanced Filters {Object.keys(activeFilters).length > 0 && `(${Object.keys(activeFilters).length})`}
                  </Button>
                
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 h-10 rounded-md"
                      >
                        <Eye className="h-4 w-4" />
                        Columns
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-md w-56">
                      <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Toggle Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-100" />
                      
                      {/* Quick selection options */}
                      <div className="p-2 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500">Presets</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs border-gray-200 text-gray-700"
                            onClick={() => {
                              // Show only essential columns (customize this list as needed)
                              const essentialColumns = ["First_Name", "Last_Name", "Email", "Company", "Title", "Country"];
                              const newVisibility: VisibilityState = {};
                              
                              // First hide all columns except select
                              table.getAllLeafColumns().forEach(column => {
                                if (column.id !== "select") {
                                  newVisibility[column.id] = false;
                                }
                              });
                              
                              // Then show only essential columns
                              essentialColumns.forEach(column => {
                                newVisibility[column] = true;
                              });
                              
                              table.setColumnVisibility(newVisibility);
                            }}
                          >
                            Essential Only
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs border-gray-200 text-gray-700"
                            onClick={() => {
                              const newVisibility: VisibilityState = {};
                              table.getAllLeafColumns().forEach(column => {
                                if (column.id !== "select") {
                                  newVisibility[column.id] = true;
                                }
                              });
                              table.setColumnVisibility(newVisibility);
                            }}
                          >
                            Show All
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs border-gray-200 text-gray-700"
                            onClick={() => {
                              const newVisibility: VisibilityState = {};
                              table.getAllLeafColumns().forEach(column => {
                                if (column.id !== "select") {
                                  newVisibility[column.id] = false;
                                }
                              });
                              table.setColumnVisibility(newVisibility);
                            }}
                          >
                            Hide All
                          </Button>
                        </div>
                      </div>
                      
                      <DropdownMenuSeparator className="bg-gray-100 my-1" />
                      
                      <div className="max-h-[400px] overflow-y-auto p-2">
                        {table.getAllLeafColumns().filter(column => column.id !== "select").map(column => (
                          <div key={column.id} className="py-1.5 px-1 flex items-center space-x-2">
                            <Checkbox
                              checked={column.getIsVisible()}
                              onCheckedChange={(value) => column.toggleVisibility(!!value)}
                              id={`column-${column.id}`}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label 
                              htmlFor={`column-${column.id}`}
                              className="text-sm text-gray-700 cursor-pointer"
                            >
                              {column.id.replace(/_/g, ' ')}
                            </label>
                          </div>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 h-10 rounded-md"
                    onClick={() => setShowExportConfirm(true)}
                    disabled={!userData || userData.dataFiles[selectedFileIndex]?.data.length === 0 || exporting}
                  >
                    <Download className="h-4 w-4" />
                    Export Selected
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
              <Table className="select-none w-full bg-white">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow 
                      key={headerGroup.id} 
                      className="border-none select-none"
                    >
                      {headerGroup.headers.map((header, index) => (
                        <TableHead 
                          key={header.id} 
                          className={cn(
                            "text-gray-500 font-medium bg-gray-50 px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg border-b border-gray-200 select-none text-sm",
                            header.id === "select" && "w-[40px] pr-0"
                          )}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="bg-white select-none">
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, rowIndex) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={cn(
                          "hover:bg-gray-50 cursor-pointer bg-white select-none transition-colors",
                          rowIndex === table.getRowModel().rows.length - 1 ? "last:border-b-0" : "border-b border-gray-100"
                        )}
                        onClick={() => {
                          setSelectedRow(row.original)
                          setIsRowDetailsOpen(true)
                        }}
                      >
                        {row.getVisibleCells().map((cell, cellIndex) => (
                          <TableCell 
                            key={cell.id} 
                            className={cn(
                              "text-gray-900 px-4 py-3 bg-white select-none text-sm",
                              cell.column.id === "select" && "pr-0 pl-4 w-[40px]",
                              row.getIsSelected() && "bg-blue-50/40",
                              rowIndex === table.getRowModel().rows.length - 1 && cellIndex === 0 && "rounded-bl-lg",
                              rowIndex === table.getRowModel().rows.length - 1 && cellIndex === row.getVisibleCells().length - 1 && "rounded-br-lg"
                            )}
                            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-gray-400 bg-white select-none rounded-b-lg"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between py-1 mt-1 px-1">
              <div className="flex-1 text-sm text-gray-500">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </div>
            </div>

            {/* Export Confirmation Dialog */}
            <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Export</DialogTitle>
                  <DialogDescription>
                    Please review the export details before proceeding
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {userCredits < table.getSelectedRowModel().rows.length ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Insufficient Credits</AlertTitle>
                      <AlertDescription>
                        You don't have enough credits to export {table.getSelectedRowModel().rows.length} records.
                        Please contact your admin to get more credits.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Credit Information</AlertTitle>
                      <AlertDescription>
                        This export will cost {table.getSelectedRowModel().rows.length} credits.
                        You currently have {userCredits} credits available.
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Current Credits:</span>
                      <span className="font-medium">{userCredits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Cost:</span>
                      <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Remaining Credits:</span>
                      <span className={`font-medium ${userCredits < table.getSelectedRowModel().rows.length ? 'text-red-500' : 'text-green-500'}`}>
                        {userCredits - table.getSelectedRowModel().rows.length}
                      </span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowExportConfirm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleExport}
                    disabled={exporting || userCredits < table.getSelectedRowModel().rows.length}
                    className="bg-black text-white hover:bg-black/90"
                  >
                    {exporting ? 'Exporting...' : 'Confirm Export'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showNoSelectionWarning} onOpenChange={setShowNoSelectionWarning}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>No Records Selected</DialogTitle>
                  <DialogDescription>
                    Please select at least one record to export.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button 
                    onClick={() => setShowNoSelectionWarning(false)}
                    className="bg-black text-white hover:bg-black/90"
                  >
                    OK
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Export Success Dialog */}
            <Dialog open={showExportSuccess} onOpenChange={setShowExportSuccess}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Successful</DialogTitle>
                  <DialogDescription>
                    Your data has been exported successfully.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Export Completed</AlertTitle>
                    <AlertDescription className="text-green-700">
                      The file has been downloaded to your computer. You can find it in your downloads folder.
                    </AlertDescription>
                  </Alert>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Records Exported:</span>
                      <span className="font-medium">{table.getSelectedRowModel().rows.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Credits Used:</span>
                      <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Remaining Credits:</span>
                      <span className="font-medium text-green-500">{userCredits}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => setShowExportSuccess(false)}
                    className="bg-black text-white hover:bg-black/90"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Row Details Modal */}
            <RowDetailsModal 
              isOpen={isRowDetailsOpen}
              onClose={() => setIsRowDetailsOpen(false)}
              rowData={selectedRow}
            />
          </CardContent>
        </Card>
      )
    }
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedFile = userData.dataFiles[selectedFileIndex]

  return (
    <Card className="border-none shadow-none w-full bg-white text-black">
      <CardContent 
        className="p-1 select-none" 
        onContextMenu={preventContextMenu}
      >
        {/* Logo and Header */}
        <div className="flex flex-col mb-1 w-full">
          
          
          
          
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-2 mb-3 px-1">
          {/* Top Row - Search and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search in all columns..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-9 py-2 h-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-blue-500 focus-visible:ring-opacity-30 focus-visible:border-blue-500 rounded-md"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const openDropdown = document.querySelector('[data-state="open"]');
                  if (openDropdown) {
                    (openDropdown as HTMLElement).click();
                  }
                  setIsFilterOpen(true);
                }}
                className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 h-10 rounded-md"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters {Object.keys(activeFilters).length > 0 && `(${Object.keys(activeFilters).length})`}
              </Button>
            
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 h-10 rounded-md"
                  >
                    <Eye className="h-4 w-4" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-md w-56">
                  <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Toggle Columns</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  
                  {/* Quick selection options */}
                  <div className="p-2 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Presets</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-gray-200 text-gray-700"
                        onClick={() => {
                          // Show only essential columns (customize this list as needed)
                          const essentialColumns = ["First_Name", "Last_Name", "Email", "Company", "Title", "Country"];
                          const newVisibility: VisibilityState = {};
                          
                          // First hide all columns except select
                          table.getAllLeafColumns().forEach(column => {
                            if (column.id !== "select") {
                              newVisibility[column.id] = false;
                            }
                          });
                          
                          // Then show only essential columns
                          essentialColumns.forEach(column => {
                            newVisibility[column] = true;
                          });
                          
                          table.setColumnVisibility(newVisibility);
                        }}
                      >
                        Essential Only
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-gray-200 text-gray-700"
                        onClick={() => {
                          const newVisibility: VisibilityState = {};
                          table.getAllLeafColumns().forEach(column => {
                            if (column.id !== "select") {
                              newVisibility[column.id] = true;
                            }
                          });
                          table.setColumnVisibility(newVisibility);
                        }}
                      >
                        Show All
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 text-xs border-gray-200 text-gray-700"
                        onClick={() => {
                          const newVisibility: VisibilityState = {};
                          table.getAllLeafColumns().forEach(column => {
                            if (column.id !== "select") {
                              newVisibility[column.id] = false;
                            }
                          });
                          table.setColumnVisibility(newVisibility);
                        }}
                      >
                        Hide All
                      </Button>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="bg-gray-100 my-1" />
                  
                  <div className="max-h-[400px] overflow-y-auto p-2">
                    {table.getAllLeafColumns().filter(column => column.id !== "select").map(column => (
                      <div key={column.id} className="py-1.5 px-1 flex items-center space-x-2">
                        <Checkbox
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          id={`column-${column.id}`}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label 
                          htmlFor={`column-${column.id}`}
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          {column.id.replace(/_/g, ' ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            
              <Button
                variant="outline"
                size="sm"
                className="text-gray-700 border-gray-200 hover:bg-gray-50 flex items-center gap-2 h-10 rounded-md"
                onClick={() => setShowExportConfirm(true)}
                disabled={!userData || userData.dataFiles[selectedFileIndex]?.data.length === 0 || exporting}
              >
                <Download className="h-4 w-4" />
                Export Selected
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
          <Table className="select-none w-full bg-white">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow 
                  key={headerGroup.id} 
                  className="border-none select-none"
                >
                  {headerGroup.headers.map((header, index) => (
                    <TableHead 
                      key={header.id} 
                      className={cn(
                        "text-gray-500 font-medium bg-gray-50 px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg border-b border-gray-200 select-none text-sm",
                        header.id === "select" && "w-[40px] pr-0"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="bg-white select-none">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-gray-50 cursor-pointer bg-white select-none transition-colors",
                      rowIndex === table.getRowModel().rows.length - 1 ? "last:border-b-0" : "border-b border-gray-100"
                    )}
                    onClick={() => {
                      setSelectedRow(row.original)
                      setIsRowDetailsOpen(true)
                    }}
                  >
                    {row.getVisibleCells().map((cell, cellIndex) => (
                      <TableCell 
                        key={cell.id} 
                        className={cn(
                          "text-gray-900 px-4 py-3 bg-white select-none text-sm",
                          cell.column.id === "select" && "pr-0 pl-4 w-[40px]",
                          row.getIsSelected() && "bg-blue-50/40",
                          rowIndex === table.getRowModel().rows.length - 1 && cellIndex === 0 && "rounded-bl-lg",
                          rowIndex === table.getRowModel().rows.length - 1 && cellIndex === row.getVisibleCells().length - 1 && "rounded-br-lg"
                        )}
                        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-gray-400 bg-white select-none rounded-b-lg"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-1 mt-1 px-1">
          <div className="flex-1 text-sm text-gray-500">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
        </div>

        {/* Export Confirmation Dialog */}
        <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Export</DialogTitle>
              <DialogDescription>
                Please review the export details before proceeding
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {userCredits < table.getSelectedRowModel().rows.length ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Insufficient Credits</AlertTitle>
                  <AlertDescription>
                    You don't have enough credits to export {table.getSelectedRowModel().rows.length} records.
                    Please contact your admin to get more credits.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Credit Information</AlertTitle>
                  <AlertDescription>
                    This export will cost {table.getSelectedRowModel().rows.length} credits.
                    You currently have {userCredits} credits available.
                  </AlertDescription>
                </Alert>
              )}
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Current Credits:</span>
                  <span className="font-medium">{userCredits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Cost:</span>
                  <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Remaining Credits:</span>
                  <span className={`font-medium ${userCredits < table.getSelectedRowModel().rows.length ? 'text-red-500' : 'text-green-500'}`}>
                    {userCredits - table.getSelectedRowModel().rows.length}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportConfirm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport}
                disabled={exporting || userCredits < table.getSelectedRowModel().rows.length}
                className="bg-black text-white hover:bg-black/90"
              >
                {exporting ? 'Exporting...' : 'Confirm Export'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showNoSelectionWarning} onOpenChange={setShowNoSelectionWarning}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>No Records Selected</DialogTitle>
              <DialogDescription>
                Please select at least one record to export.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                onClick={() => setShowNoSelectionWarning(false)}
                className="bg-black text-white hover:bg-black/90"
              >
                OK
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Success Dialog */}
        <Dialog open={showExportSuccess} onOpenChange={setShowExportSuccess}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Successful</DialogTitle>
              <DialogDescription>
                Your data has been exported successfully.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Export Completed</AlertTitle>
                <AlertDescription className="text-green-700">
                  The file has been downloaded to your computer. You can find it in your downloads folder.
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Records Exported:</span>
                  <span className="font-medium">{table.getSelectedRowModel().rows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credits Used:</span>
                  <span className="font-medium text-red-500">-{table.getSelectedRowModel().rows.length}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span>Remaining Credits:</span>
                  <span className="font-medium text-green-500">{userCredits}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => setShowExportSuccess(false)}
                className="bg-black text-white hover:bg-black/90"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Row Details Modal */}
        <RowDetailsModal 
          isOpen={isRowDetailsOpen}
          onClose={() => setIsRowDetailsOpen(false)}
          rowData={selectedRow}
        />
      </CardContent>
    </Card>
  )
}

