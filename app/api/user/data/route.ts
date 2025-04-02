import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { DataFile, type IDataFile } from "@/lib/models/dataFile"
import { User, type IUser } from "@/lib/models/user"
import { getCurrentUser } from "@/lib/auth"
import mongoose from "mongoose"

interface PopulatedDataFile extends Omit<IDataFile, "_id"> {
  _id: mongoose.Types.ObjectId
}

interface PopulatedUserDataFile {
  fileId: PopulatedDataFile
  title: string
  createdAt: Date
}

interface PopulatedUser extends Omit<IUser, "dataFiles"> {
  dataFiles: PopulatedUserDataFile[]
}

interface LegacyUser extends Omit<IUser, "dataFiles"> {
  dataFileId: mongoose.Types.ObjectId
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser()
    console.log("Session:", session)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    
    // Find user by ID, handling potential invalid ObjectId
    let user: PopulatedUser | null = null
    try {
      console.log("Finding user by ID:", session.id)
      const foundUser = await User.findOne<IUser>({ 
        _id: new mongoose.Types.ObjectId(session.id) 
      })
      .populate({
        path: "dataFiles.fileId",
        model: DataFile,
        select: 'filename originalName data.First_Name data.Last_Name data.Title data.Company data.Email data.Corporate_Phone data.Personal_Phone data.Employees_Size data.Industry data.Person_Linkedin_Url data.Website data.Company_Linkedin_Url data.Country data.Technologies data.Annual_Revenue'
      })
      .lean()
      .exec()

      console.log("Found user with data:", JSON.stringify(foundUser, null, 2))
      user = foundUser as unknown as PopulatedUser

      // If user has old schema (dataFileId), migrate to new schema
      const legacyUser = foundUser as unknown as LegacyUser
      if (legacyUser && 'dataFileId' in legacyUser && !('dataFiles' in legacyUser)) {
        console.log("Migrating user to new schema")
        const dataFile = await DataFile.findById(legacyUser.dataFileId)
          .select('filename originalName data.First_Name data.Last_Name data.Title data.Company data.Email data.Corporate_Phone data.Personal_Phone data.Employees_Size data.Industry data.Person_Linkedin_Url data.Website data.Company_Linkedin_Url data.Country data.Technologies data.Annual_Revenue')
        if (dataFile) {
          // Update user to new schema
          await User.findByIdAndUpdate(legacyUser._id, {
            $set: {
              dataFiles: [{
                fileId: dataFile._id,
                title: legacyUser.title || "Default Title",
                createdAt: new Date(),
              }],
            },
            $unset: { dataFileId: 1 },
          })

          // Update user object for response
          user = {
            ...legacyUser,
            dataFiles: [{
              fileId: dataFile,
              title: legacyUser.title || "Default Title",
              createdAt: new Date(),
            }],
          } as PopulatedUser
        }
      }
    } catch (error) {
      console.log("Error finding by ID:", error)
      // If ID is invalid, try finding by email
      if (session.email) {
        console.log("Finding user by email:", session.email)
        const foundUser = await User.findOne<IUser>({ email: session.email })
          .populate({
            path: "dataFiles.fileId",
            model: DataFile,
            select: 'filename originalName data.First_Name data.Last_Name data.Title data.Company data.Email data.Corporate_Phone data.Personal_Phone data.Employees_Size data.Industry data.Person_Linkedin_Url data.Website data.Company_Linkedin_Url data.Country data.Technologies data.Annual_Revenue'
          })
          .lean()
          .exec()

        console.log("Found user by email:", JSON.stringify(foundUser, null, 2))
        user = foundUser as unknown as PopulatedUser

        // If user has old schema (dataFileId), migrate to new schema
        const legacyUser = foundUser as unknown as LegacyUser
        if (legacyUser && 'dataFileId' in legacyUser && !('dataFiles' in legacyUser)) {
          console.log("Migrating user to new schema")
          const dataFile = await DataFile.findById(legacyUser.dataFileId)
            .select('filename originalName data.First_Name data.Last_Name data.Title data.Company data.Email data.Corporate_Phone data.Personal_Phone data.Employees_Size data.Industry data.Person_Linkedin_Url data.Website data.Company_Linkedin_Url data.Country data.Technologies data.Annual_Revenue')
          if (dataFile) {
            // Update user to new schema
            await User.findByIdAndUpdate(legacyUser._id, {
              $set: {
                dataFiles: [{
                  fileId: dataFile._id,
                  title: legacyUser.title || "Default Title",
                  createdAt: new Date(),
                }],
              },
              $unset: { dataFileId: 1 },
            })

            // Update user object for response
            user = {
              ...legacyUser,
              dataFiles: [{
                fileId: dataFile,
                title: legacyUser.title || "Default Title",
                createdAt: new Date(),
              }],
            } as PopulatedUser
          }
        }
      }
    }
    
    if (!user) {
      console.log("No user found")
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.dataFiles || user.dataFiles.length === 0) {
      console.log("No data files found for user")
      return NextResponse.json({ error: "No data files found for this user" }, { status: 404 })
    }

    console.log("User data files before mapping:", JSON.stringify(user.dataFiles, null, 2))
    const response = {
      title: user.title || "Data Dashboard",
      logoUrl: user.logoUrl,
      dataFiles: user.dataFiles.map((file) => {
        console.log("Processing file:", file.fileId._id.toString())
        console.log("File data sample:", file.fileId.data?.[0])
        return {
          id: file.fileId._id.toString(),
          title: file.title,
          filename: file.fileId.originalName,
          data: Array.isArray(file.fileId.data) ? file.fileId.data.map(item => ({
            First_Name: item.First_Name || '',
            Last_Name: item.Last_Name || '',
            Title: item.Title || '',
            Company: item.Company || '',
            Email: item.Email || '',
            Corporate_Phone: item.Corporate_Phone || '',
            Personal_Phone: item.Personal_Phone || '',
            Employees_Size: item.Employees_Size || '',
            Industry: item.Industry || '',
            Person_Linkedin_Url: item.Person_Linkedin_Url || '',
            Website: item.Website || '',
            Company_Linkedin_Url: item.Company_Linkedin_Url || '',
            Country: item.Country || '',
            Technologies: item.Technologies || '',
            Annual_Revenue: item.Annual_Revenue || ''
          })) : [],
        }
      }),
    }

    console.log("Final response data sample:", response.dataFiles[0]?.data?.[0])
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

