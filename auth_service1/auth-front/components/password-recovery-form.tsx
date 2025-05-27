/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { api } from "@/utils/api"

export function PasswordRecoveryForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate email
    if (!email) {
      setError("Please enter your email address")
      return
    }

    try {
      setIsLoading(true)

      await api.post('/auth/password-reset/request', {
        email
      })

      console.log("Password reset email sent to:", email)
      setIsSubmitted(true)
    } catch (err: any) {
      console.error("Failed to send password reset email", err)
      setError(err.message || "Failed to send password reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="rounded-lg border border-green-100 bg-green-50 p-6 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-green-800">Check your email</h3>
        <p className="mt-2 text-sm text-green-700">
          We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the
          instructions to reset your password.
        </p>
        <p className="mt-4 text-xs text-green-600">
          If you don't see the email, check your spam folder or make sure you entered the correct email address.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          required
          autoComplete="email"
        />
      </div>

      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" disabled={isLoading}>
        {isLoading ? "Sending reset link..." : "Send reset link"}
      </Button>
    </form>
  )
}