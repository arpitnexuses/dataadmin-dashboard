import { AuthForm } from "@/components/auth-form"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"

export default async function AdminLoginPage() {
  // Check if admin exists to determine whether to show signup option
  await connectToDatabase()
  const adminExists = await User.exists({ role: "admin" })
  const showSignup = !adminExists

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#1C1C1C]">
      <AuthForm type="login" isAdmin={true} showSignup={showSignup} variant="admin" />
    </div>
  )
}

