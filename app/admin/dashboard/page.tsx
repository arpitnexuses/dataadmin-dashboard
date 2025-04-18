import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserPlus, Activity, Settings, FileText, Clock, ChevronUp, ChevronDown } from "lucide-react"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Types } from "mongoose"
import { Suspense } from "react"

// Add revalidation configuration
export const revalidate = 0 // Disable caching for this page

// Loading component
function DashboardLoading() {
  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto bg-[#1C1C1C] min-h-screen">
      <div>
        <div className="h-8 w-64 bg-zinc-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-zinc-800 rounded mt-2 animate-pulse" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
              <div className="h-8 w-8 bg-zinc-800 rounded-full animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-32 bg-zinc-800 rounded mt-1 animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="h-6 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-48 bg-zinc-800 rounded mt-2 animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="flex items-center space-x-4">
                    <div className="h-4 w-4 bg-zinc-800 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface RecentFile {
  _id: string
  title: string
  createdAt: Date
}

interface RecentUser {
  _id: string
  email: string
  role: string
  createdAt: Date
}

interface LeanDataFile {
  _id: Types.ObjectId
  originalName: string
  createdAt: Date
}

interface DashboardData {
  totalUsers: number
  newUsers: number
  activeUsers: number
  totalFiles: number
  recentUsers: RecentUser[]
  recentFiles: RecentFile[]
}

async function getDashboardData(): Promise<DashboardData> {
  await connectToDatabase()
  
  const totalUsers = await User.countDocuments()
  const newUsers = await User.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
  })
  const activeUsers = await User.countDocuments({
    updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  })
  const totalFiles = await DataFile.countDocuments()
  
  const recentUsers = await User.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('email createdAt role')
    .lean()
    
  const recentFiles = await DataFile.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('originalName createdAt')
    .lean() as unknown as LeanDataFile[]
    
  return {
    totalUsers,
    newUsers,
    activeUsers,
    totalFiles,
    recentUsers: recentUsers.map(user => ({
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    })),
    recentFiles: recentFiles.map(file => ({
      _id: file._id.toString(),
      title: file.originalName,
      createdAt: file.createdAt
    }))
  }
}

async function DashboardContent() {
  const data = await getDashboardData()

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard Overview</h1>
        <p className="text-zinc-400 mt-2">
          Welcome to your admin dashboard. Monitor system activity and manage users.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-zinc-900 border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-700/30 to-zinc-600/20" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <div className="rounded-full bg-zinc-800/50 p-2.5">
              <Users className="h-4 w-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-white">
              {data.totalUsers}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Registered users in the system</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-zinc-900 border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-700/30 to-zinc-600/20" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">New Users (30d)</CardTitle>
            <div className="rounded-full bg-zinc-800/50 p-2.5">
              <UserPlus className="h-4 w-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-white">
              {data.newUsers}
            </div>
            <p className="text-xs text-zinc-400 mt-1">New users in the last 30 days</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-zinc-900 border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-700/30 to-zinc-600/20" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Users (7d)</CardTitle>
            <div className="rounded-full bg-zinc-800/50 p-2.5">
              <Activity className="h-4 w-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-white">
              {data.activeUsers}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Active users in the last 7 days</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 bg-zinc-900 border-zinc-800">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 via-zinc-700/30 to-zinc-600/20" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Files</CardTitle>
            <div className="rounded-full bg-zinc-800/50 p-2.5">
              <FileText className="h-4 w-4 text-zinc-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight text-white">
              {data.totalFiles}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Total files uploaded to the system</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-[#1C1C1C] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Users</CardTitle>
            <CardDescription className="text-zinc-400">
              Latest users who joined the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                    <TableHead className="text-zinc-400">User</TableHead>
                    <TableHead className="text-zinc-400">Role</TableHead>
                    <TableHead className="text-zinc-400">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentUsers.map((user) => (
                    <TableRow key={user._id} className="border-zinc-800 hover:bg-zinc-900">
                      <TableCell className="font-medium text-white">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
        <Card className="bg-[#1C1C1C] border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Files</CardTitle>
            <CardDescription className="text-zinc-400">
              Latest files uploaded to the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] pr-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800 hover:bg-zinc-900">
                    <TableHead className="text-zinc-400">File Name</TableHead>
                    <TableHead className="text-zinc-400">Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentFiles.map((file) => (
                    <TableRow key={file._id} className="border-zinc-800 hover:bg-zinc-900">
                      <TableCell className="font-medium text-white">{file.title}</TableCell>
                      <TableCell className="text-zinc-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}

