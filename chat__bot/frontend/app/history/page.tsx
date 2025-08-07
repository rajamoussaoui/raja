'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Sidebar from '@/components/sidebar'

interface Conversation {
  _id: string
  norme: string
  description: string
  created_at: string
  last_updated: string
  status: 'in_progress' | 'completed'
  final_score?: number
}

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectAll, setSelectAll] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('authToken')

    if (!token) {
      setIsAuthenticated(false)
      setLoading(false)
      return
    }

    setIsAuthenticated(true)

    const fetchConversations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/conversations/history', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (!data.conversations) {
          throw new Error('Invalid data format')
        }

        setConversations(data.conversations)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch conversations')
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const handleOpenConversation = (conversationId: string) => {
    localStorage.setItem('currentConversationId', conversationId)
    router.push('/')
  }

  const handleDelete = async (conversationId: string) => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      const response = await fetch(`http://localhost:5000/api/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete conversation')

      setConversations(prev => prev.filter(c => c._id !== conversationId))
      setSelectedIds(prev => prev.filter(id => id !== conversationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation')
    }
  }

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([])
    } else {
      setSelectedIds(conversations.map(c => c._id))
    }
    setSelectAll(!selectAll)
  }

  const handleBulkDelete = async () => {
    const token = localStorage.getItem('authToken')
    if (!token) return

    if (!confirm(`Delete ${selectedIds.length} selected conversations?`)) return

    try {
      await Promise.all(
        selectedIds.map(id =>
          fetch(`http://localhost:5000/api/conversations/${id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      )
      setConversations(prev => prev.filter(c => !selectedIds.includes(c._id)))
      setSelectedIds([])
      setSelectAll(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete selected conversations')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Veuillez vous connecter pour voir votre historique.</p>
          <button
            onClick={() => router.push('/profile')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Se connecter
          </button>
        </div>
      </div>
    )
  }

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
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isMobile={false} />
      <div className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Conversation History</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your previous assessments
            </p>
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-900">No conversations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't completed any assessments yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Start New Assessment
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete Selected ({selectedIds.length})
                  </button>
                )}
              </div>

              <ul className="divide-y divide-gray-200">
                {conversations.map(conversation => (
                  <li key={conversation._id} className="hover:bg-gray-50 px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(conversation._id)}
                          onChange={() => handleSelect(conversation._id)}
                        />
                        <p className="text-sm font-medium text-blue-600">
                          {conversation.norme.toUpperCase()}
                        </p>
                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          conversation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {conversation.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      {conversation.final_score && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Score: {conversation.final_score}%
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {conversation.description}
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      Created on {format(new Date(conversation.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="mt-4 flex space-x-3">
                      <button
                        onClick={() => handleOpenConversation(conversation._id)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDelete(conversation._id)}
                        className="inline-flex items-center px-3 py-1.5 border text-sm rounded text-red-700 bg-red-100 hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
