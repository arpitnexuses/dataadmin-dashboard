"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Download, LogOut } from "lucide-react"
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
} from "@/components/ui/dialog"
import { Building2, Mail, Phone, Users, Globe, LinkedinIcon, DollarSign, Briefcase, MapPin } from "lucide-react"
import { motion } from "framer-motion"
import { BarChart, PieChart, LineChart } from "lucide-react"
import { AnalyticsModal } from "./analytics-modal"

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
      baseHue = Math.abs(hash % 360); // Full color spectrum for titles
      break;
    case 'Country':
      baseHue = Math.abs(hash % 30) + 200; // Cool blues (200-230)
      break;
    case 'Technologies':
      baseHue = Math.abs(hash % 30) + 60; // Happy yellows (60-90)
      break;
    default:
      baseHue = Math.abs(hash % 360);
  }
  
  return `hsl(${baseHue}, 85%, 35%)`; // Higher saturation and medium lightness for happy colors
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
}

interface DataTableProps {
  selectedFileIndex: number
  activeFilters: Record<string, string[]>
  setIsFilterOpen: (isOpen: boolean) => void
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

export function DataTable({ selectedFileIndex, activeFilters, setIsFilterOpen }: DataTableProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")
  const [selectedRow, setSelectedRow] = useState<DataRow | null>(null)
  const [isFilterOpen, setIsFilterOpenState] = useState(false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/data")
        if (response.ok) {
          const data = await response.json()
          // console.log("Fetched data:", data)
          setUserData(data)
        }
      } catch (error) {
        // console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

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
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
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
                  className="h-8 text-gray-300 hover:text-white hover:bg-gray-800 -ml-3 data-[state=open]:bg-gray-800 font-semibold tracking-wide"
                >
                  <span>{columnKey.replace(/_/g, ' ')}</span>
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-gray-900 border-gray-800">
                <DropdownMenuLabel className="text-gray-300">Sort</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(false)}
                  className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800"
                >
                  Asc
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(true)}
                  className="text-gray-300 hover:bg-gray-800 focus:bg-gray-800"
                >
                  Desc
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuLabel className="text-gray-300">Filter</DropdownMenuLabel>
                <div className="p-2">
                  <Input
                    placeholder={`Filter ${columnKey.replace(/_/g, ' ')}...`}
                    value={(column.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      column.setFilterValue(event.target.value)
                    }
                    className="h-8 w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus-visible:ring-gray-700"
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
                <div className="flex items-center gap-1.5 max-w-[350px] h-6">
                  {techs.slice(0, MAX_VISIBLE).map((tech, index) => (
                    <div 
                      key={index}
                      className="px-2 py-0.5 rounded-md text-xs whitespace-nowrap"
                      style={{ 
                        backgroundColor: getColumnColor(tech, columnKey),
                        color: 'white',
                        fontWeight: '500',
                        fontSize: '0.75rem',
                        lineHeight: '1rem',
                      }}
                    >
                      {tech}
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div 
                      className="px-2 py-0.5 rounded-md text-xs whitespace-nowrap bg-gray-700/50 text-gray-300"
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
                  className="inline-flex items-center h-6 whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                  style={{ 
                    color: 'text-gray-300',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                    lineHeight: '1rem',
                  }}
                  title={value} // Show full text on hover
                >
                  <span className="mr-1.5 text-4xl leading-none" style={{ color: getColumnColor(value, columnKey) }}>•</span>
                  {value}
                </div>
              );
            }

            return (
              <div 
                className="px-3 py-1.5 rounded-md inline-block max-w-[200px] h-7"
                style={{ 
                  backgroundColor: bgColor,
                  color: 'white',
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  lineHeight: '1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                className="text-gray-300 h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[230px]"
                title={value} // Show full text on hover
              >
                {value}
              </div>
            );
          }

          if (columnKey === "Website" || columnKey === "Person_Linkedin_Url" || columnKey === "Company_Linkedin_Url") {
            return (
              <div 
                className="text-gray-300 max-w-[180px] truncate h-6 flex items-center"
                title={value} // Show full text on hover
              >
                {value}
              </div>
            );
          }

          // Default rendering for other columns
          if (columnKey === "Company") {
            return (
              <div 
                className="text-gray-300 h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                title={value} // Show full text on hover
              >
                {value}
              </div>
            );
          }
          return <div className="text-gray-300 h-6 flex items-center">{value}</div>;
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
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
  })

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

  if (loading) {
    return (
      <Card className="border-none shadow-none w-full bg-[#1C1C1C] text-white">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!userData || !userData.dataFiles[selectedFileIndex]) {
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

  const exportToExcel = (selectedOnly: boolean = false) => {
    const dataToExport = selectedOnly 
      ? table.getSelectedRowModel().rows.map(row => row.original)
      : selectedFile.data
    
    if (selectedOnly && dataToExport.length === 0) {
      alert("Please select rows to export")
      return
    }

    const ws = XLSX.utils.json_to_sheet(dataToExport)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${selectedFile.title}${selectedOnly ? '_selected' : ''}.xlsx`)
  }

  return (
    <Card className="border-none shadow-none w-full bg-[#1C1C1C] text-white transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/20">
      <CardContent className="p-1">
        {/* Logo and Header */}
        <div className="flex flex-col mb-1 w-full">
          <div className="flex justify-between w-full items-center px-1">
            <div className="relative w-40 h-12 transition-transform duration-300 hover:scale-105">
              <img
                src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses_logo_blue_(2)_3_721ee160-2cac-429c-af66-f55b7233f6ed.png"
                alt="Nexuses Logo"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="relative overflow-hidden text-gray-300 border-gray-700 hover:bg-gray-800/50 hover:text-white flex items-center gap-2 h-fit transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-gray-900/20 group px-4 py-2 rounded-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-800/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="flex items-center gap-2 relative z-10">
                <LogOut className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:rotate-180" />
                <span className="font-medium tracking-wide">Logout</span>
              </div>
            </Button>
          </div>
          <div className="relative w-full my-3 flex items-center justify-center overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 1.2,
                ease: [0.4, 0, 0.2, 1]
              }}
              className="relative w-full h-[2px]"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.8,
                  delay: 0.3
                }}
                className="absolute inset-0 z-40 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.75 }}
                transition={{
                  duration: 0.8,
                  delay: 0.5
                }}
                className="absolute inset-0 z-30 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.8, scale: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.2
                }}
                className="absolute -inset-[2px] z-20 blur-[12px] bg-cyan-500/50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.5, scale: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.2
                }}
                className="absolute -inset-[4px] z-10 blur-[20px] bg-cyan-400/30"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1 }}
                transition={{
                  duration: 1,
                  delay: 0.2
                }}
                className="absolute -inset-[6px] z-0 blur-[30px] bg-cyan-300/20"
              />
            </motion.div>
          </div>
          <div className="flex flex-col gap-2 px-1">
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-300 border border-cyan-500/30 hover:border-cyan-500/50 bg-[#1C1C1C]/50 hover:bg-gray-900/50 flex items-center gap-2 w-fit relative group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="text-xl font-medium tracking-wide relative z-10">{selectedFile.title}</span>
                    <ChevronDown className="h-4 w-4 relative z-10 group-hover:text-cyan-400 transition-colors duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-[300px] bg-gradient-to-b from-gray-800/95 to-gray-900/95 border border-cyan-500 shadow-lg shadow-cyan-500/20 backdrop-blur-xl"
                  sideOffset={5}
                  align="start"
                  alignOffset={-4}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                    <DropdownMenuLabel className="text-cyan-400 px-3 py-2 text-sm font-medium">Select File</DropdownMenuLabel>
                  </div>
                  <DropdownMenuSeparator className="bg-cyan-500/20" />
                  <div className="max-h-[300px] overflow-auto py-1">
                    {userData?.dataFiles.map((file, index) => (
                      <DropdownMenuItem
                        key={file.id}
                        className={cn(
                          "text-gray-300 hover:text-white focus:text-white px-3 py-2 cursor-pointer transition-all duration-200",
                          "hover:bg-cyan-500/10 focus:bg-cyan-500/10",
                          "focus:outline-none focus:ring-0",
                          selectedFileIndex === index && "bg-cyan-500/10 text-white"
                        )}
                        onClick={() => {
                          const url = new URL(window.location.href);
                          url.searchParams.set('file', index.toString());
                          window.location.href = url.toString();
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-cyan-500/50"></div>
                          <span>{file.title}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                className="text-gray-300 border border-cyan-500/30 hover:border-cyan-500/50 bg-[#1C1C1C]/50 hover:bg-gray-900/50 flex items-center gap-2 relative group overflow-hidden"
                onClick={() => setIsAnalyticsOpen(true)}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <BarChart className="h-4 w-4 relative z-10" />
                <span className="relative z-10">Analytics</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-2 mb-3 px-1">
          {/* Top Row - Search and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search in all columns..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8 bg-[#1C1C1C] border-gray-700 text-white placeholder:text-gray-400 focus-visible:ring-gray-700"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Close any open dropdown menu
                  const openDropdown = document.querySelector('[data-state="open"]');
                  if (openDropdown) {
                    (openDropdown as HTMLElement).click();
                  }
                  // Open the filter
                  setIsFilterOpen(true);
                }}
                className="text-gray-300 border-gray-700 hover:bg-gray-800 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters {Object.keys(activeFilters).length > 0 && `(${Object.keys(activeFilters).length})`}
              </Button>
              <DropdownMenu>
                {/* <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-300 border-gray-700 hover:bg-gray-800"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger> */}
                <DropdownMenuContent className="w-[300px] bg-gradient-to-b from-gray-800 to-gray-900/95 border-gray-700 p-3 backdrop-blur-sm">
                  <div className="space-y-4">
                    {generalFilters && generalFilters.titles && generalFilters.titles.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Common Titles</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {generalFilters.titles.map((title) => (
                            <Button
                              key={title}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "text-gray-300 border-gray-700 hover:bg-gray-800",
                                table.getColumn("Title")?.getFilterValue() === title && 
                                "bg-white text-black hover:bg-white hover:text-black"
                              )}
                              onClick={() => table.getColumn("Title")?.setFilterValue(title)}
                            >
                              {title}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {generalFilters && generalFilters.industries && generalFilters.industries.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Common Industries</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {generalFilters.industries.map((industry) => (
                            <Button
                              key={industry}
                              variant="outline"
                              size="sm"
                              className={cn(
                                "text-gray-300 border-gray-700 hover:bg-gray-800",
                                table.getColumn("Industry")?.getFilterValue() === industry && 
                                "bg-white text-black hover:bg-white hover:text-black"
                              )}
                              onClick={() => table.getColumn("Industry")?.setFilterValue(industry)}
                            >
                              {industry}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {generalFilters && (
                      <>
                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Company Size</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {generalFilters.employeeSizeRanges.map((range) => (
                              <Button
                                key={range.label}
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "text-gray-300 border-gray-700 hover:bg-gray-800",
                                  table.getColumn("Employees_Size")?.getFilterValue() === range.value && 
                                  "bg-white text-black hover:bg-white hover:text-black"
                                )}
                                onClick={() => table.getColumn("Employees_Size")?.setFilterValue(range.value)}
                              >
                                {range.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-300 mb-2">Revenue</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {generalFilters.revenueRanges.map((range) => (
                              <Button
                                key={range.label}
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "text-gray-300 border-gray-700 hover:bg-gray-800",
                                  table.getColumn("Annual_Revenue")?.getFilterValue() === range.value && 
                                  "bg-white text-black hover:bg-white hover:text-black"
                                )}
                                onClick={() => table.getColumn("Annual_Revenue")?.setFilterValue(range.value)}
                              >
                                {range.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="pt-2 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-gray-300 border-gray-700 hover:bg-gray-800"
                        onClick={() => {
                          table.getColumn("Title")?.setFilterValue("")
                          table.getColumn("Industry")?.setFilterValue("")
                          table.getColumn("Employees_Size")?.setFilterValue("")
                          table.getColumn("Annual_Revenue")?.setFilterValue("")
                          setGlobalFilter("")
                          table.resetColumnFilters()
                          table.resetGlobalFilter()
                          table.resetRowSelection()
                          table.resetPagination()
                          table.setPageIndex(0)
                          const dropdownTrigger = document.querySelector('[data-state="open"]');
                          if (dropdownTrigger) {
                            (dropdownTrigger as HTMLElement).click();
                          }
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-300 border-gray-700 hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px] bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700">
                  <DropdownMenuItem 
                    className="text-gray-300 focus:bg-gray-800 focus:text-white"
                    onClick={() => exportToExcel(false)}
                  >
                    Export All Rows
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="text-gray-300 focus:bg-gray-800 focus:text-white"
                    onClick={() => exportToExcel(true)}
                  >
                    Export Selected Rows
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Action Buttons Row */}
          {/* <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-gray-300 border border-cyan-500/30 hover:border-cyan-500/50 bg-black/50 hover:bg-gray-900/50 flex items-center gap-2"
              onClick={() => setIsAnalyticsOpen(true)}
            >
              <BarChart className="h-4 w-4" />
              Analytics
            </Button>
          </div> */}
        </div>

        {/* Table Section */}
        <div className="rounded-lg bg-[#1C1C1C] border border-gray-700">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-gray-900/50 border-b border-gray-700">
                    {headerGroup.headers.map((header) => (
                      <TableHead 
                        key={header.id} 
                        className="text-gray-300 bg-gradient-to-b from-gray-700 to-[#1C1C1C] border-b border-gray-800 px-2 py-1 first:rounded-tl-lg last:rounded-tr-lg"
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
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="hover:bg-gray-900/50 border-b border-gray-700 cursor-pointer"
                      onClick={() => setSelectedRow(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-gray-300 px-2 py-1">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-16 text-center text-gray-400"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Row Details Modal */}
        <Dialog open={!!selectedRow} onOpenChange={() => setSelectedRow(null)}>
          <DialogContent className="bg-gradient-to-b from-gray-800 to-gray-900 border border-cyan-500 text-white max-w-3xl p-0 gap-0">
            <div className="relative w-full">
              {/* Header Section with Gradient Overlay */}
              <div className="relative p-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-white tracking-tight">Contact Details</DialogTitle>
                </DialogHeader>
              </div>

              {selectedRow && (
                <div className="px-6 pb-6">
                  {/* Header with Avatar */}
                  <div className="flex items-start gap-6 pb-6 border-b border-gray-800/50">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-500 opacity-50"></div>
                      <div className="h-16 w-16 rounded-full bg-gradient-to-b from-gray-800 to-gray-900 border-2 border-cyan-500/50 flex items-center justify-center text-2xl font-bold text-white relative">
                        {selectedRow.Last_Name ? `${selectedRow.First_Name[0]}${selectedRow.Last_Name[0]}` : selectedRow.First_Name[0]}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-2xl font-semibold text-white tracking-tight">{`${selectedRow.First_Name} ${selectedRow.Last_Name}`}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-base text-cyan-400 font-medium">{selectedRow.Title}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-base text-gray-400">{selectedRow.Company}</span>
                      </div>
                    </div>
                  </div>

                  {/* Two Column Layout with Enhanced Cards */}
                  <div className="grid md:grid-cols-2 gap-4 mt-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      {/* Contact Information */}
                      <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/30 backdrop-blur-xl rounded-lg p-4 space-y-4 border border-gray-800/50">
                        <h4 className="text-base font-semibold text-white flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-cyan-500"></span>
                          Contact Information
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500/10 to-red-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                              <Mail className="h-4 w-4 text-red-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Email</p>
                              <a href={`mailto:${selectedRow.Email}`} className="text-sm text-white hover:text-cyan-400 transition-colors">{selectedRow.Email}</a>
                            </div>
                          </div>

                          {selectedRow.Corporate_Phone && (
                            <div className="flex items-center gap-3 group">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                                <Phone className="h-4 w-4 text-orange-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Corporate Phone</p>
                                <p className="text-sm text-white">{selectedRow.Corporate_Phone}</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500/10 to-pink-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                              <MapPin className="h-4 w-4 text-pink-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Location</p>
                              <p className="text-sm text-white">{selectedRow.Country}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Online Presence */}
                      <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/30 backdrop-blur-xl rounded-lg p-4 space-y-4 border border-gray-800/50">
                        <h4 className="text-base font-semibold text-white flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-cyan-500"></span>
                          Online Presence
                        </h4>
                        
                        <div className="space-y-3">
                          {selectedRow.Website && (
                            <div className="flex items-center gap-3 group">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                                <Globe className="h-4 w-4 text-cyan-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Website</p>
                                <a href={selectedRow.Website} target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:text-cyan-400 transition-colors">{selectedRow.Website}</a>
                              </div>
                            </div>
                          )}

                          {selectedRow.Person_Linkedin_Url && (
                            <div className="flex items-center gap-3 group">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                                <LinkedinIcon className="h-4 w-4 text-blue-400" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">LinkedIn Profile</p>
                                <a href={selectedRow.Person_Linkedin_Url} target="_blank" rel="noopener noreferrer" className="text-sm text-white hover:text-cyan-400 transition-colors">View Profile</a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Company Information */}
                      <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/30 backdrop-blur-xl rounded-lg p-4 space-y-4 border border-gray-800/50">
                        <h4 className="text-base font-semibold text-white flex items-center gap-2">
                          <span className="h-1 w-1 rounded-full bg-cyan-500"></span>
                          Company Information
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                              <Building2 className="h-4 w-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Company</p>
                              <p className="text-sm text-white">{selectedRow.Company}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500/10 to-green-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                              <Users className="h-4 w-4 text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Company Size</p>
                              <p className="text-sm text-white">{selectedRow.Employees_Size} employees</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                              <Briefcase className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Industry</p>
                              <p className="text-sm text-white">{selectedRow.Industry}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 group">
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
                              <DollarSign className="h-4 w-4 text-yellow-400" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Annual Revenue</p>
                              <p className="text-sm text-white">{selectedRow.Annual_Revenue}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Technologies */}
                      {selectedRow.Technologies && (
                        <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/30 backdrop-blur-xl rounded-lg p-4 border border-gray-800/50">
                          <h4 className="text-base font-semibold text-white flex items-center gap-2 mb-3">
                            <span className="h-1 w-1 rounded-full bg-cyan-500"></span>
                            Technologies
                          </h4>
                          <ScrollArea className="h-[100px]">
                            <div className="flex flex-wrap gap-1.5 pr-4">
                              {selectedRow.Technologies.split(',').map((tech, index) => (
                                <Badge 
                                  key={index} 
                                  className="bg-gray-800/50 text-white hover:bg-gray-700/50 px-2 py-1 text-xs rounded transition-colors border border-gray-700/50"
                                >
                                  {tech.trim()}
                                </Badge>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Analytics Modal */}
        <AnalyticsModal
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          data={table.getRowModel().rows.map(row => row.original)}
        />

        <div className="flex items-center justify-between py-1 mt-1 px-1">
          <div className="flex-1 text-sm text-gray-400">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="text-gray-300 border-gray-700 hover:bg-gray-800 disabled:opacity-50"
            >
              Previous
            </Button>
            <div className="text-sm text-gray-400">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="text-gray-300 border-gray-700 hover:bg-gray-800 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

