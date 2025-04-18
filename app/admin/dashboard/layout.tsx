import type React from "react"
import { AdminSidebar } from "@/components/layout/admin-sidebar"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-[#1C1C1C]">
      <div className="w-64 h-full">
        <AdminSidebar />
      </div>
      <div className="flex-1 overflow-auto bg-[#1C1C1C]">{children}</div>
    </div>
  )
}

