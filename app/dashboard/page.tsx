"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileQuestion, Database } from "lucide-react"
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

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FFD93D', '#6C5B7B', '#355C7D']
const COUNTRY_COLORS = ['#845EC2', '#D65DB1', '#FF6F91', '#FF9671', '#FFC75F', '#F9F871', '#008F7A', '#2C73D2']
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
        
        // Process titles
        const titleCounts: { [key: string]: number } = {}
        const industryCounts: { [key: string]: number } = {}
        const countryCounts: { [key: string]: number } = {}
        const technologyCounts: { [key: string]: number } = {}

        // Title abbreviation mapping
        const titleAbbreviations: { [key: string]: string } = {
          "Chief Technology Officer": "CTO",
          "Chief Information Officer": "CIO",
          "Chief Information Security Officer": "CISO",
          "Chief Technical Officer": "CTO",
          "Director of Information Technology": "IT Director",
          "Information Technology Manager": "IT Manager",
          "Information Technology Director": "IT Director",
          "Vice President Information Technology": "VP of IT",
          "Information Technology Project Manager": "IT Project Manager",
        }

        data.dataFiles?.forEach((file: any) => {
          file.data?.forEach((record: any) => {
            // Process titles with abbreviations
            let title = record.title || record.Title || record.TITLE || "Other"
            title = titleAbbreviations[title] || title
            titleCounts[title] = (titleCounts[title] || 0) + 1

            // Process industries
            const industry = record.industry || record.Industry || record.INDUSTRY || "Other"
            industryCounts[industry] = (industryCounts[industry] || 0) + 1

            // Process countries
            const country = record.country || record.Country || record.COUNTRY || "Other"
            countryCounts[country] = (countryCounts[country] || 0) + 1

            // Process technologies - split and count individual technologies
            const technology = record.technologies || record.Technologies || record.TECHNOLOGIES || ""
            if (typeof technology === 'string' && technology.trim()) {
              // Split by comma and clean up each technology
              const individualTechs = technology.split(',').map(tech => tech.trim()).filter(tech => tech)
              individualTechs.forEach(tech => {
                technologyCounts[tech] = (technologyCounts[tech] || 0) + 1
              })
            }
          })
        })

        // Convert title counts to array and sort
        const titleDistribution = Object.entries(titleCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        // Convert industry counts to array and sort
        const industries = Object.entries(industryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        // Convert country counts to array and sort
        const countries = Object.entries(countryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        // Convert technology counts to array and sort
        const technologies = Object.entries(technologyCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const totalRecords = data.dataFiles?.reduce((acc: number, file: any) => {
          return acc + (file.data?.length || 0)
        }, 0) || 0

        setUserData({
          totalFiles: data.dataFiles?.length || 0,
          requestCount: data.requestCount || 0,
          totalRecords: totalRecords,
          fileAnalytics: {
            industries: industries,
            countries: countries,
            technologies: technologies,
            employeeSize: [
              { name: "1-50", value: 85 },
              { name: "51-200", value: 23 },
              { name: "201-500", value: 18 },
              { name: "501-1000", value: 14 },
              { name: "1001-5000", value: 19 },
              { name: "5000+", value: 35 }
            ],
            revenueSize: [
              { name: "< $1M", value: 65 },
              { name: "$1M - $10M", value: 45 },
              { name: "$10M - $50M", value: 38 },
              { name: "$50M - $100M", value: 24 },
              { name: "$100M - $500M", value: 29 },
              { name: "> $500M", value: 15 }
            ],
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Files Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Files</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-800">{formatNumber(userData?.totalFiles || 0)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Files uploaded to your account</p>
          </div>
        </div>

        {/* Total Records Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Records</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-800">{formatNumber(userData?.totalRecords || 0)}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Total data records across all files</p>
          </div>
        </div>

        {/* Request Count Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Request Count</p>
              <h3 className="text-3xl font-bold mt-1 text-gray-800">{userData?.requestCount || 0}</h3>
            </div>
            <div className="bg-orange-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-500">Total number of requests made</p>
          </div>
        </div>

        {/* Credits Card - More Prominent */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">Available Credits</p>
              <h3 className="text-3xl font-bold mt-1">{formatNumber(userData?.credits || 0)}</h3>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-blue-100">Credits remaining for data exports</p>
          </div>
        </div>
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
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    onClick={() => setShowAllTitles(true)}
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
                      formatter={(value: number) => [`Count: ${value}`, 'Total']}
                      labelStyle={{ color: 'black' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#4ECDC4"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {getTop6Titles().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
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
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
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
                      radius={[4, 4, 0, 0]}
                    >
                      {userData?.fileAnalytics.revenueSize.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
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
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
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
                            fill="#888"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            className="text-xs"
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
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
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
                            fill="#888"
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            className="text-xs"
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
                      fill={TECH_COLORS[0]}
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                    >
                      {getTop6Technologies().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={TECH_COLORS[index % TECH_COLORS.length]}
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
                      radius={[4, 4, 0, 0]}
                    >
                      {userData?.fileAnalytics.employeeSize.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={TECH_COLORS[index % TECH_COLORS.length]}
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

