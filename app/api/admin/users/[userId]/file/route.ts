import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import * as XLSX from 'xlsx'

// All supported columns - all are optional
const ALL_SUPPORTED_COLUMNS = [
  // Original columns
  'First_Name',
  'Last_Name',
  'Title',
  'Company',
  'Email',
  'Corporate_Phone',
  'Personal_Phone',
  'Employees_Size',
  'Industry',
  'Person_Linkedin_Url',
  'Website',
  'Company_Linkedin_Url',
  'Country',
  'Technologies',
  'Annual_Revenue',
  
  // New columns
  'S_No',
  'Account_name',
  'Industry_client',
  'Industry_Nexuses',
  'Type_of_Company',
  'priority',
  'Sales_Manager',
  'No_of_Employees',
  'Revenue',
  'Contact_Name',
  'Designation',
  'Contact_Number_Personal',
  'Phone_Status',
  'Email_id',
  'Email_Status',
  'City',
  'State',
  'Country_Contact_Person',
  'Company_Address',
  'Company_Headquarter',
  'Workmates_Remark',
  'TM_Remarks'
]

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

    let parsedData: any[] = []
    
    // Handle different file types
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const fileBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(fileBuffer)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      parsedData = XLSX.utils.sheet_to_json(worksheet)
    } else if (file.name.endsWith('.csv')) {
      // Process the new file
      const fileContent = await file.text()
      const result = parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => value.trim(),
      })
      parsedData = result.data
    } else {
      return NextResponse.json({ error: "Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file." }, { status: 400 })
    }

    // Basic validation - ensure there's data
    if (!parsedData || parsedData.length === 0) {
      return NextResponse.json({ error: "The uploaded file contains no data." }, { status: 400 })
    }

    // Ensure the file has at least some column headers
    const fileHeaders = Object.keys(parsedData[0] || {})
    if (fileHeaders.length === 0) {
      return NextResponse.json({ error: "The uploaded file has no column headers." }, { status: 400 })
    }

    // Store the original column order from the file
    const originalColumns = [...fileHeaders]

    // Clean and validate the data
    const cleanedData = parsedData.map(row => {
      const cleanedRow: Record<string, string> = {}
      
      // First add columns in the original order from the file
      for (const header of originalColumns) {
        if (row[header] !== undefined) {
          cleanedRow[header] = (row[header] || '').toString().trim()
        }
      }
      
      // Then add any additional supported columns that might be missing but have a match
      for (const column of ALL_SUPPORTED_COLUMNS) {
        if (cleanedRow[column] === undefined) {
          // Check for case-insensitive match
          const matchingKey = Object.keys(row).find(
            key => key.toLowerCase() === column.toLowerCase() && key !== column
          )
          
          if (matchingKey !== undefined) {
            // Use the supported column name but keep track of original mapping
            cleanedRow[column] = (row[matchingKey] || '').toString().trim()
          }
        }
      }
      
      return cleanedRow
    })

    // Create a new data file record
    const dataFile = await DataFile.create({
      filename: file.name,
      originalName: file.name,
      columns: originalColumns,
      data: cleanedData,
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