"use client"

import { motion, Variants } from "framer-motion"
import { useEffect, useState } from "react"
import { ClipboardCheck } from "lucide-react"
import styles from "./animated-logo.module.css"

export function AnimatedLogo() {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setIsAnimating(true)

    const interval = setInterval(() => {
      setIsAnimating(false)
      setTimeout(() => setIsAnimating(true), 100)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const circleVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0.5 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
  }

  const pulseVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1.2,
      opacity: [0, 0.5, 0], // keyframes sont valides ici
      transition: {
        duration: 1.5,
        ease: "easeOut",
        repeat: 1,
        repeatType: "reverse" as const, // 👈 pour typer correctement
      },
    },
  }

  return (
    <div className={styles.logoContainer}>
      {/* Pulsing background */}
      <motion.div
        className={styles.pulse}
        variants={pulseVariants}
        initial="hidden"
        animate={isAnimating ? "visible" : "hidden"}
      />

      {/* Main circle */}
      <motion.div
        className={styles.circle}
        variants={circleVariants}
        initial="hidden"
        animate={isAnimating ? "visible" : "hidden"}
      >
        <ClipboardCheck className={styles.icon} />
      </motion.div>
    </div>
  )
}
