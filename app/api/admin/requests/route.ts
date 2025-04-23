import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { DataRequest } from "@/lib/models/dataRequest"
import { User } from "@/lib/models/user"
import { isAdmin } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const dataRequests = await DataRequest.find()
      .populate("userId", "email")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(dataRequests)
  } catch (error) {
    console.error("Error fetching data requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status } = await request.json()
    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await connectToDatabase()
    const updatedRequest = await DataRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).lean()

    if (!updatedRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json(updatedRequest)
  } catch (error) {
    console.error("Error updating data request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 