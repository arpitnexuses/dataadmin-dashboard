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

const REQUIRED_COLUMNS = [
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
  'Annual_Revenue'
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
    const logoUrl = formData.get("logoUrl") as string
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

    // Validate required columns
    const fileHeaders = Object.keys(parsedData[0] || {}).map(header => header.trim())
    const missingColumns = REQUIRED_COLUMNS.filter(col => !fileHeaders.includes(col))
    
    if (missingColumns.length > 0) {
      return NextResponse.json({ 
        error: `Missing required columns: ${missingColumns.join(', ')}`,
        requiredColumns: REQUIRED_COLUMNS
      }, { status: 400 })
    }

    // Clean and validate the data
    const cleanedData = parsedData.map(row => {
      const cleanedRow: Record<string, string> = {}
      for (const column of REQUIRED_COLUMNS) {
        cleanedRow[column] = (row[column] || '').toString().trim()
      }
      return cleanedRow
    })

    // Create a new data file record
    const dataFile = await DataFile.create({
      filename: file.name,
      originalName: file.name,
      data: cleanedData,
    })

    // Create the user with the data file
    const hashedPassword = await hashPassword(password)
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "user",
      title,
      logoUrl: logoUrl || null,
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
          logoUrl,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

