import type React from "react"

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-black">
      <div className="w-full">{children}</div>
    </div>
  )
}

