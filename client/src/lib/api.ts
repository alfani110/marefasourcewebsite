export interface Message {
  id: number;
  chatId: number;
  content: string;
  sender: 'user' | 'ai';
  username?: string;
  createdAt: string;
  suggestions?: Array<{
    text: string;
    icon?: string;
    onClick?: () => void;
  }>;
}

export interface ChatSession {
  id: number;
  userId?: number;
  title?: string;
  category: 'ahkam' | 'sukoon' | 'research';
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: number;
  title: string;
  author: string;
  category: string;
  description?: string;
  fileUrl: string;
  uploadedById: number;
  createdAt: string;
}
