"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ClipboardCheck, ArrowRight, LogIn, UserPlus, FileCheck, Award } from "lucide-react"
import styles from "./styles.module.css"
import { AnimatedLogo } from "@/components/animated-logo"
import Link from "next/link"

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={styles.logoContainer}
          >
            <AnimatedLogo />
            <span className={styles.companyName}>ISO Evaluator</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={styles.authButtons}
          >
            <Link href="/login" className={`${styles.button} ${styles.outlineButton}`}>
              <LogIn className={styles.buttonIcon} />
              Login
            </Link>
            <Link href="/signup" className={`${styles.button} ${styles.primaryButton}`}>
              <UserPlus className={styles.buttonIcon} />
              Sign Up
            </Link>
          </motion.div>
        </header>

        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className={styles.heroSection}
        >
          <div className={styles.heroContent}>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className={styles.heroTitle}
            >
              Streamline Your ISO Compliance
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className={styles.heroDescription}
            >
              Our intelligent quality management assistant helps you navigate ISO standards, evaluate compliance, and
              implement effective quality management systems.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className={styles.buttonGroup}
            >
              <Link href="/login" className={`${styles.button} ${styles.primaryButton} ${styles.largeButton}`}>
                Start Evaluation <ArrowRight className={styles.buttonIcon} />
              </Link>
              <Link href="/standards" className={`${styles.button} ${styles.outlineButton} ${styles.largeButton}`}>
                Explore Standards
              </Link>
            </motion.div>
          </div>

          <motion.div
            className={styles.chatbotPreview}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <ChatbotAnimation />
          </motion.div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className={styles.featuresSection}
        >
          <h2 className={styles.sectionTitle}>Quality Management Features</h2>

          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 + index * 0.2 }}
                className={styles.featureCard}
              >
                <div className={styles.featureIcon}>{feature.icon}</div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}

// Chatbot Animation Component
function ChatbotAnimation() {
  return (
    <div className={styles.chatbotContainer}>
      <div className={styles.chatbotGlow} />

      <motion.div
        className={styles.chatbotInterface}
        initial={{ y: 20 }}
        animate={{ y: [0, -10, 0] }}
        transition={{
          repeat: Number.POSITIVE_INFINITY,
          duration: 4,
          ease: "easeInOut",
        }}
      >
        <div className={styles.chatHeader}>
          <div className={styles.chatbotAvatar}>
            <ClipboardCheck className={styles.chatbotAvatarIcon} />
          </div>
          <div>
            <h3 className={styles.chatbotName}>ISO Evaluator</h3>
            <p className={styles.chatbotStatus}>Quality Expert</p>
          </div>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot}></span>
            <span className={styles.statusText}>Active</span>
          </div>
        </div>

        <div className={styles.chatMessages}>
          <ChatMessage message="Hello! How can I help with your ISO compliance needs today?" isBot={true} delay={1.2} />
          <ChatMessage
            message="We're preparing for ISO 9001 certification. Where should we start?"
            isBot={false}
            delay={2}
          />
          <ChatMessage
            message="Great question! I recommend beginning with a gap analysis of your current processes against ISO 9001:2015 requirements. Would you like me to guide you through this assessment?"
            isBot={true}
            delay={2.8}
          />
        </div>

        <div className={styles.chatInputContainer}>
          <div className={styles.chatInput}>
            <input type="text" placeholder="Ask about ISO standards..." className={styles.messageInput} disabled />
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} className={styles.sendButton}>
              <ArrowRight className={styles.sendIcon} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ✅ FIXED ChatMessage component with proper typing
interface ChatMessageProps {
  message: string
  isBot: boolean
  delay: number
}

function ChatMessage({ message, isBot, delay }: ChatMessageProps) {
  return (
    <motion.div
      className={`${styles.messageWrapper} ${isBot ? styles.botMessage : styles.userMessage}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className={`${styles.messageBubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {message}
      </div>
    </motion.div>
  )
}

const features = [
  {
    title: "ISO Standard Guidance",
    description: "Get expert guidance on ISO 9001, 42001, 27001, and other key standards for your organization.",
    icon: <FileCheck className={styles.featureIconSvg} />,
  },
  {
    title: "Compliance Assessment",
    description: "Evaluate your current processes against ISO requirements with our structured assessment tools.",
    icon: <ClipboardCheck className={styles.featureIconSvg} />,
  },
  {
    title: "Certification Preparation",
    description: "Step-by-step assistance to prepare your organization for successful ISO certification audits.",
    icon: <Award className={styles.featureIconSvg} />,
  },
]
