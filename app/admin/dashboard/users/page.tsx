"use client"

import { UserList } from "@/components/admin/user-list"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, UserPlus } from "lucide-react"
import { CreateUserForm } from "@/components/admin/create-user-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useRef } from "react"

export default function ManageUsersPage() {
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false)
  const userListRef = useRef<{ refreshUsers: () => void }>(null)

  const handleUserCreated = () => {
    // Refresh the user list
    userListRef.current?.refreshUsers()
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Manage Users
        </h1>
        <p className="text-zinc-400 mt-2">
          View and manage all users in the system
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search users..."
              className="pl-8 w-[300px] bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-400 focus:ring-zinc-700"
            />
          </div>
        </div>
        <Button onClick={() => setIsCreateUserModalOpen(true)} className="bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Add New User
        </Button>
      </div>

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <UserList ref={userListRef} />
        </CardContent>
      </Card>

      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-white [&>button]:text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New User</DialogTitle>
          </DialogHeader>
          <CreateUserForm 
            onSuccess={() => setIsCreateUserModalOpen(false)} 
            onUserCreated={handleUserCreated}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

