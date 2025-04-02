import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User, type IUser } from "@/lib/models/user"
import { createToken, hashPassword, setAuthCookie } from "@/lib/auth"
import type { Types } from "mongoose"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    await connectToDatabase()

    // Check if any admin exists
    const adminExists = await User.findOne({ role: "admin" })
    if (adminExists) {
      return NextResponse.json({ error: "Admin already exists" }, { status: 400 })
    }

    // Check if email is already in use
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: "admin", // First user is admin
    }) as IUser & { _id: Types.ObjectId }

    const token = await createToken({
      id: newUser._id.toString(),
      role: newUser.role,
      email: newUser.email,
    })

    const response = NextResponse.json(
      {
        message: "Admin created successfully",
        user: {
          id: newUser._id.toString(),
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    )

    return setAuthCookie(response, token)
  } catch (error) {
    console.error("Error in admin signup:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

