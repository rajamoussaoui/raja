// app/types/conversation.ts
export interface Conversation {
  _id: string;
  norme: string;
  description: string;
  created_at: string;
  last_updated: string;
  status: 'in_progress' | 'completed';
  final_score?: number;
}