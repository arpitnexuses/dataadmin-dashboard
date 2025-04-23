import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User, type IUser } from "@/lib/models/user"
import { isAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId, credits } = await request.json()

    if (!userId || typeof credits !== 'number') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findById(userId) as IUser
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Ensure credits don't go negative
    const newCredits = Math.max(0, (user.credits || 0) + credits)
    user.credits = newCredits
    await user.save()

    // Trigger a refresh of the user's dashboard data
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/user/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
    } catch (refreshError) {
      console.error("Error refreshing user data:", refreshError)
      // Don't fail the request if refresh fails
    }

    return NextResponse.json({
      message: "Credits updated successfully",
      credits: user.credits,
    })
  } catch (error) {
    console.error("Error updating credits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 