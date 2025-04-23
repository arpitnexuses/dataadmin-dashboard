"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, LogOut, Settings, FileText, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" })
    router.push("/admin")
    router.refresh()
  }

  const menuItems = [
    {
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/admin/dashboard/users",
      icon: Users,
      label: "Manage Users",
    },
    {
      href: "/admin/requests",
      icon: FileText,
      label: "Data Requests",
    },
    {
      href: "/admin/credit-requests",
      icon: CreditCard,
      label: "Credit Requests",
    },
  ]

  return (
    <div className="flex flex-col h-full bg-zinc-900 text-white border-r border-zinc-800 w-64">
      <div className="relative p-4 border-b border-zinc-800">
        <div className="flex flex-col items-center">
          <div className="relative w-full h-12 bg-transparent">
            <Image
              src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses_logo_blue_(2)_3_721ee160-2cac-429c-af66-f55b7233f6ed.png"
              alt="Nexuses Logo"
              fill
              className="object-contain brightness-0 invert p-1"
              priority
            />
          </div>
          <span className="text-sm font-medium text-white/90 mt-2">
            Admin Portal
          </span>
        </div>
      </div>
      <div className="flex-1 py-6 px-3">
        <nav className="flex flex-col">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href
            const isLastItem = index === menuItems.length - 1
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                passHref
                className={cn(!isLastItem && "mb-2")}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-14 transition-all duration-200 text-base rounded-xl",
                    isActive
                      ? "bg-zinc-800 text-white hover:bg-zinc-700"
                      : "text-white/70 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="p-3 border-t border-zinc-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 h-11 text-white/70 hover:text-white hover:bg-zinc-800 transition-all duration-200 text-base"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  )
}

