import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Get the latest user data
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      message: "User data refreshed successfully",
      credits: user.credits
    })
  } catch (error) {
    console.error("Error refreshing user data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 