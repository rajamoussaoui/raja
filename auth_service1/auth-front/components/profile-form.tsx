"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@/lib/types"

export function ProfileForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [user, setUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const email = localStorage.getItem("userEmail")
      if (!email) return

      try {
        const response = await fetch(`http://localhost:8001/user/by-email?email=${encodeURIComponent(email)}`, {
          credentials: "include",
        })

        if (!response.ok) throw new Error("Failed to fetch user")

        const userData = await response.json()
        setUser(userData)
        setName(userData.name)
      } catch (err) {
        console.error("Error fetching user:", err)
      }
    }

    fetchUser()
  }, [])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdatingProfile(true)
    setProfileError(null)

    const formData = new FormData()
    formData.append("email", user.email)

    let hasChanges = false
    if (name !== user.name) {
      formData.append("name", name)
      hasChanges = true
    }

    if (profileImage) {
      formData.append("image", profileImage)
      hasChanges = true
    }

    if (!hasChanges) {
      toast({ title: "No changes detected", description: "Make changes to update your profile." })
      setIsUpdatingProfile(false)
      return
    }

    try {
      const token = localStorage.getItem("access_token") // 🔐 Get JWT token

      const response = await fetch("http://localhost:8001/user/profile", {
        method: "PUT",
        body: formData,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Add auth header
        },
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: "Profile updated", description: "Your profile has been updated successfully." })
        router.refresh()
      } else {
        setProfileError(result.error || "Failed to update profile. Please try again.")
      }
    } catch (err) {
      setProfileError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsUpdatingPassword(true)
    setPasswordError(null)

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      setIsUpdatingPassword(false)
      return
    }

    try {
      const token = localStorage.getItem("access_token")// 🔐 Get JWT token

      const formData = new FormData()
      formData.append("email", user.email)
      formData.append("current_password", currentPassword)
      formData.append("new_password", newPassword)
      formData.append("confirm_password", confirmPassword)

      const response = await fetch("http://localhost:8001/user/password", {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: {
          Authorization: `Bearer ${token}`, // ✅ Add auth header
        },
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: "Password updated", description: "Your password has been updated successfully." })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordError(result.error || "Failed to update password. Please try again.")
      }
    } catch (err) {
      setPasswordError("An unexpected error occurred. Please try again.")
      console.error(err)
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setProfileError("Image size must be less than 2MB")
        return
      }
      setProfileImage(file)
      setProfileError(null)
    }
  }

  if (!user) {
    return <p className="text-center text-sm text-muted-foreground">Loading profile...</p>
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="space-y-6">
      {/* Profile Update */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {profileError && (
              <Alert variant="destructive">
                <AlertDescription>{profileError}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={user.image || ""}
                  alt={user.name}
                  onError={(e) => {
                    e.currentTarget.style.display = "none"
                  }}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <Input id="profileImage" type="file" accept="image/*" onChange={handleImageChange} />
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={user.email} disabled />
              <p className="text-xs text-muted-foreground">Your email cannot be changed</p>
            </div>
            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? "Updating..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}