/* eslint-disable @typescript-eslint/no-unused-vars */
"use server"

import { cookies } from "next/headers"
import type { User } from "@/lib/types"

// Mock database for demonstration purposes
// In a real app, you would use a database like Supabase, MongoDB, etc.
const USERS_DB = new Map<string, User>([
  [
    "user@example.com",
    {
      id: "1",
      email: "user@example.com",
      name: "Regular User",
      password: "password123", // In a real app, this would be hashed
      role: "user",
      image: null,
    },
  ],
  [
    "admin@example.com",
    {
      id: "2",
      email: "admin@example.com",
      name: "Admin User",
      password: "admin123", // In a real app, this would be hashed
      role: "admin",
      image: null,
    },
  ],
])

// Mock tokens for password reset
const RESET_TOKENS = new Map<string, string>()

// Authentication actions
export async function login({ email, password }: { email: string; password: string }) {
  // In a real app, you would validate credentials against a database
  const user = USERS_DB.get(email.toLowerCase())

  if (!user || user.password !== password) {
    return { success: false, error: "Invalid email or password" }
  }

  // Set session cookie
  const session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image,
    },
  }

  ;(await cookies()).set("session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return { success: true }
}

export async function signup({ name, email, password }: { name: string; email: string; password: string }) {
  // Check if user already exists
  if (USERS_DB.has(email.toLowerCase())) {
    return { success: false, error: "Email already in use" }
  }

  // Create new user
  const newUser: User = {
    id: `${USERS_DB.size + 1}`,
    email: email.toLowerCase(),
    name,
    password, // In a real app, this would be hashed
    role: "user",
    image: null,
  }

  // Add to mock database
  USERS_DB.set(email.toLowerCase(), newUser)

  // Set session cookie
  const session = {
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      image: newUser.image,
    },
  }

  ;(await cookies()).set("session", JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })

  return { success: true }
}

export async function logout() {
  (await cookies()).delete("session")
  return { success: true }
}

export async function forgotPassword({ email }: { email: string }) {
  // Check if user exists
  const user = USERS_DB.get(email.toLowerCase())

  if (!user) {
    // Don't reveal if email exists or not for security
    return { success: true }
  }

  // Generate reset token
  const token = Math.random().toString(36).substring(2, 15)
  RESET_TOKENS.set(token, email.toLowerCase())

  // In a real app, you would send an email with the reset link
  console.log(`Reset token for ${email}: ${token}`)

  return { success: true }
}

export async function resetPassword({ token, password }: { token: string; password: string }) {
  // Verify token
  const email = RESET_TOKENS.get(token)

  if (!email) {
    return { success: false, error: "Invalid or expired token" }
  }

  // Get user
  const user = USERS_DB.get(email)

  if (!user) {
    return { success: false, error: "User not found" }
  }

  // Update password
  user.password = password // In a real app, this would be hashed
  USERS_DB.set(email, user)

  // Delete token
  RESET_TOKENS.delete(token)

  return { success: true }
}

export async function getCurrentUser() {
  const sessionCookie = (await cookies()).get("session")

  if (!sessionCookie?.value) {
    return { success: false }
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return { success: true, user: session.user }
  } catch (error) {
    return { success: false }
  }
}

export async function updateProfile(formData: FormData) {
  const sessionCookie = (await cookies()).get("session")

  if (!sessionCookie?.value) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    const user = USERS_DB.get(session.user.email)

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Update name
    const name = formData.get("name") as string
    if (name) {
      user.name = name
    }

    // Update image (in a real app, you would upload to storage)
    const image = formData.get("image") as File
    if (image && image.size > 0) {
      // Mock image URL
      user.image = `/placeholder.svg?height=200&width=200`
    }

    // Update user in mock database
    USERS_DB.set(user.email, user)

    // Update session
    const updatedSession = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
    }

    ;(await cookies()).set("session", JSON.stringify(updatedSession), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update profile" }
  }
}

export async function updatePassword({
  currentPassword,
  newPassword,
}: { currentPassword: string; newPassword: string }) {
  const sessionCookie = (await cookies()).get("session")

  if (!sessionCookie?.value) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    const user = USERS_DB.get(session.user.email)

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Verify current password
    if (user.password !== currentPassword) {
      return { success: false, error: "Current password is incorrect" }
    }

    // Update password
    user.password = newPassword // In a real app, this would be hashed
    USERS_DB.set(user.email, user)

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to update password" }
  }
}

