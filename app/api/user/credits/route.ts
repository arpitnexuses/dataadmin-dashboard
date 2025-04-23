import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { credits } = await request.json()

    if (typeof credits !== 'number') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findById(session.id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // For negative credits (export), check if user has enough credits
    if (credits < 0 && user.credits < Math.abs(credits)) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    user.credits += credits
    await user.save()

    return NextResponse.json({
      message: "Credits updated successfully",
      credits: user.credits,
    })
  } catch (error) {
    console.error("Error updating credits:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 