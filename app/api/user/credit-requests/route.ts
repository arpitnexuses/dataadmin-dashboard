import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { CreditRequest } from "@/lib/models/creditRequest"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const requests = await CreditRequest.find({ userId: session.id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Error fetching credit requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { amount } = await request.json()

    if (typeof amount !== 'number' || amount < 1) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    await connectToDatabase()

    const creditRequest = await CreditRequest.create({
      userId: session.id,
      amount,
    })

    return NextResponse.json({
      message: "Credit request created successfully",
      request: creditRequest,
    })
  } catch (error) {
    console.error("Error creating credit request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 