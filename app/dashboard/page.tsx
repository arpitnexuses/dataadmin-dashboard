"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileQuestion, Database, Mail, Phone, CreditCard, FolderOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "@/components/ui/charts"
import { PieChart, Pie, Cell, Legend } from "@/components/ui/charts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface UserData {
  totalFiles: number
  requestCount: number
  totalRecords: number
  totalEmails: number
  totalPhones: number
  fileAnalytics: {
    industries: { name: string; value: number }[]
    countries: { name: string; value: number }[]
    technologies: { name: string; value: number }[]
    employeeSize: { name: string; value: number }[]
    revenueSize: { name: string; value: number }[]
    downloadsByMonth: { name: string; total: number }[]
    titleDistribution: { name: string; count: number }[]
  }
  credits: number
}

const COLORS = ['#BFAAFF', '#8370FC', '#A3A1FB', '#C3B1E1', '#B5A7F7', '#BFAAFF', '#8370FC', '#A3A1FB']
const COUNTRY_COLORS = ['#BFAAFF', '#8370FC', '#A3A1FB', '#C3B1E1', '#B5A7F7', '#BFAAFF', '#8370FC', '#A3A1FB']
const TECH_COLORS = ['#00B8A9', '#F8F3D4', '#F6416C', '#FFDE7D', '#7868E6', '#B8F2E6']

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllTitles, setShowAllTitles] = useState(false)
  const [showAllIndustries, setShowAllIndustries] = useState(false)
  const [showAllCountries, setShowAllCountries] = useState(false)
  const [showAllTechnologies, setShowAllTechnologies] = useState(false)

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/data")
      if (response.ok) {
        const data = await response.json()
        
        // Process data for analytics
        const titleCounts: { [key: string]: number } = {}
        const industryCounts: { [key: string]: number } = {}
        const countryCounts: { [key: string]: number } = {}
        const technologyCounts: { [key: string]: number } = {}
        const employeeSizeCounts: { [key: string]: number } = {}
        const revenueCounts: { [key: string]: number } = {}
        let totalEmails = 0
        let totalPhones = 0

        data.dataFiles?.forEach((file: any) => {
          file.data?.forEach((record: any) => {
            // Count emails
            if (record.Email || record.Email_id) {
              totalEmails++
            }
            
            // Count phone numbers
            if (record.Personal_Phone || record.Contact_Number_Personal) {
              totalPhones++
            }

            // Process titles
            const title = record.Title || record.Designation || "Other"
            titleCounts[title] = (titleCounts[title] || 0) + 1

            // Process industries
            const industry = record.Industry || record.Industry_client || record.Industry_Nexuses || "Other"
            industryCounts[industry] = (industryCounts[industry] || 0) + 1

            // Process countries
            const country = record.Country || record.Country_Contact_Person || "Other"
            countryCounts[country] = (countryCounts[country] || 0) + 1

            // Process technologies
            const technologies = record.Technologies || ""
            if (typeof technologies === 'string' && technologies.trim()) {
              technologies.split(',').map(tech => tech.trim()).filter(tech => tech).forEach(tech => {
                technologyCounts[tech] = (technologyCounts[tech] || 0) + 1
              })
            }

            // Process employee size
            const employeeSize = record.No_of_Employees || record.Employees_Size
            if (employeeSize) {
              let sizeRange = "Other"
              const size = parseInt(employeeSize)
              if (!isNaN(size)) {
                if (size < 100) sizeRange = "< 100"
                else if (size <= 500) sizeRange = "100 - 500"
                else sizeRange = "500+"
              }
              employeeSizeCounts[sizeRange] = (employeeSizeCounts[sizeRange] || 0) + 1
            }

            // Process revenue
            const revenue = record.Revenue || record.Annual_Revenue
            if (revenue) {
              let revenueRange = "Other"
              const rev = parseFloat(revenue.replace(/[^0-9.]/g, ''))
              if (!isNaN(rev)) {
                if (rev < 1000000) revenueRange = "< $1M"
                else if (rev <= 50000000) revenueRange = "$1M - $50M"
                else revenueRange = "> $50M"
              }
              revenueCounts[revenueRange] = (revenueCounts[revenueRange] || 0) + 1
            }
          })
        })

        // Convert counts to arrays and sort
        const titleDistribution = Object.entries(titleCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        const industries = Object.entries(industryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const countries = Object.entries(countryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const technologies = Object.entries(technologyCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const employeeSize = Object.entries(employeeSizeCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const revenueSize = Object.entries(revenueCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const totalRecords = data.dataFiles?.reduce((acc: number, file: any) => {
          return acc + (file.data?.length || 0)
        }, 0) || 0

        setUserData({
          totalFiles: data.dataFiles?.length || 0,
          requestCount: data.requestCount || 0,
          totalRecords: totalRecords,
          totalEmails: totalEmails,
          totalPhones: totalPhones,
          fileAnalytics: {
            industries: industries,
            countries: countries,
            technologies: technologies,
            employeeSize: employeeSize,
            revenueSize: revenueSize,
            downloadsByMonth: [
              { name: "Jan", total: 45 },
              { name: "Feb", total: 38 },
              { name: "Mar", total: 52 },
              { name: "Apr", total: 41 },
              { name: "May", total: 47 },
              { name: "Jun", total: 35 }
            ],
            titleDistribution: titleDistribution
          },
          credits: data.credits || 0
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()

    // Set up an interval to refresh data every 30 seconds
    const interval = setInterval(fetchUserData, 30000)

    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Top Cards Loading State */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-7 w-16 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Loading State */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Title and Revenue Distribution Loading */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="h-5 w-40 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] bg-muted/10 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Industry and Country Distribution Loading */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="h-5 w-40 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] bg-muted/10 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Technology and Employee Size Distribution Loading */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="h-5 w-40 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] bg-muted/10 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Function to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Function to get top 6 titles
  const getTop6Titles = () => {
    return userData?.fileAnalytics.titleDistribution.slice(0, 6) || []
  }

  // Function to get top 8 industries
  const getTop8Industries = () => {
    return userData?.fileAnalytics.industries.slice(0, 8) || []
  }

  // Function to get top 8 countries
  const getTop8Countries = () => {
    return userData?.fileAnalytics.countries?.slice(0, 8) || []
  }

  // Function to get top 6 technologies
  const getTop6Technologies = () => {
    return userData?.fileAnalytics.technologies?.slice(0, 6) || []
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>
      
      {/* Top Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <div className="bg-green-100 p-3 rounded-full">
              <FolderOpen className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{userData?.totalFiles || 0}</div>
            <p className="text-xs text-gray-500">Files in your database</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <div className="bg-purple-100 p-3 rounded-full">
              <Database className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{formatNumber(userData?.totalRecords || 0)}</div>
            <p className="text-xs text-gray-500">Total records across all files</p>
          </CardContent>
        </Card>
        <Card className="bg-[#8370FC] text-white relative overflow-hidden rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          {/* Shining Animation */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
          </div>
          
          {/* Ribbon Element */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8370FC]/20 transform rotate-45 translate-x-12 -translate-y-12"></div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#8370FC]/10 transform rotate-45 translate-x-8 -translate-y-8"></div>
          
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-white">Available Credits</CardTitle>
            <div className="bg-white/20 p-3 rounded-full">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{userData?.credits || 0}</div>
            <p className="text-xs text-white/80">Credits available for use</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Emails</CardTitle>
            <div className="bg-orange-100 p-3 rounded-full">
              <Mail className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{formatNumber(userData?.totalEmails || 0)}</div>
            <p className="text-xs text-gray-500">Total email addresses in database</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Phone Numbers</CardTitle>
            <div className="bg-pink-100 p-3 rounded-full">
              <Phone className="h-4 w-4 text-pink-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{formatNumber(userData?.totalPhones || 0)}</div>
            <p className="text-xs text-gray-500">Total phone numbers in database</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Requests</CardTitle>
            <div className="bg-indigo-100 p-3 rounded-full">
              <FileQuestion className="h-4 w-4 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{userData?.requestCount || 0}</div>
            <p className="text-xs text-gray-500">Total data requests made</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Title and Revenue Distribution */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {/* Title Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Title Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getTop6Titles()}
                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                    onClick={() => setShowAllTitles(true)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      interval={0}
                      height={60}
                      tick={({ x, y, payload }) => {
                        const label = payload.value.length > 10 ? payload.value.slice(0, 10) + '...' : payload.value;
                        return (
                          <g transform={`translate(${x},${y + 10}) rotate(-45)`}>
                            <text textAnchor="end" fontSize={12} fill="#888">{label}</text>
                          </g>
                        );
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Count: ${value}`, 'Total']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#8370FC"
                      radius={[999, 999, 0, 0]}
                      cursor="pointer"
                    >
                      {getTop6Titles().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#8370FC"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={userData?.fileAnalytics.revenueSize}
                    margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#BFAAFF"
                      radius={[4, 4, 0, 0]}
                    >
                      {userData?.fileAnalytics.revenueSize.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#BFAAFF"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Industry and Country Distribution */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {/* Industry Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Industry Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart onClick={() => setShowAllIndustries(true)}>
                    <Pie
                      data={getTop8Industries()}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={120}
                      paddingAngle={2}
                      cornerRadius={8}
                      dataKey="value"
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fill: '#888888',
                              color: '#888888',
                              fontSize: 14,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 0.5,
                            }}
                          >
                            <tspan x={x} dy="-0.5em">{getTop8Industries()[index]?.name}</tspan>
                            <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
                          </text>
                        );
                      }}
                    >
                      {getTop8Industries().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Country Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart onClick={() => setShowAllCountries(true)}>
                    <Pie
                      data={getTop8Countries()}
                      cx="50%"
                      cy="50%"
                      innerRadius={90}
                      outerRadius={120}
                      paddingAngle={2}
                      cornerRadius={8}
                      dataKey="value"
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                      }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fill: '#888888',
                              color: '#888888',
                              fontSize: 14,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 0.5,
                            }}
                          >
                            <tspan x={x} dy="-0.5em">{getTop8Countries()[index]?.name}</tspan>
                            <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
                          </text>
                        );
                      }}
                    >
                      {getTop8Countries().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Industries Modal */}
        <Dialog open={showAllIndustries} onOpenChange={setShowAllIndustries}>
          <DialogContent className="max-w-[90vw] w-[800px] h-[80vh]">
            <DialogHeader>
              <DialogTitle>All Industries Distribution</DialogTitle>
            </DialogHeader>
            <div className="h-[calc(80vh-100px)] overflow-auto">
              <ResponsiveContainer width="100%" height={Math.max(600, (userData?.fileAnalytics.industries.length || 0) * 40)}>
                <BarChart 
                  data={userData?.fileAnalytics.industries}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 90, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    width={110}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`Count: ${value}`, 'Total']}
                    labelStyle={{ color: 'black' }}
                  />
                  <Bar
                    dataKey="value"
                    fill="#4ECDC4"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DialogContent>
        </Dialog>

        {/* All Countries Modal */}
        <Dialog open={showAllCountries} onOpenChange={setShowAllCountries}>
          <DialogContent className="max-w-[90vw] w-[800px] h-[80vh]">
            <DialogHeader>
              <DialogTitle>All Countries Distribution</DialogTitle>
            </DialogHeader>
            <div className="h-[calc(80vh-100px)] overflow-auto">
              <ResponsiveContainer width="100%" height={Math.max(600, (userData?.fileAnalytics.countries.length || 0) * 40)}>
                <BarChart 
                  data={userData?.fileAnalytics.countries}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 90, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    width={170}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`Count: ${value}`, 'Total']}
                    labelStyle={{ color: 'black' }}
                  />
                  <Bar
                    dataKey="value"
                    fill={COUNTRY_COLORS[0]}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DialogContent>
        </Dialog>

        {/* Technology and Employee Size Distribution */}
        <div className="col-span-2 grid grid-cols-2 gap-4">
          {/* Technology Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Technology Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getTop6Technologies()}
                    margin={{ top: 20, right: 30, left: 50, bottom: 60 }}
                    onClick={() => setShowAllTechnologies(true)}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Count: ${value}`, 'Total']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#8370FC"
                      radius={[999, 999, 0, 0]}
                      cursor="pointer"
                    >
                      {getTop6Technologies().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#8370FC"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Employee Size Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Size Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={userData?.fileAnalytics.employeeSize}
                    margin={{ top: 20, right: 30, left: 50, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#BFAAFF"
                      radius={[4, 4, 0, 0]}
                    >
                      {userData?.fileAnalytics.employeeSize.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="#BFAAFF"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Technologies Modal */}
        <Dialog open={showAllTechnologies} onOpenChange={setShowAllTechnologies}>
          <DialogContent className="max-w-[90vw] w-[800px] h-[80vh]">
            <DialogHeader>
              <DialogTitle>All Technologies Distribution</DialogTitle>
            </DialogHeader>
            <div className="h-[calc(80vh-100px)] overflow-auto">
              <ResponsiveContainer width="100%" height={Math.max(600, (userData?.fileAnalytics.technologies.length || 0) * 40)}>
                <BarChart 
                  data={userData?.fileAnalytics.technologies}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 180, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    width={170}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`Count: ${value}`, 'Total']}
                    labelStyle={{ color: 'black' }}
                  />
                  <Bar
                    dataKey="value"
                    fill={TECH_COLORS[0]}
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DialogContent>
        </Dialog>

        {/* All Titles Modal */}
        <Dialog open={showAllTitles} onOpenChange={setShowAllTitles}>
          <DialogContent className="max-w-[90vw] w-[800px] h-[80vh]">
            <DialogHeader>
              <DialogTitle>All Titles Distribution</DialogTitle>
            </DialogHeader>
            <div className="h-[calc(80vh-100px)] overflow-auto">
              <ResponsiveContainer width="100%" height={Math.max(600, (userData?.fileAnalytics.titleDistribution.length || 0) * 40)}>
                <BarChart 
                  data={userData?.fileAnalytics.titleDistribution}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    width={170}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`Count: ${value}`, 'Total']}
                    labelStyle={{ color: 'black' }}
                  />
                  <Bar
                    dataKey="count"
                    fill={COLORS[0]}
                    radius={[0, 4, 4, 0]}
                  >
                    {userData?.fileAnalytics.titleDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

// Add this at the end of the file, before the last closing brace
const shineAnimation = `
  @keyframes shine {
    0% {
      transform: translateX(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) rotate(45deg);
    }
  }

  .animate-shine {
    animation: shine 2s infinite;
  }
`

// Add the animation styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shineAnimation
  document.head.appendChild(style)
}

