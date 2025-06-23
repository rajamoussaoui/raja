'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Sidebar from '@/components/sidebar'

interface Conversation {
  _id: string
  norme: string
  description: string
  created_at: string
  status: 'in_progress' | 'completed'
  final_score?: number
}

export default function ConversationPage() {
  const params = useParams()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/conversations/${params.id}`
        )
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        setConversation(data.conversation)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conversation')
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-lg mb-4">Conversation not found</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isMobile={false} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-2">
              {conversation.norme.toUpperCase()} Assessment
            </h1>
            <p className="text-gray-600 mb-4">{conversation.description}</p>
            
            <div className="flex items-center space-x-4 mb-4">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                conversation.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {conversation.status === 'completed' ? 'Completed' : 'In Progress'}
              </span>
              
              {conversation.final_score && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Score: {conversation.final_score}%
                </span>
              )}
            </div>

            {/* Add your conversation content rendering here */}
            
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Back to History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}