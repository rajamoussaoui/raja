/* eslint-disable @typescript-eslint/no-unused-vars */
import { cookies } from "next/headers"
import type { User } from "@/lib/types"

interface Session {
  user: User
}

export async function getSession(): Promise<Session | null> {
  const sessionCookie = (await cookies()).get("session")

  if (!sessionCookie?.value) {
    return null
  }

  try {
    return JSON.parse(sessionCookie.value) as Session
  } catch (error) {
    return null
  }
}
