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
      baseHue = Math.abs(hash % 30) + 120; // Fresh greens (120-150)
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
                  className="h-8 text-gray-300 hover:text-white hover:bg-gray-800 -ml-3 data-[state=open]:bg-gray-800"
                >
                  <span>{columnKey.replace(/_/g, ' ')}</span>
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-gray-900 border-gray-700">
                <DropdownMenuLabel className="text-gray-300">Sort</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(false)}
                  className="text-gray-300 focus:bg-gray-800 focus:text-white"
                >
                  Asc
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(true)}
                  className="text-gray-300 focus:bg-gray-800 focus:text-white"
                >
                  Desc
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
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
                <div className="flex items-center gap-1 max-w-[400px] h-7">
                  {techs.slice(0, MAX_VISIBLE).map((tech, index) => (
                    <div 
                      key={index}
                      className="px-2 py-0.5 rounded-md text-xs whitespace-nowrap"
                      style={{ 
                        backgroundColor: bgColor,
                        color: 'white',
                        fontWeight: '500',
                      }}
                    >
                      {tech}
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div 
                      className="px-2 py-0.5 rounded-md text-xs whitespace-nowrap bg-gray-700 text-white"
                      title={techs.slice(MAX_VISIBLE).join(', ')} // Show remaining on hover
                    >
                      +{remainingCount} more
                    </div>
                  )}
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
          if (columnKey === "Website" || columnKey === "Person_Linkedin_Url" || columnKey === "Company_Linkedin_Url") {
            return (
              <div 
                className="text-gray-300 max-w-[200px] truncate h-7 flex items-center"
                title={value} // Show full text on hover
              >
                {value}
              </div>
            );
          }

          // Default rendering for other columns
          return <div className="text-gray-300 h-7 flex items-center">{value}</div>;
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
      <Card className="border-none shadow-none w-full bg-black text-white">
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
    <Card className="border-none shadow-none w-full bg-black text-white">
      <CardContent className="p-4">
        {/* Logo and Header */}
        <div className="flex flex-col mb-8 w-full">
          <div className="flex justify-between w-full">
            <div className="relative w-32 h-10">
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
              className="text-gray-300 border-gray-700 hover:bg-gray-800 flex items-center gap-2 h-fit"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <div className="w-[calc(100%+32px)] h-[1px] bg-white my-3 -mx-4"></div>
          <div className="flex flex-col gap-1">
         
            <h2 className="text-lg text-gray-400">{selectedFile.title}</h2>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Top Row - Search and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 w-full max-w-sm">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search in all columns..."
                  value={globalFilter ?? ""}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8 bg-black border-gray-700 text-white placeholder:text-gray-400 focus-visible:ring-gray-700"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="text-gray-300 border-gray-700 hover:bg-gray-800 flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters {Object.keys(activeFilters).length > 0 && `(${Object.keys(activeFilters).length})`}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-gray-300 border-gray-700 hover:bg-gray-800"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] bg-gradient-to-b from-black to-gray-900/95 border-gray-700 p-3 backdrop-blur-sm">
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
                <DropdownMenuContent className="w-[200px] bg-gray-900 border-gray-700">
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

          {/* Filter Buttons Row */}
          <div className="flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-gray-300 border-gray-700 hover:bg-gray-800 flex items-center gap-2"
                >
                  Country
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-900 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder="Search country..."
                    value={(table.getColumn("Country")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                      table.getColumn("Country")?.setFilterValue(event.target.value)
                    }
                    className="h-8 w-full bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus-visible:ring-gray-700"
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table Section */}
        <div className="rounded-lg bg-black">
          <div className="relative w-full overflow-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-gray-900/50 border-none">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-gray-300 bg-gray-900/50">
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
                      className="hover:bg-gray-900/50 border-none cursor-pointer"
                      onClick={() => setSelectedRow(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="text-gray-300">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-400"
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
          <DialogContent className="bg-gradient-to-b from-gray-900 to-black border-gray-800 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Contact Details</DialogTitle>
            </DialogHeader>
            {selectedRow && (
              <div className="mt-6">
                {/* Header with Avatar */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-800">
                  <div className="h-20 w-20 rounded-full bg-black border border-gray-800 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
                    {`${selectedRow.First_Name[0]}${selectedRow.Last_Name[0]}`}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{`${selectedRow.First_Name} ${selectedRow.Last_Name}`}</h3>
                    <p className="text-lg text-gray-400">{selectedRow.Title}</p>
                    <p className="text-blue-400 mt-1">{selectedRow.Company}</p>
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-8 mt-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Contact Information</h4>
                      
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Email</p>
                          <a href={`mailto:${selectedRow.Email}`} className="text-white hover:underline">{selectedRow.Email}</a>
                        </div>
                      </div>

                      {selectedRow.Corporate_Phone && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Phone className="h-5 w-5 text-orange-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Corporate Phone</p>
                            <p className="text-white">{selectedRow.Corporate_Phone}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-pink-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Location</p>
                          <p className="text-white">{selectedRow.Country}</p>
                        </div>
                      </div>
                    </div>

                    {/* Online Presence */}
                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Online Presence</h4>
                      
                      {selectedRow.Website && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Website</p>
                            <a href={selectedRow.Website} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">{selectedRow.Website}</a>
                          </div>
                        </div>
                      )}

                      {selectedRow.Person_Linkedin_Url && (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <LinkedinIcon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">LinkedIn Profile</p>
                            <a href={selectedRow.Person_Linkedin_Url} target="_blank" rel="noopener noreferrer" className="text-white hover:underline">View Profile</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    {/* Company Information */}
                    <div className="bg-gray-900/50 rounded-lg p-4 space-y-4">
                      <h4 className="text-lg font-semibold text-white mb-4">Company Information</h4>
                      
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Company</p>
                          <p className="text-white">{selectedRow.Company}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Company Size</p>
                          <p className="text-white">{selectedRow.Employees_Size} employees</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Industry</p>
                          <p className="text-white">{selectedRow.Industry}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Annual Revenue</p>
                          <p className="text-white">{selectedRow.Annual_Revenue}</p>
                        </div>
                      </div>
                    </div>

                    {/* Technologies */}
                    {selectedRow.Technologies && (
                      <div className="bg-gray-900/50 rounded-lg p-4">
                        <h4 className="text-lg font-semibold text-white mb-4">Technologies</h4>
                        <ScrollArea className="h-[120px]">
                          <div className="flex flex-wrap gap-2 pr-4">
                            {selectedRow.Technologies.split(',').map((tech, index) => (
                              <Badge 
                                key={index} 
                                className="bg-gray-800 text-white hover:bg-gray-700 px-3 py-1 rounded-full text-sm"
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
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-between py-4">
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

