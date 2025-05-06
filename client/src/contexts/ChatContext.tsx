import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Message, ChatSession } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface ChatContextType {
  messages: Message[];
  chats: ChatSession[];
  activeChat: ChatSession | null;
  isLoading: boolean;
  selectedCategory: 'ahkam' | 'sukoon' | 'research';
  sendMessage: (content: string) => void;
  startNewChat: () => void;
  setCategory: (category: 'ahkam' | 'sukoon' | 'research') => void;
  remainingMessages: number;
  subscriptionTier: string;
}

const ChatContext = createContext<ChatContextType>({
  messages: [],
  chats: [],
  activeChat: null,
  isLoading: false,
  selectedCategory: 'ahkam',
  sendMessage: () => {},
  startNewChat: () => {},
  setCategory: () => {},
  remainingMessages: 50,
  subscriptionTier: 'free',
});

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'ahkam' | 'sukoon' | 'research'>('ahkam');
  const { user } = useAuth();
  const { toast } = useToast();
  
  const remainingMessages = user 
    ? (user.subscriptionTier === 'free' ? 50 - user.messageCount : Infinity) 
    : 50; // Guest users get 5 free messages before signup
  
  const subscriptionTier = user?.subscriptionTier || 'free';

  // Fetch user's chat history
  const fetchChats = useCallback(async () => {
    if (!user) {
      setChats([]);
      return;
    }
    
    try {
      const response = await apiRequest('GET', '/api/chats');
      const data = await response.json();
      setChats(data);
      
      // If there are chats and no active chat, set the most recent one
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0]);
        
        // Also load messages for this chat
        const messagesResponse = await apiRequest('GET', `/api/chats/${data[0].id}/messages`);
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setChats([]);
    }
  }, [user, activeChat]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  
  const startNewChat = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/chats', { category: selectedCategory });
      const newChat = await response.json();
      
      setActiveChat(newChat);
      setMessages([]);
      
      // Refresh chats list
      fetchChats();
      
      // Add welcome message based on category
      let welcomeMessage: Message = {
        id: 0,
        chatId: newChat.id,
        content: "As-Salaam-Alaykum. What can I help you find today?",
        sender: 'ai',
        createdAt: new Date().toISOString(),
      };
      
      if (selectedCategory === 'ahkam') {
        welcomeMessage.content += " You're in Ahkam 101 mode, where I can answer questions about Islamic rulings and practices.";
      } else if (selectedCategory === 'sukoon') {
        welcomeMessage.content += " You're in Sukoon mode, where I can provide Islamic-based guidance for emotional and mental wellbeing.";
      } else if (selectedCategory === 'research') {
        welcomeMessage.content += " You're in Research mode, where I can search through our scholarly database to provide detailed answers with citations.";
      }
      
      setMessages([welcomeMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create a new chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, fetchChats, toast]);
  
  const setCategory = (category: 'ahkam' | 'sukoon' | 'research') => {
    setSelectedCategory(category);
    
    // If we have an active chat, we should switch its category
    if (activeChat) {
      apiRequest('PATCH', `/api/chats/${activeChat.id}`, { category })
        .then(response => response.json())
        .then(updatedChat => {
          setActiveChat(updatedChat);
          // Also add a transition message
          const transitionMessage: Message = {
            id: Date.now(),
            chatId: activeChat.id,
            content: `You've switched to ${category} mode. How can I assist you?`,
            sender: 'ai',
            createdAt: new Date().toISOString(),
          };
          setMessages(prevMessages => [...prevMessages, transitionMessage]);
        })
        .catch(error => {
          console.error('Error updating chat category:', error);
        });
    }
  };

  const sendMessage = async (content: string) => {
    // Create new chat if there's no active chat
    if (!activeChat) {
      await startNewChat();
    }
    
    // Add user message to the state immediately for UI response
    const userMessage: Message = {
      id: Date.now(),
      chatId: activeChat?.id || 0,
      content,
      sender: 'user',
      username: user?.username,
      createdAt: new Date().toISOString(),
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Check message quota for free tier
    if (user?.subscriptionTier === 'free' && user.messageCount >= 50) {
      toast({
        title: "Message Limit Reached",
        description: "You've reached your free tier message limit. Please upgrade to continue.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Send message to the server
      const response = await apiRequest('POST', `/api/chats/${activeChat?.id}/messages`, {
        content,
        category: selectedCategory
      });
      
      const aiResponse = await response.json();
      
      // Add AI response to the state
      setMessages(prevMessages => [...prevMessages, aiResponse]);
      
      // If this is the first message and the chat doesn't have a title, update it
      if (activeChat && !activeChat.title && messages.length <= 1) {
        // Generate title from the first user message
        const titleResponse = await apiRequest('PATCH', `/api/chats/${activeChat.id}`, {
          title: content.length > 30 ? content.substring(0, 30) + '...' : content
        });
        
        const updatedChat = await titleResponse.json();
        setActiveChat(updatedChat);
        
        // Refresh chats list to show the new title
        fetchChats();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        chats,
        activeChat,
        isLoading,
        selectedCategory,
        sendMessage,
        startNewChat,
        setCategory,
        remainingMessages,
        subscriptionTier,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
