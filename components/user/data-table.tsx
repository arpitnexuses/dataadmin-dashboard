"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Download, Eye, Search, Filter, ChevronDown, AlertCircle,
  Building2, Mail, Phone, Users, Globe, LinkedinIcon, DollarSign, Briefcase, MapPin, Info, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
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
  Row,
  FilterFn,
  VisibilityState,
  ColumnPinningState,
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
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RowDetailsModal } from "./row-details-modal"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  [key: string]: string;  // Make it a dynamic object that can hold any string keys
}

interface UserData {
  title: string
  logoUrl: string
  dataFiles: Array<{
    id: string
    title: string
    filename: string
    columns: string[]
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

// Define the standard column order and mapping
const STANDARD_COLUMNS = [
  // Original columns (commented out)
  // 'S_No',
  // 'First_Name',
  // 'Last_Name',
  // 'Contact_Name',
  // 'Designation',
  // 'Title',
  // 'Company',
  // 'Account_name',
  // 'Email',
  // 'Email_id',
  // 'Email_Status',
  // 'Corporate_Phone',
  // 'Personal_Phone',
  // 'Contact_Number_Personal',
  // 'Phone_Status',
  // 'Employees_Size',
  // 'No_of_Employees',
  // 'Industry',
  // 'Industry_client',
  // 'Industry_Nexuses',
  // 'Type_of_Company',
  // 'Priority',
  // 'Sales_Manager',
  // 'Revenue',
  // 'Annual_Revenue',
  // 'Technologies',
  // 'Person_Linkedin_Url',
  // 'Website',
  // 'Company_Linkedin_Url',
  // 'Country',
  // 'Country_Contact_Person',
  // 'City',
  // 'State',
  // 'Company_Address',
  // 'Company_Headquarter',
  // 'Workmates_Remark',
  // 'TM_Remarks',

  // New combined columns with standardized names
  'S_No',
  'Full_Name',
  'Title',
  'Company_Name',
  'Account_Name',
  'Email',
  'Email_ID',
  'Email_Status',
  'Seniority',
  'Department',
  'Personal_Phone',
  'Company_Phone',
  'Phone_Status',
  'Employee_Count',
  'Industry',
  'Industry_Client',
  'Industry_Nexuses',
  'Company_Type',
  'Priority',
  'Sales_Manager',
  'Revenue',
  'Annual_Revenue',
  'Technologies',
  'Person_LinkedIn_URL',
  'Website',
  'Company_LinkedIn_URL',
  'City',
  'State',
  'Contact_Country',
  'Company_Country',
  'Company_Address',
  'Company_Headquarter',
  'Workmates_Remark',
  'TM_Remarks'
];

// Map column names to their display names
const COLUMN_DISPLAY_NAMES: Record<string, string> = {
  S_No: "S. No.",
  Full_Name: "Full Name",
  Title: "Title",
  Company_Name: "Company Name",
  Account_Name: "Account Name",
  Email: "Email",
  Email_ID: "Email ID",
  Email_Status: "Email Status",
  Seniority: "Seniority",
  Department: "Department",
  Personal_Phone: "Personal Phone",
  Company_Phone: "Company Phone",
  Phone_Status: "Phone Status",
  Employee_Count: "Employee Count",
  Industry: "Industry",
  Industry_Client: "Industry (Client)",
  Industry_Nexuses: "Industry (Nexuses)",
  Company_Type: "Company Type",
  Priority: "Priority",
  Sales_Manager: "Sales Manager",
  Revenue: "Revenue",
  Annual_Revenue: "Annual Revenue",
  Technologies: "Technologies",
  Person_LinkedIn_URL: "LinkedIn Profile",
  Website: "Website",
  Company_LinkedIn_URL: "Company LinkedIn",
  City: "City",
  State: "State",
  Contact_Country: "Contact Country",
  Company_Country: "Company Country",
  Company_Address: "Company Address",
  Company_Headquarter: "Company Headquarter",
  Workmates_Remark: "Workmates Remark",
  TM_Remarks: "TM Remarks"
};

// Map column names to icons
const COLUMN_ICONS: Record<string, any> = {
  S_No: Info,
  First_Name: User,
  Last_Name: User,
  Contact_Name: User,
  Designation: Briefcase,
  Title: Briefcase,
  Company: Building2,
  Account_name: Building2,
  Email: Mail,
  Email_id: Mail,
  Email_Status: Mail,
  Corporate_Phone: Phone,
  Personal_Phone: Phone,
  Contact_Number_Personal: Phone,
  Phone_Status: Phone,
  Employees_Size: Users,
  No_of_Employees: Users,
  Industry: Building2,
  Industry_client: Building2,
  Industry_Nexuses: Building2,
  Type_of_Company: Building2,
  Priority: Info,
  Sales_Manager: Briefcase,
  Revenue: DollarSign,
  Annual_Revenue: DollarSign,
  Technologies: Info,
  Person_Linkedin_Url: LinkedinIcon,
  Website: Globe,
  Company_Linkedin_Url: LinkedinIcon,
  Country: MapPin,
  Country_Contact_Person: MapPin,
  City: MapPin,
  State: MapPin,
  Company_Address: MapPin,
  Company_Headquarter: MapPin,
  Workmates_Remark: Info,
  TM_Remarks: Info
};

// Determine which columns should be treated as links
const URL_COLUMNS = ['Website', 'Person_Linkedin_Url', 'Company_Linkedin_Url'];

// Determine which columns might contain comma-separated values
const MULTI_VALUE_COLUMNS = ['Technologies'];

// Add this helper function at the top with other functions
const getGeneralFilters = (data: DataRow[]) => {
  // Determine if we have standard or new column format
  const hasNewColumns = data.length > 0 && ('Designation' in data[0] || 'Account_name' in data[0]);

  let titleField = 'Title';
  let industryField = 'Industry';
  let countryField = 'Country';
  let employeeSizeField = hasNewColumns ? 'No_of_Employees' : 'Employees_Size';
  let revenueField = hasNewColumns ? 'Revenue' : 'Annual_Revenue';

  // Map fields based on available data
  if (hasNewColumns) {
    if (data[0]['Designation']) titleField = 'Designation';
    if (data[0]['Industry_client']) industryField = 'Industry_client';
    if (data[0]['Country_Contact_Person']) countryField = 'Country_Contact_Person';
  }

  // Get unique values for each field
  const titles = Array.from(new Set(data.map(row => row[titleField])))
    .filter(Boolean)
    .sort();

  const industries = Array.from(new Set(data.map(row => row[industryField])))
    .filter(Boolean)
    .sort();

  const countries = Array.from(new Set(data.map(row => row[countryField])))
    .filter(Boolean)
    .sort();

  // Create employee size ranges
  const employeeSizeRanges = [
    { label: "< 100", value: "lt100" },
    { label: "100 - 500", value: "100-500" },
    { label: "500+", value: "gt500" }
  ];

  // Create revenue ranges
  const revenueRanges = [
    { label: "< 1M", value: "lt1M" },
    { label: "1M - 50M", value: "1M-50M" },
    { label: "50M+", value: "gt50M" }
  ];

  return {
    titles: titles.slice(0, 5),
    industries: industries.slice(0, 5),
    countries: countries.slice(0, 5),
    employeeSizeRanges,
    revenueRanges,
    fields: {
      title: titleField,
      industry: industryField,
      country: countryField,
      employeeSize: employeeSizeField,
      revenue: revenueField
    }
  };
};

// Add custom filter functions
const employeeSizeFilter: FilterFn<DataRow> = (row, columnId, value) => {
  const employeeCount = parseInt(row.getValue<string>(columnId).replace(/[^0-9]/g, '')) || 0;
  
  // Handle both internal codes and display values
  if (value === 'lt100' || value === '< 100') return employeeCount < 100;
  if (value === '100-500' || value === '100 - 500') return employeeCount >= 100 && employeeCount <= 500;
  if (value === 'gt500' || value === '500+') return employeeCount > 500;
  return true;
};

const revenueFilter: FilterFn<DataRow> = (row, columnId, value) => {
  const revenue = parseFloat(row.getValue<string>(columnId).replace(/[^0-9.-]+/g, "")) || 0;
  
  // Handle both internal codes and display values
  if (value === 'lt1M' || value === '< 1M') return revenue < 1000000;
  if (value === '1M-50M' || value === '1M - 50M') return revenue >= 1000000 && revenue <= 50000000;
  if (value === 'gt50M' || value === '50M+') return revenue > 50000000;
  return true;
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
  const [exporting, setExporting] = useState(false)
  const [showExportConfirm, setShowExportConfirm] = useState(false)
  const [showNoSelectionWarning, setShowNoSelectionWarning] = useState(false)
  const [showExportSuccess, setShowExportSuccess] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [isRowDetailsOpen, setIsRowDetailsOpen] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pageSize, setPageSize] = useState<number>(10)
  const [pageIndex, setPageIndex] = useState<number>(0)
  const [showReviewSelected, setShowReviewSelected] = useState(false)
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx')
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: ['select'], // Select column is pinned by default
  })

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
                columns: [],
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

  // NEW: Add effect to initialize column visibility with all columns visible by default
  useEffect(() => {
    if (userData?.dataFiles && userData.dataFiles[selectedFileIndex]?.data[0]) {
      // Get all available columns and set them to visible by default
      const availableColumns = Object.keys(userData.dataFiles[selectedFileIndex].data[0]);
      const initialVisibility: VisibilityState = {};
      
      availableColumns.forEach(column => {
        initialVisibility[column] = true;
      });
      
      // Make sure the select column stays visible too
      initialVisibility['select'] = true;
      
      // Update column visibility state
      setColumnVisibility(initialVisibility);
    }
  }, [userData, selectedFileIndex]);

  // Add utility functions for row selection
  const selectAllRows = () => {
    const newSelection: Record<string, boolean> = {};
    // Select all filtered rows across all pages (not just current page)
    filteredData.forEach((row, index) => {
      newSelection[index] = true;
    });
    setRowSelection(newSelection);
  };

  const deselectAllRows = () => {
    setRowSelection({});
  };

  const columns = useMemo<ColumnDef<DataRow>[]>(() => {
    if (!userData?.dataFiles[selectedFileIndex]?.data[0]) {
      return []
    }
    
    // Get the first row to determine available columns
    const firstRow = userData.dataFiles[selectedFileIndex].data[0];
    
    // Get all available columns from the data
    const availableColumns = Object.keys(firstRow);
    
    // Filter STANDARD_COLUMNS to only include columns that exist in the data
    const orderedColumns = STANDARD_COLUMNS.filter(col => availableColumns.includes(col));
    
    // Add any remaining columns that aren't in STANDARD_COLUMNS
    const remainingColumns = availableColumns.filter(col => !STANDARD_COLUMNS.includes(col));
    
    // Combine ordered columns with remaining columns
    const finalColumns = [...orderedColumns, ...remainingColumns];
    
    const defaultColumns: ColumnDef<DataRow>[] = [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected() || (Object.keys(rowSelection).length > 0 && table.getIsAllPageRowsSelected())}
            onCheckedChange={(value) => {
              if (value) {
                selectAllRows();
              } else {
                deselectAllRows();
              }
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
        meta: { order: -1 } // Give it the lowest order to ensure it's first
      }
    ]

    const dataColumns: ColumnDef<DataRow>[] = finalColumns.map(columnKey => {
      // Get the index of the current column in the desired order
      const columnIndex = STANDARD_COLUMNS.indexOf(columnKey);
      
      const baseColumn: Partial<ColumnDef<DataRow>> = {
        accessorKey: columnKey,
        header: ({ column }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 -ml-3 font-medium text-gray-100 bg-[#8370FC] hover:text-white hover:bg-[#6f5de7] tracking-wide text-sm"
                >
                  <span>{COLUMN_DISPLAY_NAMES[columnKey] || columnKey.replace(/_/g, ' ')}</span>
                  <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border border-gray-200 shadow-lg rounded-md">
                <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Sort</DropdownMenuLabel>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(false)}
                  className="text-sm hover:bg-[#8370FC]/10 focus:bg-[#8370FC]/10 cursor-pointer"
                >
                  Ascending
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => column.toggleSorting(true)}
                  className="text-sm hover:bg-[#8370FC]/10 focus:bg-[#8370FC]/10 cursor-pointer"
                >
                  Descending
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuLabel className="text-sm text-gray-500 font-normal">Filter</DropdownMenuLabel>
                <div className="p-2">
                  <Input
                    placeholder={`Filter ${COLUMN_DISPLAY_NAMES[columnKey] || columnKey.replace(/_/g, ' ')}...`}
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
        cell: ({ row }: { row: Row<DataRow> }) => {
          const value = row.getValue(columnKey) as string;
          if ((columnKey === "Industry" || columnKey === "Industry_client" || columnKey === "Industry_Nexuses" || 
               columnKey === "Title" || columnKey === "Designation" || 
               columnKey === "Country" || columnKey === "Country_Contact_Person" || 
               columnKey === "Technologies") && value) {
            const bgColor = getColumnColor(value, columnKey);
            
            // For Technologies column, show limited badges with "+X more"
            if ((columnKey === "Technologies") && value.includes(',')) {
              const techs = value.split(',').map(t => t.trim());
              const MAX_VISIBLE = 2; // Show only first 2 technologies
              const remainingCount = techs.length - MAX_VISIBLE;
              
              return (
                <div className="flex items-center gap-1.5 max-w-[350px]">
                  {techs.slice(0, MAX_VISIBLE).map((tech: string, index: number) => (
                    <div 
                      key={index}
                      className="px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap border border-gray-200 bg-gray-50 text-gray-700"
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

            // Special styling for Title and Designation columns
            if (columnKey === "Title" || columnKey === "Designation") {
              return (
                <div 
                  className="inline-flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px]"
                  title={value} // Show full text on hover
                >
                  <div 
                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0 bg-[#8370FC]"
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
                className="px-2 py-0.5 rounded-md inline-block max-w-[200px] text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700"
                style={{ 
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

          // For email-like columns
          if (columnKey === "Email" || columnKey === "Email_id" || columnKey.toLowerCase().includes('email')) {
            return (
              <div 
                className="text-black h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[230px] gap-1.5 group"
                title={value}
              >
                <Mail className="h-3.5 w-3.5 text-[#8370FC] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For phone-like columns
          if (columnKey === "Corporate_Phone" || columnKey === "Personal_Phone" || columnKey === "Contact_Number_Personal" || columnKey.toLowerCase().includes('phone')) {
            return (
              <div 
                className="text-black h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] gap-1.5 group"
                title={value}
              >
                <Phone className="h-3.5 w-3.5 text-[#8370FC] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For URL-like columns
          if (columnKey === "Website") {
            return (
              <div 
                className="text-black max-w-[180px] truncate h-6 flex items-center gap-1.5 group"
                title={value}
              >
                <Globe className="h-3.5 w-3.5 text-[#8370FC] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For LinkedIn columns
          if (columnKey.includes("Linkedin_Url") || columnKey.includes("Linkedin")) {
            return (
              <div 
                className="text-black max-w-[180px] truncate h-6 flex items-center gap-1.5 group"
                title={value}
              >
                <LinkedinIcon className="h-3.5 w-3.5 text-[#8370FC] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For Company columns
          if (columnKey === "Company" || columnKey === "Account_name") {
            return (
              <div 
                className="text-black h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] gap-1.5 group"
                title={value}
              >
                <Building2 className="h-3.5 w-3.5 text-[#8370FC] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // For address columns
          if (columnKey === "Company_Address" || columnKey === "Company_Headquarter" || columnKey === "City" || columnKey === "State") {
            return (
              <div 
                className="text-black h-6 flex items-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[180px] gap-1.5 group"
                title={value}
              >
                <MapPin className="h-3.5 w-3.5 text-[#8370FC] flex-shrink-0 opacity-70 group-hover:opacity-100" />
                <span className="truncate">{value}</span>
              </div>
            );
          }

          // Default rendering for other columns with possible truncation for long values
          if (columnKey === "Company" || columnKey === "Account_name" || columnKey === "Company_Address" || columnKey === "Company_Headquarter" || columnKey.includes("Remark")) {
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
      if (columnKey === "Employees_Size" || columnKey === "No_of_Employees") {
        baseColumn.filterFn = employeeSizeFilter;
      } else if (columnKey === "Annual_Revenue" || columnKey === "Revenue") {
        baseColumn.filterFn = revenueFilter;
      }

      return {
        ...baseColumn,
        // Add a sort order based on the column's position in the desired order
        meta: {
          order: columnIndex === -1 ? 999 : columnIndex // Put unknown columns at the end
        }
      } as ColumnDef<DataRow>;
    });

    // Sort the columns based on the desired order
    const sortedColumns = [...defaultColumns, ...dataColumns].sort((a, b) => {
      const aMeta = a.meta as { order?: number };
      const bMeta = b.meta as { order?: number };
      const aOrderValue = aMeta?.order ?? 999;
      const bOrderValue = bMeta?.order ?? 999;
      return aOrderValue - bOrderValue;
    });

    return sortedColumns;
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

          const rowValue = row[filterKey];
          if (!rowValue) return false;

          // Handle different types of filters
          switch (filterKey) {
            case 'Industry':
            case 'Industry_client':
            case 'Industry_Nexuses':
            case 'Title':
            case 'Designation':
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
            case 'Employees_Size':
            case 'No_of_Employees':
              const employeeCount = parseInt(rowValue.replace(/[^0-9]/g, '')) || 0;
              return filterValues.some(value => {
                // The filter values here are '< 100', '100 - 500', '500+', not the internal codes
                if (value === '< 100') return employeeCount < 100;
                if (value === '100 - 500') return employeeCount >= 100 && employeeCount <= 500;
                if (value === '500+') return employeeCount > 500;
                return false;
              });
            case 'Annual_Revenue':
            case 'Revenue':
              const revenue = parseFloat(rowValue.replace(/[^0-9.-]+/g, "")) || 0;
              return filterValues.some(value => {
                // The filter values here are '< 1M', '1M - 50M', '50M+', not the internal codes
                if (value === '< 1M') return revenue < 1000000;
                if (value === '1M - 50M') return revenue >= 1000000 && revenue <= 50000000;
                if (value === '50M+') return revenue > 50000000;
                return false;
              });
            case 'Country':
            case 'Country_Contact_Person':
              return filterValues.includes(rowValue);
            case 'Technologies':
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
            default:
              // For other columns, do a simple includes check
              return filterValues.some(value => 
                rowValue.toLowerCase().includes(value.toLowerCase())
              );
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

  // Add useEffect to setup column pinning after data is loaded
  useEffect(() => {
    if (userData?.dataFiles && userData.dataFiles[selectedFileIndex]?.data[0]) {
      // Check which key columns are available in the data
      const firstRow = userData.dataFiles[selectedFileIndex].data[0];
      const pinnedColumns = ['select']; // Always pin select column
      
      // Check for key columns to pin
      if ('Contact_Name' in firstRow) pinnedColumns.push('Contact_Name');
      if ('First_Name' in firstRow) pinnedColumns.push('First_Name');
      // Remove Last_Name from being pinned
      // if ('Last_Name' in firstRow) pinnedColumns.push('Last_Name');
      
      // Update column pinning state
      setColumnPinning({ left: pinnedColumns });
    }
  }, [userData, selectedFileIndex]);

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
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPagination = updater({ pageIndex, pageSize });
        setPageIndex(newPagination.pageIndex);
        setPageSize(newPagination.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    onColumnPinningChange: setColumnPinning,
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
      columnVisibility,
      pagination: {
        pageIndex,
        pageSize,
      },
      columnPinning,
    },
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableColumnPinning: true,
    manualPagination: false,
  })

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
          format: exportFormat,
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
      a.download = `exported_data.${exportFormat}`
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

  // First, let's fix the handleReviewSelected function to check row selection
  const handleReviewSelected = () => {
    if (table.getSelectedRowModel().rows.length === 0) {
      setShowNoSelectionWarning(true);
      return;
    }
    setShowReviewSelected(true);
  };

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
                      className="pl-9 py-2 h-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-[#8370FC] focus-visible:ring-opacity-30 focus-visible:border-[#8370FC] rounded-md"
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
                              const essentialColumns = [];
                              
                              // Check what columns are available in the data
                              const hasColumn = (col: string) => table.getAllLeafColumns().some(column => column.id === col);
                              
                              // Prioritize these essential columns (limited to 5 core columns)
                              // 1. Person
                              if (hasColumn("Contact_Name")) essentialColumns.push("Contact_Name");
                              else if (hasColumn("First_Name")) essentialColumns.push("First_Name");
                              
                              // 2. Company
                              if (hasColumn("Company")) essentialColumns.push("Company");
                              else if (hasColumn("Account_name")) essentialColumns.push("Account_name");
                              
                              // 3. Role or Title
                              if (hasColumn("Designation")) essentialColumns.push("Designation");
                              else if (hasColumn("Title")) essentialColumns.push("Title");
                              
                              // 4. Email or Contact
                              if (hasColumn("Email_id")) essentialColumns.push("Email_id");
                              else if (hasColumn("Email")) essentialColumns.push("Email");
                              else if (hasColumn("Contact_Number_Personal")) essentialColumns.push("Contact_Number_Personal");
                              
                              // 5. Industry
                              if (hasColumn("Industry_client")) essentialColumns.push("Industry_client");
                              else if (hasColumn("Industry")) essentialColumns.push("Industry");
                              
                              const newVisibility: VisibilityState = {};
                              
                              // First hide all columns except select
                              table.getAllLeafColumns().forEach(column => {
                                if (column.id === "select") {
                                  newVisibility[column.id] = true;
                                } else {
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
                              className="h-4 w-4 rounded border-gray-300 text-[#8370FC] focus:ring-[#8370FC]"
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
                    onClick={handleReviewSelected}
                    disabled={!userData || userData.dataFiles[selectedFileIndex]?.data.length === 0 || exporting}
                  >
                    <Download className="h-4 w-4" />
                    Review & Export
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
              <Table className="select-none w-full bg-white relative">
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
                            "text-gray-100 font-medium bg-[#8370FC] px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg border-b border-[#8370FC]/25 select-none text-sm",
                            header.id === "select" && "w-[40px] pr-0",
                            header.column.getIsPinned() && "sticky z-30 left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                            header.column.getIsPinned() && index > 0 && "left-[40px]",
                            header.column.getIsPinned() && index > 1 && "left-[calc(40px+200px)]",
                            header.column.getIsPinned() && index > 2 && "left-[calc(40px+400px)]",
                            !header.column.getIsPinned() && "relative z-10" // Lower z-index for unpinned columns
                          )}
                          style={{
                            left: header.column.getIsPinned() && index > 0 ? 
                              `${40 + (index - 1) * 180}px` : // Position pinned columns with proper spacing
                              header.column.getIsPinned() ? 0 : undefined
                          }}
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
                          "hover:bg-[#8370FC]/5 cursor-pointer bg-white select-none transition-colors",
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
                              row.getIsSelected() && "bg-[#8370FC]/5",
                              rowIndex === table.getRowModel().rows.length - 1 && cellIndex === 0 && "rounded-bl-lg",
                              rowIndex === table.getRowModel().rows.length - 1 && cellIndex === row.getVisibleCells().length - 1 && "rounded-br-lg",
                              cell.column.getIsPinned() && "sticky z-20 left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                              cell.column.getIsPinned() && cellIndex > 0 && "left-[40px]",
                              cell.column.getIsPinned() && cellIndex > 1 && "left-[calc(40px+200px)]",
                              cell.column.getIsPinned() && cellIndex > 2 && "left-[calc(40px+400px)]",
                              !cell.column.getIsPinned() && "relative z-0" // Lower z-index for unpinned columns
                            )}
                            style={{ 
                              userSelect: 'none', 
                              WebkitUserSelect: 'none',
                              left: cell.column.getIsPinned() && cellIndex > 0 ? 
                                `${40 + (cellIndex - 1) * 180}px` : // Position pinned columns with proper spacing
                                cell.column.getIsPinned() ? 0 : undefined
                            }}
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

            <div className="flex flex-col gap-4 py-4 px-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <p className="text-sm font-medium text-gray-600">
                    Rows per page
                  </p>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      table.setPageSize(Number(value));
                    }}
                  >
                    <SelectTrigger className="h-9 w-[80px]">
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Pagination>
                  <PaginationContent className="gap-2">
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => table.previousPage()} 
                        className={cn(
                          "h-9 px-3 bg-white border-gray-200 hover:bg-gray-50",
                          !table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""
                        )}
                      />
                    </PaginationItem>
                    
                    {/* Generate page numbers */}
                    {Array.from({ length: table.getPageCount() }).map((_, i) => {
                      // Show fewer pages when we have many pages
                      const showReducedPages = table.getPageCount() > 10;
                      // Show first page, last page, and pages around current page
                      if (
                        i === 0 || 
                        i === table.getPageCount() - 1 || 
                        (showReducedPages 
                          ? Math.abs(i - pageIndex) <= 1  // With many pages, only show immediate neighbors
                          : Math.abs(i - pageIndex) <= 2) // With fewer pages, show more neighbors
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink 
                              onClick={() => table.setPageIndex(i)}
                              isActive={pageIndex === i}
                              className={cn("h-9 w-9 font-medium", pageIndex === i && "bg-[#8370FC] text-white hover:bg-[#8370FC]/90")}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      
                      // Add ellipsis if there's a gap (only add one ellipsis per gap)
                      if (
                        (i === 1 && pageIndex > 2) || 
                        (i === table.getPageCount() - 2 && pageIndex < table.getPageCount() - 3) ||
                        (i === pageIndex - 2 && i > 1 && showReducedPages) ||
                        (i === pageIndex + 2 && i < table.getPageCount() - 2 && showReducedPages)
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationEllipsis className="h-9" />
                          </PaginationItem>
                        );
                      }
                      
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => table.nextPage()} 
                        className={cn(
                          "h-9 px-3 bg-white border-gray-200 hover:bg-gray-50",
                          !table.getCanNextPage() ? "pointer-events-none opacity-50" : ""
                        )}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>

                <div className="text-sm font-medium text-gray-600">
                  {table.getFilteredSelectedRowModel().rows.length} of{" "}
                  {table.getFilteredRowModel().rows.length} row(s) selected
                </div>
              </div>
            </div>

            {/* Review Selected Dialog */}
            <Dialog open={showReviewSelected} onOpenChange={setShowReviewSelected}>
              <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col bg-white">
                <DialogHeader>
                  <DialogTitle>Review Selected Records</DialogTitle>
                  <DialogDescription>
                    Review the {table.getSelectedRowModel().rows.length} records you've selected before exporting
                  </DialogDescription>
                </DialogHeader>
                
                <div className="overflow-y-auto flex-grow mt-4 pr-2">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow className="border-none">
                        {table.getVisibleLeafColumns()
                          .filter(column => column.id !== "select" && column.getIsVisible())
                          .slice(0, 6) // Only show first 6 columns in the review
                          .map((column) => (
                            <TableHead 
                              key={column.id} 
                              className="bg-[#8370FC]/20 hover:bg-[#8370FC]/30 px-4 py-3 text-sm font-medium text-gray-100 border-b border-[#8370FC]/25"
                            >
                              {column.id.replace(/_/g, ' ')}
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.getSelectedRowModel().rows.slice(0, 50).map((row: any, i: number) => {
                        const rowData = row.original;
                        return (
                          <TableRow 
                            key={i} 
                            className="bg-white hover:bg-blue-50/30"
                          >
                            {table.getVisibleLeafColumns()
                              .filter(column => column.id !== "select" && column.getIsVisible())
                              .slice(0, 6) // Only show first 6 columns
                              .map(column => {
                                // Get the data key from the column id
                                const dataKey = column.id as keyof DataRow;
                                // Get the value from the row data
                                const value = rowData[dataKey];
                                // Fix the styling for specific title column
                                if (column.id === "Title") {
                                  return (
                                    <TableCell 
                                      key={column.id} 
                                      className="px-4 py-2 text-sm border-b border-gray-100 text-gray-800"
                                    >
                                      <div 
                                        className="px-2.5 py-1 rounded-md inline-block text-xs font-medium border bg-blue-50 text-blue-800 border-blue-200"
                                      >
                                        {value}
                                      </div>
                                    </TableCell>
                                  );
                                }
                                // Improve the display for the review dialog
                                return (
                                  <TableCell 
                                    key={column.id} 
                                    className="px-4 py-2 text-sm border-b border-gray-100 text-gray-800"
                                  >
                                    {typeof value === 'string' ? (
                                      (column.id === "Industry" || column.id === "Country" || column.id === "Technologies") ? (
                                        <div 
                                          className="px-2 py-0.5 rounded-md inline-block text-xs font-medium border bg-gray-50 text-gray-800 border-gray-200"
                                        >
                                          {value}
                                        </div>
                                      ) : (
                                        <span className="text-gray-800 font-medium">{value}</span>
                                      )
                                    ) : (
                                      <span className="text-gray-800">{String(value)}</span>
                                    )}
                                  </TableCell>
                                );
                              })}
                          </TableRow>
                        );
                      })}
                      {table.getSelectedRowModel().rows.length > 50 && (
                        <TableRow>
                          <TableCell 
                            colSpan={6}
                            className="px-4 py-2 text-center text-sm text-gray-500 italic"
                          >
                            ... and {table.getSelectedRowModel().rows.length - 50} more records
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="pt-4 border-t mt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      <strong>{table.getSelectedRowModel().rows.length}</strong> records selected
                      <span className="mx-2">•</span>
                      Will use <strong>{table.getSelectedRowModel().rows.length}</strong> credits
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setShowReviewSelected(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          setShowReviewSelected(false);
                          setShowExportConfirm(true);
                        }}
                        className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                      >
                        Proceed to Export
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

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
                  
                  {/* Export Format Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Export Format</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setExportFormat('xlsx')}
                        className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                          exportFormat === 'xlsx' 
                            ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        <span className="font-medium">Excel (XLSX)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExportFormat('csv')}
                        className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                          exportFormat === 'csv' 
                            ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <Download className="h-4 w-4" />
                        <span className="font-medium">CSV</span>
                      </button>
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
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                  >
                    {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
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
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
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
                    Your data has been exported successfully as {exportFormat.toUpperCase()}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="bg-green-50 border-green-200">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-800">Export Completed</AlertTitle>
                    <AlertDescription className="text-green-700">
                      The file has been downloaded to your computer. You can find it in your downloads folder as exported_data.{exportFormat}
                    </AlertDescription>
                  </Alert>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <div className="flex justify-between">
                      <span>Records Exported:</span>
                      <span className="font-medium">{table.getSelectedRowModel().rows.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Format:</span>
                      <span className="font-medium">{exportFormat.toUpperCase()}</span>
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
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
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
                  className="pl-9 py-2 h-10 bg-white border-gray-200 text-gray-800 placeholder:text-gray-400 focus-visible:ring-[#8370FC] focus-visible:ring-opacity-30 focus-visible:border-[#8370FC] rounded-md"
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
                          const essentialColumns = [];
                          
                          // Check what columns are available in the data
                          const hasColumn = (col: string) => table.getAllLeafColumns().some(column => column.id === col);
                          
                          // Prioritize these essential columns (limited to 5 core columns)
                          // 1. Person
                          if (hasColumn("Contact_Name")) essentialColumns.push("Contact_Name");
                          else if (hasColumn("First_Name")) essentialColumns.push("First_Name");
                          
                          // 2. Company
                          if (hasColumn("Company")) essentialColumns.push("Company");
                          else if (hasColumn("Account_name")) essentialColumns.push("Account_name");
                          
                          // 3. Role or Title
                          if (hasColumn("Designation")) essentialColumns.push("Designation");
                          else if (hasColumn("Title")) essentialColumns.push("Title");
                          
                          // 4. Email or Contact
                          if (hasColumn("Email_id")) essentialColumns.push("Email_id");
                          else if (hasColumn("Email")) essentialColumns.push("Email");
                          else if (hasColumn("Contact_Number_Personal")) essentialColumns.push("Contact_Number_Personal");
                          
                          // 5. Industry
                          if (hasColumn("Industry_client")) essentialColumns.push("Industry_client");
                          else if (hasColumn("Industry")) essentialColumns.push("Industry");
                          
                          const newVisibility: VisibilityState = {};
                          
                          // First hide all columns except select
                          table.getAllLeafColumns().forEach(column => {
                            if (column.id === "select") {
                              newVisibility[column.id] = true;
                            } else {
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
                          className="h-4 w-4 rounded border-gray-300 text-[#8370FC] focus:ring-[#8370FC]"
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
                onClick={handleReviewSelected}
                disabled={!userData || userData.dataFiles[selectedFileIndex]?.data.length === 0 || exporting}
              >
                <Download className="h-4 w-4" />
                Review & Export
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
          <Table className="select-none w-full bg-white relative">
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
                        "text-gray-100 font-medium bg-[#8370FC] px-4 py-3 first:rounded-tl-lg last:rounded-tr-lg border-b border-[#8370FC]/25 select-none text-sm",
                        header.id === "select" && "w-[40px] pr-0",
                        header.column.getIsPinned() && "sticky z-30 left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                        header.column.getIsPinned() && index > 0 && "left-[40px]",
                        header.column.getIsPinned() && index > 1 && "left-[calc(40px+200px)]",
                        header.column.getIsPinned() && index > 2 && "left-[calc(40px+400px)]",
                        !header.column.getIsPinned() && "relative z-10" // Lower z-index for unpinned columns
                      )}
                      style={{
                        left: header.column.getIsPinned() && index > 0 ? 
                          `${40 + (index - 1) * 180}px` : // Position pinned columns with proper spacing
                          header.column.getIsPinned() ? 0 : undefined
                      }}
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
                      "hover:bg-[#8370FC]/5 cursor-pointer bg-white select-none transition-colors",
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
                          row.getIsSelected() && "bg-[#8370FC]/5",
                          rowIndex === table.getRowModel().rows.length - 1 && cellIndex === 0 && "rounded-bl-lg",
                          rowIndex === table.getRowModel().rows.length - 1 && cellIndex === row.getVisibleCells().length - 1 && "rounded-br-lg",
                          cell.column.getIsPinned() && "sticky z-20 left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]",
                          cell.column.getIsPinned() && cellIndex > 0 && "left-[40px]",
                          cell.column.getIsPinned() && cellIndex > 1 && "left-[calc(40px+200px)]",
                          cell.column.getIsPinned() && cellIndex > 2 && "left-[calc(40px+400px)]",
                          !cell.column.getIsPinned() && "relative z-0" // Lower z-index for unpinned columns
                        )}
                        style={{ 
                          userSelect: 'none', 
                          WebkitUserSelect: 'none',
                          left: cell.column.getIsPinned() && cellIndex > 0 ? 
                            `${40 + (cellIndex - 1) * 180}px` : // Position pinned columns with proper spacing
                            cell.column.getIsPinned() ? 0 : undefined
                        }}
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

        <div className="flex flex-col gap-4 py-4 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <p className="text-sm font-medium text-gray-600">
                Rows per page
              </p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger className="h-9 w-[80px]">
                  <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Pagination>
              <PaginationContent className="gap-2">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => table.previousPage()} 
                    className={cn(
                      "h-9 px-3 bg-white border-gray-200 hover:bg-gray-50",
                      !table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""
                    )}
                  />
                </PaginationItem>
                
                {/* Generate page numbers */}
                {Array.from({ length: table.getPageCount() }).map((_, i) => {
                  // Show fewer pages when we have many pages
                  const showReducedPages = table.getPageCount() > 10;
                  // Show first page, last page, and pages around current page
                  if (
                    i === 0 || 
                    i === table.getPageCount() - 1 || 
                    (showReducedPages 
                      ? Math.abs(i - pageIndex) <= 1  // With many pages, only show immediate neighbors
                      : Math.abs(i - pageIndex) <= 2) // With fewer pages, show more neighbors
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          onClick={() => table.setPageIndex(i)}
                          isActive={pageIndex === i}
                          className={cn("h-9 w-9 font-medium", pageIndex === i && "bg-[#8370FC] text-white hover:bg-[#8370FC]/90")}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Add ellipsis if there's a gap (only add one ellipsis per gap)
                  if (
                    (i === 1 && pageIndex > 2) || 
                    (i === table.getPageCount() - 2 && pageIndex < table.getPageCount() - 3) ||
                    (i === pageIndex - 2 && i > 1 && showReducedPages) ||
                    (i === pageIndex + 2 && i < table.getPageCount() - 2 && showReducedPages)
                  ) {
                    return (
                      <PaginationItem key={i}>
                        <PaginationEllipsis className="h-9" />
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => table.nextPage()} 
                    className={cn(
                      "h-9 px-3 bg-white border-gray-200 hover:bg-gray-50",
                      !table.getCanNextPage() ? "pointer-events-none opacity-50" : ""
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="text-sm font-medium text-gray-600">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected
            </div>
          </div>
        </div>

        {/* Review Selected Dialog */}
        <Dialog open={showReviewSelected} onOpenChange={setShowReviewSelected}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col bg-white">
            <DialogHeader>
              <DialogTitle>Review Selected Records</DialogTitle>
              <DialogDescription>
                Review the {table.getSelectedRowModel().rows.length} records you've selected before exporting
              </DialogDescription>
            </DialogHeader>
            
            <div className="overflow-y-auto flex-grow mt-4 pr-2">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-none">
                    {table.getVisibleLeafColumns()
                      .filter(column => column.id !== "select" && column.getIsVisible())
                      .slice(0, 6) // Only show first 6 columns in the review
                      .map((column) => (
                        <TableHead 
                          key={column.id} 
                          className="bg-[#8370FC]/20 hover:bg-[#8370FC]/30 px-4 py-3 text-sm font-medium text-gray-100 border-b border-[#8370FC]/25"
                        >
                          {column.id.replace(/_/g, ' ')}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.getSelectedRowModel().rows.slice(0, 50).map((row: any, i: number) => {
                    const rowData = row.original;
                    return (
                      <TableRow 
                        key={i} 
                        className="bg-white hover:bg-blue-50/30"
                      >
                        {table.getVisibleLeafColumns()
                          .filter(column => column.id !== "select" && column.getIsVisible())
                          .slice(0, 6) // Only show first 6 columns
                          .map(column => {
                            // Get the data key from the column id
                            const dataKey = column.id as keyof DataRow;
                            // Get the value from the row data
                            const value = rowData[dataKey];
                            // Fix the styling for specific title column
                            if (column.id === "Title") {
                              return (
                                <TableCell 
                                  key={column.id} 
                                  className="px-4 py-2 text-sm border-b border-gray-100 text-gray-800"
                                >
                                  <div 
                                    className="px-2.5 py-1 rounded-md inline-block text-xs font-medium border bg-blue-50 text-blue-800 border-blue-200"
                                  >
                                    {value}
                                  </div>
                                </TableCell>
                              );
                            }
                            // Improve the display for the review dialog
                            return (
                              <TableCell 
                                key={column.id} 
                                className="px-4 py-2 text-sm border-b border-gray-100 text-gray-800"
                              >
                                {typeof value === 'string' ? (
                                  (column.id === "Industry" || column.id === "Country" || column.id === "Technologies") ? (
                                    <div 
                                      className="px-2 py-0.5 rounded-md inline-block text-xs font-medium border bg-gray-50 text-gray-800 border-gray-200"
                                    >
                                      {value}
                                    </div>
                                  ) : (
                                    <span className="text-gray-800 font-medium">{value}</span>
                                  )
                                ) : (
                                  <span className="text-gray-800">{String(value)}</span>
                                )}
                              </TableCell>
                            );
                          })}
                      </TableRow>
                    );
                  })}
                  {table.getSelectedRowModel().rows.length > 50 && (
                    <TableRow>
                      <TableCell 
                        colSpan={6}
                        className="px-4 py-2 text-center text-sm text-gray-500 italic"
                      >
                        ... and {table.getSelectedRowModel().rows.length - 50} more records
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="pt-4 border-t mt-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <strong>{table.getSelectedRowModel().rows.length}</strong> records selected
                  <span className="mx-2">•</span>
                  Will use <strong>{table.getSelectedRowModel().rows.length}</strong> credits
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowReviewSelected(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowReviewSelected(false);
                      setShowExportConfirm(true);
                    }}
                    className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
                  >
                    Proceed to Export
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
              
              {/* Export Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat('xlsx')}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                      exportFormat === 'xlsx' 
                        ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Excel (XLSX)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat('csv')}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-md ${
                      exportFormat === 'csv' 
                        ? 'border-[#8370FC] bg-[#8370FC]/10 text-[#8370FC]' 
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <Download className="h-4 w-4" />
                    <span className="font-medium">CSV</span>
                  </button>
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
                className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
              >
                {exporting ? 'Exporting...' : `Export as ${exportFormat.toUpperCase()}`}
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
                className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
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
                Your data has been exported successfully as {exportFormat.toUpperCase()}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Export Completed</AlertTitle>
                <AlertDescription className="text-green-700">
                  The file has been downloaded to your computer. You can find it in your downloads folder as exported_data.{exportFormat}
                </AlertDescription>
              </Alert>
              <div className="text-sm text-muted-foreground space-y-2">
                <div className="flex justify-between">
                  <span>Records Exported:</span>
                  <span className="font-medium">{table.getSelectedRowModel().rows.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Export Format:</span>
                  <span className="font-medium">{exportFormat.toUpperCase()}</span>
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
                className="bg-[#8370FC] text-white hover:bg-[#8370FC]/90"
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

