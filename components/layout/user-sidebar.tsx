"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, FileText } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface DataFile {
  id: string
  title: string
  filename: string
}

interface UserData {
  title: string
  logoUrl: string
  dataFiles: DataFile[]
}

export function UserSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentFileIndex = searchParams.get('file')
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/user/data")
        if (response.ok) {
          const data = await response.json()
          setUserData(data)
          if (!currentFileIndex && data.dataFiles.length > 0) {
            router.push("/dashboard?file=0")
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentFileIndex, router])

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/50 shadow-sm relative">
      <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-gradient-to-b from-slate-200/50 via-slate-200/80 to-slate-200/50" />
      <div className="p-6 border-b border-slate-200/50 bg-white/80 backdrop-blur-sm">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ) : userData ? (
          <div className="flex flex-col items-center">
            {userData.logoUrl && (
              <div className="relative w-full h-20 bg-transparent">
                <Image
                  src={userData.logoUrl}
                  alt="Company Logo"
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-slate-500">No data available</div>
        )}
      </div>
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {userData?.dataFiles.map((file, index) => (
            <Link key={file.id} href={`/dashboard?file=${index}`} passHref>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start transition-all duration-200 ease-in-out rounded-xl relative group px-4 py-2.5",
                  currentFileIndex === index.toString()
                    ? "bg-slate-100 text-slate-900 font-medium shadow-sm hover:shadow-md hover:bg-slate-100"
                    : "text-slate-600 bg-white hover:bg-slate-100 hover:text-slate-900 hover:shadow-sm"
                )}
              >
                {currentFileIndex === index.toString() && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-slate-700 via-slate-600 to-slate-700 rounded-l-xl" />
                )}
                <FileText className={cn(
                  "mr-3 h-4 w-4 transition-colors duration-200",
                  currentFileIndex === index.toString() ? "text-slate-700" : "text-slate-400 group-hover:text-slate-600"
                )} />
                <span className="text-base">{file.title}</span>
              </Button>
            </Link>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-slate-200/50 bg-white/80 backdrop-blur-sm">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-sm transition-all duration-200 ease-in-out rounded-xl group px-4 py-2.5" 
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors duration-200" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  )
}

