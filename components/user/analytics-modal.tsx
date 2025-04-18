"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, PieChart, LineChart, Users, Building2, Globe, Code, Briefcase, DollarSign, X } from "lucide-react"
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar
} from 'recharts'

interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  data: any[]
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF8C42', '#D4A5A5',
  '#9B59B6', '#3498DB', '#1ABC9C', '#F1C40F', '#E67E22', '#E74C3C'
];

const PIE_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FF8C42', '#D4A5A5',
  '#9B59B6', '#3498DB', '#1ABC9C', '#F1C40F', '#E67E22', '#E74C3C'
].map(color => ({
  color,
  gradient: `linear-gradient(45deg, ${color}, ${color}80)`
}));

export function AnalyticsModal({ isOpen, onClose, data }: AnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  const handleCardClick = (cardType: string) => {
    setSelectedCard(cardType)
  }

  const handleCloseFullView = () => {
    setSelectedCard(null)
  }

  const renderFullView = () => {
    if (!selectedCard || !analytics) return null

    const getCardData = () => {
      switch (selectedCard) {
        case 'title':
          return {
            title: 'Title Distribution',
            icon: <Briefcase className="h-5 w-5 text-[#FF6B6B]" />,
            data: analytics.title.topTitles,
            color: '#FF6B6B',
            type: 'bar'
          }
        case 'industry':
          return {
            title: 'Industry Distribution',
            icon: <Building2 className="h-5 w-5 text-[#4ECDC4]" />,
            data: analytics.industry.topIndustries,
            color: '#4ECDC4',
            type: 'pie'
          }
        case 'technologies':
          return {
            title: 'Technologies Distribution',
            icon: <Code className="h-5 w-5 text-[#45B7D1]" />,
            data: analytics.technologies.allTechnologies,
            color: '#45B7D1',
            type: 'bar'
          }
        case 'employee':
          return {
            title: 'Employee Size Distribution',
            icon: <Users className="h-5 w-5 text-[#96CEB4]" />,
            data: analytics.employeeSize.ranges,
            color: '#96CEB4',
            type: 'bar'
          }
        case 'revenue':
          return {
            title: 'Revenue Range Distribution',
            icon: <DollarSign className="h-5 w-5 text-[#FF8C42]" />,
            data: analytics.annualRevenue.ranges,
            color: '#FF8C42',
            type: 'bar'
          }
        case 'country':
          return {
            title: 'Top Countries',
            icon: <Globe className="h-5 w-5 text-[#9B59B6]" />,
            data: analytics.country.topCountries,
            color: '#9B59B6',
            type: 'pie'
          }
        default:
          return null
      }
    }

    const cardData = getCardData()
    if (!cardData) return null

    return (
      <Dialog open={!!selectedCard} onOpenChange={handleCloseFullView}>
        <DialogContent className="max-w-[95vw] h-[90vh] bg-white border border-gray-200 shadow-xl overflow-hidden">
          <DialogHeader className="relative">
            <div className="flex items-center gap-2">
              {cardData.icon}
              <DialogTitle className="text-3xl font-bold text-gray-800">
                {cardData.title}
              </DialogTitle>
            </div>
            {/* <button
              onClick={handleCloseFullView}
              className="absolute right-0 top-0 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button> */}
          </DialogHeader>
          
          <div className="h-[calc(90vh-100px)] overflow-y-auto pr-2">
            <Card className="bg-white border border-gray-200 h-full shadow-sm">
              <CardContent className="h-full p-6">
                {cardData.data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {cardData.type === 'bar' ? (
                      <RechartsBarChart data={cardData.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke="#666" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="value" 
                          fill={cardData.color} 
                          radius={[6, 6, 0, 0]} 
                        />
                      </RechartsBarChart>
                    ) : (
                      <RechartsPieChart>
                        <Pie
                          data={cardData.data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {cardData.data.map((entry: any, index: number) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={PIE_COLORS[index % PIE_COLORS.length].color}
                              style={{
                                filter: `drop-shadow(0 0 8px ${PIE_COLORS[index % PIE_COLORS.length].color}80)`
                              }}
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RechartsPieChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const calculateDistribution = (data: any[], field: string) => {
    const distribution: Record<string, number> = {}
    data.forEach(item => {
      const value = item[field]
      if (value) {
        distribution[value] = (distribution[value] || 0) + 1
      }
    })
    return distribution
  }

  const getTopItems = (data: any[], field: string, count: number) => {
    const distribution = calculateDistribution(data, field)
    return Object.entries(distribution)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([name, value]) => ({ name, value }))
  }

  const getRevenueRanges = (data: any[]) => {
    const ranges = [
      { name: '< $1M', min: 0, max: 1000000 },
      { name: '$1M - $10M', min: 1000000, max: 10000000 },
      { name: '$10M - $50M', min: 10000000, max: 50000000 },
      { name: '$50M - $100M', min: 50000000, max: 100000000 },
      { name: '$100M - $500M', min: 100000000, max: 500000000 },
      { name: '> $500M', min: 500000000, max: Infinity }
    ]

    return ranges.map(range => ({
      name: range.name,
      value: data.filter(item => {
        const revenue = parseFloat(item.Annual_Revenue?.replace(/[^0-9.]/g, '') || '0')
        return revenue >= range.min && revenue < range.max
      }).length
    }))
  }

  const getEmployeeSizeRanges = (data: any[]) => {
    const ranges = [
      { name: '1-10', min: 1, max: 10 },
      { name: '11-50', min: 11, max: 50 },
      { name: '51-200', min: 51, max: 200 },
      { name: '201-500', min: 201, max: 500 },
      { name: '501-1000', min: 501, max: 1000 },
      { name: '1001-5000', min: 1001, max: 5000 },
      { name: '> 5000', min: 5001, max: Infinity }
    ]

    return ranges.map(range => ({
      name: range.name,
      value: data.filter(item => {
        const size = parseInt(item.Employees_Size?.replace(/[^0-9]/g, '') || '0')
        return size >= range.min && size < range.max
      }).length
    }))
  }

  const getAllTechnologies = (data: any[]) => {
    const techCount: Record<string, number> = {}
    data.forEach(item => {
      const techs = item.Technologies?.split(',').map((t: string) => t.trim()) || []
      techs.forEach((tech: string) => {
        if (tech) {
          techCount[tech] = (techCount[tech] || 0) + 1
        }
      })
    })
    return Object.entries(techCount)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value }))
  }

  const calculateAverage = (data: any[], field: string) => {
    const values = data
      .map(item => {
        const value = item[field]
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
          const num = parseFloat(value.replace(/[^0-9.]/g, ''))
          return isNaN(num) ? 0 : num
        }
        return 0
      })
      .filter(value => value > 0)
    
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0 && payload[0]?.value !== undefined) {
      return (
        <div className="bg-[#1C1C1C]/90 border border-cyan-500/30 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
          <p className="text-cyan-400 font-medium">{label}</p>
          <p className="text-white font-bold">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (data && data.length > 0) {
      const analyticsData = {
        title: {
          distribution: calculateDistribution(data, "Title"),
          topTitles: getTopItems(data, "Title", 5)
        },
        industry: {
          distribution: calculateDistribution(data, "Industry"),
          topIndustries: getTopItems(data, "Industry", 5)
        },
        technologies: {
          allTechnologies: getAllTechnologies(data),
          topTechnologies: getTopItems(data, "Technologies", 10)
        },
        employeeSize: {
          ranges: getEmployeeSizeRanges(data),
          average: calculateAverage(data, "Employees_Size")
        },
        annualRevenue: {
          ranges: getRevenueRanges(data),
          average: calculateAverage(data, "Annual_Revenue")
        },
        country: {
          distribution: calculateDistribution(data, "Country"),
          topCountries: getTopItems(data, "Country", 5)
        }
      }
      setAnalytics(analyticsData)
    }
  }, [data])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl h-[90vh] bg-white border border-gray-200 shadow-xl overflow-hidden">
          <DialogHeader className="relative">
            <DialogTitle className="text-3xl font-bold text-gray-800">
              Data Analytics Dashboard
            </DialogTitle>
            {/* <button
              onClick={onClose}
              className="absolute right-0 top-0 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button> */}
          </DialogHeader>
          
          <div className="h-[calc(90vh-100px)] overflow-y-auto pr-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pb-6">
              {/* Title Analytics */}
              <div
                onClick={() => handleCardClick('title')}
                className="cursor-pointer"
              >
                <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 h-[400px] shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-[#FF6B6B]" />
                      <CardTitle className="text-lg font-semibold text-gray-800">Title Distribution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)]">
                    {analytics?.title.topTitles ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={analytics?.title.topTitles}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="value" 
                            fill="#FF6B6B" 
                            radius={[6, 6, 0, 0]} 
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#FF6B6B]/20" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Industry Analytics */}
              <div
                onClick={() => handleCardClick('industry')}
                className="cursor-pointer"
              >
                <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 h-[400px] shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#4ECDC4]" />
                      <CardTitle className="text-lg font-semibold text-gray-800">Industry Distribution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)]">
                    {analytics?.industry.topIndustries ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analytics?.industry.topIndustries}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics?.industry.topIndustries.map((entry: any, index: number) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={PIE_COLORS[index % PIE_COLORS.length].color}
                                style={{
                                  filter: `drop-shadow(0 0 8px ${PIE_COLORS[index % PIE_COLORS.length].color}80)`
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#4ECDC4]/20" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Technologies Analytics */}
              <div
                onClick={() => handleCardClick('technologies')}
                className="cursor-pointer"
              >
                <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 h-[400px] shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-[#45B7D1]" />
                      <CardTitle className="text-lg font-semibold text-gray-800">Technologies Distribution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)]">
                    {analytics?.technologies.allTechnologies ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={analytics?.technologies.allTechnologies}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={100} />
                          <YAxis stroke="#666" />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="value" 
                            fill="#45B7D1" 
                            radius={[6, 6, 0, 0]} 
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#45B7D1]/20" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Employee Size Analytics */}
              <div
                onClick={() => handleCardClick('employee')}
                className="cursor-pointer"
              >
                <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 h-[400px] shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#96CEB4]" />
                      <CardTitle className="text-lg font-semibold text-gray-800">Employee Size Distribution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)]">
                    {analytics?.employeeSize.ranges ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={analytics?.employeeSize.ranges}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" stroke="#666" />
                          <YAxis stroke="#666" />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="value" 
                            fill="#96CEB4" 
                            radius={[6, 6, 0, 0]} 
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#96CEB4]/20" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Annual Revenue Analytics */}
              <div
                onClick={() => handleCardClick('revenue')}
                className="cursor-pointer"
              >
                <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 h-[400px] shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-[#FF8C42]" />
                      <CardTitle className="text-lg font-semibold text-gray-800">Revenue Range Distribution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)]">
                    {analytics?.annualRevenue.ranges ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={analytics?.annualRevenue.ranges}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" stroke="#666" angle={-45} textAnchor="end" height={100} />
                          <YAxis stroke="#666" />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar 
                            dataKey="value" 
                            fill="#FF8C42" 
                            radius={[6, 6, 0, 0]} 
                          />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#FF8C42]/20" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Country Analytics */}
              <div
                onClick={() => handleCardClick('country')}
                className="cursor-pointer"
              >
                <Card className="bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 h-[400px] shadow-sm hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-5 text-[#9B59B6]" />
                      <CardTitle className="text-lg font-semibold text-gray-800">Top Countries</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="h-[calc(100%-60px)]">
                    {analytics?.country.topCountries ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={analytics?.country.topCountries}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {analytics?.country.topCountries.map((entry: any, index: number) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={PIE_COLORS[(index + 2) % PIE_COLORS.length].color}
                                style={{
                                  filter: `drop-shadow(0 0 8px ${PIE_COLORS[(index + 2) % PIE_COLORS.length].color}80)`
                                }}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-[#9B59B6]/20" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {renderFullView()}
    </>
  )
} 