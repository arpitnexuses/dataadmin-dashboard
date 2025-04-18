import type React from "react"

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#1C1C1C] px-1">
      <div className="w-full">{children}</div>
    </div>
  )
}

