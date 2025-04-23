import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { DataRequest } from "@/lib/models/dataRequest"
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    await connectToDatabase()

    let dataRequest
    if (data._id) {
      // Check if request exists and hasn't been edited
      const existingRequest = await DataRequest.findById(data._id)
      if (!existingRequest) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 })
      }
      if (existingRequest.hasBeenEdited) {
        return NextResponse.json({ error: "Request has already been edited and cannot be modified further" }, { status: 400 })
      }

      // Update existing request
      dataRequest = await DataRequest.findByIdAndUpdate(
        data._id,
        { 
          ...data, 
          userId: session.id,
          hasBeenEdited: true 
        },
        { new: true }
      )
    } else {
      // Create new request
      dataRequest = await DataRequest.create({
        ...data,
        userId: session.id,
        hasBeenEdited: false
      })
    }

    if (!dataRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json(dataRequest, { status: data._id ? 200 : 201 })
  } catch (error) {
    console.error("Error creating/updating data request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const dataRequests = await DataRequest.find({ userId: session.id })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json(dataRequests)
  } catch (error) {
    console.error("Error fetching data requests:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get("id")

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    await connectToDatabase()
    const deletedRequest = await DataRequest.findOneAndDelete({
      _id: requestId,
      userId: session.id
    })

    if (!deletedRequest) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Request deleted successfully" })
  } catch (error) {
    console.error("Error deleting data request:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 