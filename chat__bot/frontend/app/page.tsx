"use client"

import { useState, useEffect } from "react"
import ChatInterface from "@/components/chat-interface"
import Sidebar from "@/components/sidebar"

export default function Home() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check on initial load
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Clean up
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  return (
    <main className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar isMobile={isMobile} />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl h-[600px]">
          <ChatInterface />
        </div>
      </div>
    </main>
  )
}

