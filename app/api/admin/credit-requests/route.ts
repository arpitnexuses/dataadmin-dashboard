import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { CreditRequest } from "@/lib/models/creditRequest"
import { User } from "@/lib/models/user"
import { isAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()

    const requests = await CreditRequest.find()
      .populate('userId', 'email')
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
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { requestId, action } = await request.json()

    if (!requestId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    await connectToDatabase()

    const creditRequest = await CreditRequest.findById(requestId)
    if (!creditRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    if (creditRequest.status !== 'pending') {
      return NextResponse.json({ error: "Request already processed" }, { status: 400 })
    }

    if (action === 'approve') {
      // Update user credits
      await User.findByIdAndUpdate(creditRequest.userId, {
        $inc: { credits: creditRequest.amount }
      })
    }

    // Update request status
    creditRequest.status = action === 'approve' ? 'approved' : 'rejected'
    await creditRequest.save()

    return NextResponse.json({
      message: `Request ${action}d successfully`,
      request: creditRequest,
    })
  } catch (error) {
    console.error("Error processing credit request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 