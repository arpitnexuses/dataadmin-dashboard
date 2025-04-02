import { cookies } from "next/headers"
import type { NextResponse } from "next/server"
import { jwtVerify, SignJWT } from "jose"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

interface JWTPayload {
  id: string
  email: string
  role: "admin" | "user"
  iat: number
  exp: number
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10)
}

export async function comparePasswords(password: string, hashedPassword: string) {
  return await bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: Omit<JWTPayload, "iat" | "exp">) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const typedPayload = payload as unknown as JWTPayload
    if (!typedPayload.id || !typedPayload.role || !typedPayload.email) {
      return null
    }
    return typedPayload
  } catch (error) {
    return null
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    return null
  }

  return await verifyToken(token)
}

export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  })
  return response
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  return response
}

export async function getCurrentUser() {
  const session = await getSession()

  if (!session) return null

  return {
    ...session,
    _id: session.id,
    createdAt: new Date(session.iat * 1000).toISOString(),
    updatedAt: new Date(session.exp * 1000).toISOString(),
    password: undefined,
  }
}

export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === "admin"
}

