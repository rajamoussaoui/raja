// profile/page.tsx
import React from "react"
import { ProfileForm } from "@/components/profile-form"

export default function ProfilePage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">User Profile</h1>
      <ProfileForm />
    </main>
  )
}
