import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User } from "@/lib/models/user"
import { DataFile } from "@/lib/models/dataFile"
import { hashPassword, isAdmin } from "@/lib/auth"
import { parse } from "papaparse"
import type { IDataFile } from "@/lib/models/dataFile"
import mongoose from "mongoose"
import * as XLSX from 'xlsx'

interface PopulatedUserDataFile {
  fileId: IDataFile & { _id: mongoose.Types.ObjectId }
  title: string
  createdAt: Date
}

interface PopulatedUser {
  _id: mongoose.Types.ObjectId
  email: string
  role: string
  title?: string
  logoUrl?: string
  createdAt: Date
  updatedAt: Date
  dataFiles: PopulatedUserDataFile[]
}

// All supported columns - all are optional to support both old and new data formats
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

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await connectToDatabase()
    const users = await User.find({ role: "user" })
      .select("-password")
      .populate("dataFiles.fileId")
      .lean()
      .exec() as unknown as PopulatedUser[]

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        _id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        dataFiles: (user.dataFiles || []).map(file => ({
          fileId: file.fileId._id.toString(),
          title: file.title,
          filename: file.fileId.originalName,
        })),
      })),
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const formData = await request.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const title = formData.get("title") as string
    const file = formData.get("file") as File

    if (!email || !password || !title || !file) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if email is already in use
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    let parsedData: any[] = []
    const fileBuffer = await file.arrayBuffer()

    // Handle Excel files
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const workbook = XLSX.read(fileBuffer)
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      parsedData = XLSX.utils.sheet_to_json(worksheet)
    } 
    // Handle CSV files
    else if (file.name.endsWith('.csv')) {
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

    // Create the user with the data file
    const hashedPassword = await hashPassword(password)
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "user",
      title,
      dataFiles: [{
        fileId: dataFile._id,
        title: title,
        createdAt: new Date(),
      }],
    })

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          email: newUser.email,
          title,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

