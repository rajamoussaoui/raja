/* eslint-disable react-hooks/exhaustive-deps */
// src/hooks/useChatPersistence.ts
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

type Message = {
  text: string;
  sender: 'user' | 'bot';
};

export default function useChatPersistence() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);

  // Générer/Conserver un ID de conversation dans l'URL
  const conversationId = searchParams.get('conversationId') || Date.now().toString();

  // Charger depuis localStorage au montage
  useEffect(() => {
    const saved = localStorage.getItem(`chat_${conversationId}`);
    if (saved) setMessages(JSON.parse(saved));
    
    // Mettre l'ID dans l'URL si absent
    if (!searchParams.get('conversationId')) {
      searchParams.set('conversationId', conversationId);
      setSearchParams(searchParams);
    }
  }, []);

  // Sauvegarder automatiquement
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`chat_${conversationId}`, JSON.stringify(messages));
    }
  }, [messages]);

  return { messages, setMessages };
}