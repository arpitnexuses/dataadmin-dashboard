import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { getCurrentUser } from "@/lib/auth"
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, selectedRecords, selectedIndices } = body

    if (!type || (type === 'selected' && (!selectedRecords || !selectedIndices))) {
      return NextResponse.json({ error: "Invalid export parameters" }, { status: 400 })
    }

    await connectToDatabase()

    // Get user with all data files
    const user = await User.findById(session.id)
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: 'data'
      })
      .lean()
      .exec()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.dataFiles || user.dataFiles.length === 0) {
      return NextResponse.json({ error: "No data files found" }, { status: 404 })
    }

    // Combine all data from all files
    let allData = user.dataFiles.flatMap(file => 
      (file.fileId as any).data || []
    )

    // If exporting selected records, use the selected indices
    if (type === 'selected' && selectedIndices) {
      allData = selectedIndices.map((index: number) => allData[index])
    }

    if (allData.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 400 })
    }

    // Create Excel workbook
    const ws = XLSX.utils.json_to_sheet(allData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Data')

    // Convert to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Return the file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="exported_data.xlsx"'
      }
    })
  } catch (error) {
    console.error("Error exporting data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 