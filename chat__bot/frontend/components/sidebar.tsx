/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  History,
  User,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useTheme } from "@/components/theme-provider"

interface SidebarProps {
  isMobile: boolean
}

interface UserData {
  nom: string
  prenom: string
}

export default function Sidebar({ isMobile }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(!isMobile)
  const [user, setUser] = useState<UserData | null>(null)

  const { theme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(!isMobile)

    // 🔄 Lire depuis localStorage
    const userData = localStorage.getItem("userData")
    if (userData) {
      try {
        const parsedUser: UserData = JSON.parse(userData)
        setUser(parsedUser)
      } catch (e) {
        console.error("Erreur parsing userData depuis localStorage:", e)
      }
    }
  }, [isMobile])

  const sidebarVariants = {
    open: { width: 280, transition: { duration: 0.3 } },
    closed: { width: 80, transition: { duration: 0.3 } },
  }

  const textVariants = {
    open: { opacity: 1, x: 0, display: "block", transition: { delay: 0.1, duration: 0.2 } },
    closed: { opacity: 0, x: -10, transitionEnd: { display: "none" }, transition: { duration: 0.2 } },
  }

  const menuItems = [
    { icon: <MessageSquare size={22} />, text: "Conversations", href: "/" },
    { icon: <History size={22} />, text: "History", href: "/history" },
    { icon: <User size={22} />, text: "Profile", href: "http://localhost:3000/profile" },
    { icon: <HelpCircle size={22} />, text: "Help", href: "/help" },
  ]

  return (
    <motion.div
      className="h-screen fixed left-0 top-0 flex flex-col border-r bg-card"
      variants={sidebarVariants}
      initial={isMobile ? "closed" : "open"}
      animate={isOpen ? "open" : "closed"}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg?height=40&width=40" alt="Logo" />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <motion.div variants={textVariants} className="ml-3">
            <h3 className="font-semibold">ISO COMPLIANCE</h3>
          </motion.div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="h-8 w-8">
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>

      <Separator />

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href

            return (
              <Link key={index} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={`w-full justify-start ${isOpen ? "px-3" : "px-3 justify-center"} mb-1`}
                >
                  <span className={isActive ? "text-primary" : "text-muted-foreground"}>
                    {item.icon}
                  </span>
                  <motion.span variants={textVariants} className="ml-3 text-sm">
                    {item.text}
                  </motion.span>
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      <Separator />

      {/* User Info */}
      <div className="p-4">
        <div className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder.svg?height=36&width=36" alt="User" />
            <AvatarFallback>
              {user ? `${user.prenom[0]}${user.nom[0]}`.toUpperCase() : "ME"}
            </AvatarFallback>
          </Avatar>
          <motion.div variants={textVariants} className="ml-3">
            <p className="text-sm font-medium">
              {user ? `${user.prenom} ${user.nom}` : "Utilisateur"}
            </p>
            <p className="text-xs text-muted-foreground">En ligne</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
  