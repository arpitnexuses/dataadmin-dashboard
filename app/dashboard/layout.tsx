import type React from "react"
import { UserSidebar } from "@/components/layout/user-sidebar"

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <UserSidebar />
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}

