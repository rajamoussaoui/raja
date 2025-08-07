/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

interface Conversation {
  _id: string;
  norme: string;
  created_at: string;
  last_updated: string;
  status: 'completed' | 'in_progress' | string;
  final_score?: number;
}

const ConversationHistory: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      try {
        const response = await axios.get<{ conversations: Conversation[] }>('/api/conversations/history');
        setConversations(response.data.conversations);
        setError(null);
      } catch (err) {
        setError('Impossible de charger l\'historique des conversations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const loadConversation = (conversationId: string) => {
    navigate(`/assessment/${conversationId}`);
  };

  const deleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette conversation ?')) {
      try {
        await axios.delete(`/api/conversations/${conversationId}`);
        setConversations(conversations.filter(conv => conv._id !== conversationId));
      } catch (err) {
        setError('Erreur lors de la suppression de la conversation');
        console.error(err);
      }
    }
  };

  const exportConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      const response = await axios.get(`/api/conversations/${conversationId}/export`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${conversationId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors de l\'exportation de la conversation');
      console.error(err);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(conversations.map(conv => conv._id));
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Supprimer ${selectedIds.length} conversations sélectionnées ?`)) return;

    try {
      await Promise.all(
        selectedIds.map(id => axios.delete(`/api/conversations/${id}`))
      );
      setConversations(prev => prev.filter(conv => !selectedIds.includes(conv._id)));
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      setError('Erreur lors de la suppression multiple');
      console.error(err);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP à HH:mm');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Historique des conversations</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-12">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Historique des conversations</h1>

        {conversations.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-gray-500">Aucune conversation trouvée</p>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="flex justify-between items-center px-6 py-3 bg-gray-50">
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:underline"
              >
                {selectAll ? 'Désélectionner tout' : 'Tout sélectionner'}
              </button>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="text-sm text-red-600 hover:underline"
                >
                  Supprimer la sélection ({selectedIds.length})
                </button>
              )}
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3"><input type="checkbox" checked={selectAll} onChange={handleSelectAll} /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Norme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Créé le</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modifié</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conversations.map(conversation => (
                  <tr key={conversation._id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(conversation._id)}
                        onChange={() => handleSelect(conversation._id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-6 py-4" onClick={() => loadConversation(conversation._id)}>
                      {conversation.norme.toUpperCase()}
                    </td>
                    <td className="px-6 py-4" onClick={() => loadConversation(conversation._id)}>
                      {formatDate(conversation.created_at)}
                    </td>
                    <td className="px-6 py-4" onClick={() => loadConversation(conversation._id)}>
                      {formatDate(conversation.last_updated)}
                    </td>
                    <td className="px-6 py-4" onClick={() => loadConversation(conversation._id)}>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(conversation.status)}`}>
                        {conversation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={() => loadConversation(conversation._id)}>
                      {conversation.final_score ? `${conversation.final_score}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => exportConversation(conversation._id, e)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Exporter
                      </button>
                      <button
                        onClick={(e) => deleteConversation(conversation._id, e)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Nouvelle évaluation
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistory;
