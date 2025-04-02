"use client"

import { useEffect, useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Download } from "lucide-react"
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
}

export function DataTable({ selectedFileIndex }: DataTableProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/data")
        if (response.ok) {
          const data = await response.json()
          console.log("Fetched data:", data)
          setUserData(data)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
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
    
    console.log("Creating columns from data:", userData.dataFiles[selectedFileIndex].data[0])
    
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
    ].map(columnKey => ({
      accessorKey: columnKey,
      header: ({ column }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
                <span>{columnKey.replace(/_/g, ' ')}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Sort</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                Desc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <div className="p-2">
                <Input
                  placeholder={`Filter ${columnKey.replace(/_/g, ' ')}...`}
                  value={(column.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    column.setFilterValue(event.target.value)
                  }
                  className="h-8 w-full"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    }))

    return [...defaultColumns, ...dataColumns]
  }, [userData, selectedFileIndex])

  const table = useReactTable({
    data: userData?.dataFiles[selectedFileIndex]?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      rowSelection,
      globalFilter,
    },
  })

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(selectedFile.data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')
    XLSX.writeFile(wb, `${selectedFile.title}.xlsx`)
  }

  return (
    <Card className="border-none shadow-none w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in all columns..."
                value={globalFilter ?? ""}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-8 focus-visible:ring-black focus-visible:ring-1 focus-visible:ring-offset-0"
              />
            </div>
          </div>
          <Button
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            className="ml-auto flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto max-h-[calc(100vh-24rem)]">
            <Table className="border border-gray-300 w-full">
              <TableHeader className="bg-black sticky top-0 rounded-t-lg">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-black rounded-t-lg">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-white border-gray-300 whitespace-nowrap first:rounded-tl-lg last:rounded-tr-lg">
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
                      className="hover:bg-muted/50 transition-colors border-gray-300"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border-gray-300 whitespace-nowrap">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

