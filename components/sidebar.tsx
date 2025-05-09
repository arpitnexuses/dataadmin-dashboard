"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, List, FileText, CreditCard, LogOut, Settings } from "lucide-react"
import Image from "next/image"

const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "List",
    icon: List,
    href: "/dashboard/list",
  },
  {
    label: "Data Request",
    icon: FileText,
    href: "/dashboard/request",
  },
  {
    label: "Credit Requests",
    icon: CreditCard,
    href: "/dashboard/credit-requests",
  },
  {
    label: "Account Settings",
    icon: Settings,
    href: "/dashboard/account-settings",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

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
        localStorage.clear();
        sessionStorage.clear();
        window.location.replace('/');
      } else {
        const data = await response.json().catch(() => null);
        console.error('Logout failed:', data?.message || 'Unknown error');
        window.location.replace('/');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      window.location.replace('/');
    }
  }

  return (
    <div className="space-y-4 py-4 flex flex-col h-full bg-[#F6F4FF] text-[#2D2D2D] w-64">
      <div className="px-4 py-2 flex-1">
        <div className="flex items-center justify-center mb-8">
          <Image
            src="https://cdn-nexlink.s3.us-east-2.amazonaws.com/Nexuses_logo_blue_(2)_3_721ee160-2cac-429c-af66-f55b7233f6ed.png"
            alt="Nexus Logo"
            width={200}
            height={200}
            style={{ filter: "brightness(0) saturate(100%) invert(60%) sepia(0%) saturate(0%) hue-rotate(180deg) brightness(0.5) contrast(1.1)" }}
          />
        </div>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-base group flex p-3 w-full justify-start font-medium cursor-pointer transition rounded-full",
                pathname === route.href
                  ? "bg-[#8370FC] text-white shadow-md"
                  : "text-[#838288] hover:text-[#8370FC] hover:bg-[#E6E1FF] hover:rounded-full"
              )}
            >
              <div className="flex items-center flex-1">
                <route.icon className={cn("h-5 w-5 mr-3", pathname === route.href ? "text-white" : "text-[#838288] group-hover:text-[#8370FC]")} />
                {route.label}
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="px-4 py-2">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start text-[#838288] hover:text-[#8370FC] hover:bg-[#E6E1FF]"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  )
} 