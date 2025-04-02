"use client"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, MoreHorizontal, Upload } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AddFileForm } from "./add-file-form"
import Image from "next/image"

interface User {
  _id: string
  email: string
  role: string
  title?: string
  logoUrl?: string
  createdAt: string
  updatedAt: string
  dataFiles: Array<{
    fileId: string
    title: string
    filename: string
  }>
}

export interface UserListRef {
  refreshUsers: () => void
}

export const UserList = forwardRef<UserListRef>((props, ref) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Expose the refresh function through the ref
  useImperativeHandle(ref, () => ({
    refreshUsers: fetchUsers
  }))

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId))
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const handleDeleteFile = async (userId: string, fileId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/file?fileId=${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.map((user) => {
            if (user._id === userId) {
              return {
                ...user,
                dataFiles: user.dataFiles.filter((file) => file.fileId !== fileId),
              }
            }
            return user
          })
        )
      }
    } catch (error) {
      console.error("Error deleting file:", error)
    }
  }

  const handleAddFileSuccess = () => {
    // Refresh the users list to show the new file
    fetchUsers()
  }

  const columns: ColumnDef<User>[] = [
    {
      id: "logo",
      header: "",
      cell: ({ row }) => {
        const logoUrl = row.original.logoUrl
        return (
          <div className="flex items-center justify-center">
            {logoUrl ? (
              <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-gray-200">
                <Image
                  src={logoUrl}
                  alt={`${row.original.email} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                <span className="text-gray-500 text-sm font-medium">
                  {row.original.email.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "email",
      header: ({ column }: { column: Column<User> }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="-ml-3 h-8 data-[state=open]:bg-accent">
                <span>Email</span>
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
                <input
                  type="text"
                  value={(column.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    column.setFilterValue(event.target.value)
                  }
                  placeholder="Filter emails..."
                  className="w-full border-0 bg-transparent py-1.5 text-sm leading-none placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.getValue("role") === "admin" ? "destructive" : "secondary"}>
          {row.getValue("role")}
        </Badge>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => row.getValue("title") || "-",
    },
    {
      accessorKey: "dataFiles",
      header: "Files",
      cell: ({ row }) => {
        const files = row.getValue("dataFiles") as Array<{ fileId: string; title: string; filename: string }>
        return (
          <div className="flex flex-col gap-1">
            {files.map((file) => (
              <div key={file.fileId} className="flex items-center gap-2">
                <span className="text-sm">{file.filename}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  onClick={() => handleDeleteFile(row.original._id, file.fileId)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </Button>
              </div>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.getValue("createdAt")).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedUserId(user._id)}>
                <Upload className="mr-2 h-4 w-4" />
                Add File
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteUser(user._id)}
                className="text-red-600 focus:text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <ScrollArea className="h-[calc(100vh-16rem)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: HeaderGroup<User>) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
              table.getRowModel().rows.map((row: Row<User>) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell: Cell<User, unknown>) => (
                    <TableCell key={cell.id}>
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
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </ScrollArea>

      <Dialog open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New File</DialogTitle>
          </DialogHeader>
          {selectedUserId && (
            <AddFileForm userId={selectedUserId} onSuccess={handleAddFileSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
})

