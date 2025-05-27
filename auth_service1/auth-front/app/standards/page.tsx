/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Download, FileText, ExternalLink } from "lucide-react"
import Link from "next/link"
import styles from "./standards.module.css"

interface ISOStandard {
  id: string
  title: string
  description: string
  pdfUrl: string
  coverImage: string
  color: string
}

// Sample ISO standards data
const isoStandards = [
  {
    id: "iso9001",
    title: "ISO 9001:2015",
    description: "Quality Management Systems - Requirements",
    pdfUrl: "/pdfs/iso9001.pdf", // Replace with actual PDF paths
    coverImage: "/coverpages/iso9001.png?height=400&width=300",
    color: "#0077b6",
  },
  {
    id: "iso42001",
    title: "ISO 42001:2023",
    description: "Artificial Intelligence Management Systems",
    pdfUrl: "/pdfs/iso42001.pdf",
    coverImage: "/coverpages/image1.png?height=400&width=300",
    color: "#2a9d8f",
  },
  {
    id: "iso27001",
    title: "ISO 27001:2022",
    description: "Information Security Management Systems",
    pdfUrl: "/pdfs/iso27001.pdf",
    coverImage: "/coverpages/iso27001.png?height=400&width=300",
    color: "#e76f51",
  },
  {
    id: "iso14791",
    title: "ISO 14791:2019",
    description: "Risk management for medical devices",
    pdfUrl: "/pdfs/iso14791.pdf",
    coverImage: "/coverpages/iso14971.png?height=400&width=300",
    color: "#e9c46a",
  },
  {
    id: "iso13485",
    title: "ISO 13485:2016",
    description: " Medical devices — Quality management systems — Requirements for regulatory purposes",
    pdfUrl: "/pdfs/iso13485.pdf",
    coverImage: "/coverpages/iso13485.png?height=400&width=300",
    color: "#457b9d",
  },
]

export default function StandardsPage() {
  const [selectedStandard, setSelectedStandard] = useState<ISOStandard | null>(null)

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <header className={styles.header}>
          <Link href="/" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </Link>
          <h1 className={styles.pageTitle}>ISO Standards Library</h1>
        </header>

        {selectedStandard ? (
          <PDFViewer standard={selectedStandard} onClose={() => setSelectedStandard(null)} />
        ) : (
          <div className={styles.standardsGrid}>
            {isoStandards.map((standard, index) => (
              <StandardCard
                key={standard.id}
                standard={standard}
                index={index}
                onView={() => setSelectedStandard(standard)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StandardCard({
  standard,
  index,
  onView,
}: {
  standard: ISOStandard
  index: number
  onView: () => void
}) {
  return (
    <motion.div
      className={styles.standardCard}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      style={{
        borderTop: `4px solid ${standard.color}`,
      }}
    >
      <div className={styles.standardCover}>
        <img
          src={standard.coverImage || "/placeholder.svg"}
          alt={`${standard.title} cover`}
          className={styles.coverImage}
        />
      </div>
      <div className={styles.standardInfo}>
        <h2 className={styles.standardTitle}>{standard.title}</h2>
        <p className={styles.standardDescription}>{standard.description}</p>

        <div className={styles.standardActions}>
          <button className={styles.viewButton} onClick={onView}>
            <FileText size={16} />
            View Standard
          </button>
          <a href={standard.pdfUrl} download={`${standard.title}.pdf`} className={styles.downloadButton}>
            <Download size={16} />
            Download
          </a>
        </div>
      </div>
    </motion.div>
  )
}

function PDFViewer({
  standard,
  onClose,
}: {
  standard: ISOStandard
  onClose: () => void
}) {
  return (
    <div className={styles.pdfViewerContainer}>
      <div className={styles.pdfHeader}>
        <button onClick={onClose} className={styles.closeButton}>
          <ArrowLeft size={20} />
          <span>Back to Standards</span>
        </button>
        <h2 className={styles.pdfTitle}>{standard.title}</h2>
        <a href={standard.pdfUrl} download={`${standard.title}.pdf`} className={styles.downloadPdfButton}>
          <Download size={16} />
          Download
        </a>
      </div>

      <div className={styles.pdfEmbed}>
        <iframe src={`${standard.pdfUrl}#view=FitH`} className={styles.pdfFrame} title={`${standard.title} PDF`} />
      </div>

      <div className={styles.pdfFallback}>
        <p>If the PDF doesn't load properly, you can:</p>
        <a href={standard.pdfUrl} target="_blank" rel="noopener noreferrer" className={styles.externalLinkButton}>
          <ExternalLink size={16} />
          Open in new tab
        </a>
      </div>
    </div>
  )
}
