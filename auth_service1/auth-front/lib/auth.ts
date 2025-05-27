import { User } from "./types"

// lib/auth.ts
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch("http://localhost:8000/user/me", {
      credentials: "include",
      cache: "no-store",
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error("Failed to fetch user", error)
    return null
  }
}