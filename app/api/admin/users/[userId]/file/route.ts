import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { isAdmin } from "@/lib/auth"
import { parse } from "papaparse"

type RouteParams = {
  params: {
    userId: string
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const title = formData.get("title") as string

    if (!file || !title) {
      return NextResponse.json({ error: "File and title are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the user
    const userId = await Promise.resolve(params.userId)
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Process the new file
    const fileContent = await file.text()
    const parsedData = parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    })

    // Create a new data file record
    const dataFile = await DataFile.create({
      filename: file.name,
      originalName: file.name,
      data: parsedData.data,
    })

    // Add the new file to user's dataFiles array
    user.dataFiles.push({
      fileId: dataFile._id,
      title,
      createdAt: new Date(),
    })

    await user.save()

    return NextResponse.json({
      message: "File uploaded successfully",
      dataFile: {
        id: dataFile._id,
        title,
        filename: dataFile.originalName,
      },
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get("fileId")

    if (!fileId) {
      return NextResponse.json({ error: "File ID is required" }, { status: 400 })
    }

    await connectToDatabase()

    // Find the user
    const userId = await Promise.resolve(params.userId)
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Find and remove the file from user's dataFiles array
    const fileIndex = user.dataFiles.findIndex(
      (file) => file.fileId.toString() === fileId
    )

    if (fileIndex === -1) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Delete the data file
    await DataFile.findByIdAndDelete(fileId)

    // Remove the file from user's dataFiles array
    user.dataFiles.splice(fileIndex, 1)
    await user.save()

    return NextResponse.json({ message: "File deleted successfully" })
  } catch (error) {
    console.error("Error deleting file:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 