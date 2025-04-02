import { type NextRequest, NextResponse } from "next/server"
import connectToDatabase from "@/lib/mongodb"
import { User, type IUser } from "@/lib/models/user"
import { comparePasswords, createToken, setAuthCookie } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    await connectToDatabase()

    const user = await User.findOne<IUser>({ email }).lean()
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const isPasswordValid = await comparePasswords(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await createToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    })

    const response = NextResponse.json({
      message: "Login successful",
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    })

    return setAuthCookie(response, token)
  } catch (error) {
    console.error("Error in login:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

