import { AuthForm } from "@/components/auth-form"

export default function UserLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#EBF3FF] to-white">
      <AuthForm type="login" isAdmin={false} />
    </div>
  )
}

