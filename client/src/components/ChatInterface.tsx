import React, { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import CategorySelector from './CategorySelector';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import MarefaLogo from './MarefaLogo';
import { Button } from '@/components/ui/button';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/contexts/ThemeContext';

const ChatInterface: React.FC = () => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    selectedCategory, 
    remainingMessages,
    subscriptionTier
  } = useChat();
  const { user, showAuthModal } = useAuth();
  const { theme } = useTheme();

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    if (!user && messages.filter(m => m.sender === 'user').length >= 5) {
      toast({
        title: "Free Message Limit Reached",
        description: "Please sign up to continue chatting.",
        variant: "destructive",
      });
      return;
    }
    
    sendMessage(content);
  };

  const getSuggestions = () => [
    { id: 1, icon: "book-open", text: "Explain the pillars of Salah" },
    { id: 2, icon: "heart", text: "Help with managing stress as a Muslim" },
    { id: 3, icon: "search", text: "Research on early Islamic scholars" }
  ];

  return (
    <div className="flex flex-col h-full relative">
      <CategorySelector />
      
      {/* Chat messages area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto py-4 px-4 md:px-8" 
        id="chat-messages"
      >
        <div className="max-w-3xl mx-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-8 w-full max-w-2xl px-4">
                <div className="text-center mb-8">
                  <div className="mx-auto w-32 h-32 mb-4">
                    <MarefaLogo className="w-full h-full" showText={true} />
                  </div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">Salaam Alaykum</h1>
                  <p className="text-xl text-foreground">Welcome to Mārefa Source AI</p>
                  <p className="text-muted-foreground mt-2">Spreading mārefa one drop at a time</p>
                  <p className="text-muted-foreground mt-1">What can I help you with today?</p>
                  <p className="text-xs text-muted-foreground mt-4">
                    This chat won't appear in history or be used to train our models. For safety purposes, we may keep a copy of this chat for up to 30 days.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                  {getSuggestions().map(suggestion => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSendMessage(suggestion.text)}
                      className="flex items-start p-4 bg-accent hover:bg-primary/10 transition-colors 
                                 rounded-xl text-left text-sm border border-border"
                    >
                      <div className="mr-3 mt-0.5 text-primary">
                        <SuggestionIcon name={suggestion.icon} className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{suggestion.text}</p>
                      </div>
                    </button>
                  ))}
                </div>
                
                {!user && (
                  <div className="mt-8 text-center">
                    <div className="bg-accent p-6 rounded-xl mb-6 max-w-md mx-auto">
                      <p className="font-medium text-foreground mb-4">Sign up to save history and get more benefits</p>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => showAuthModal()}
                        >
                          Log in
                        </Button>
                        <Button 
                          variant="default"
                          onClick={() => showAuthModal()}
                        >
                          Sign up for free
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
            </div>
          )}
          
          {isLoading && <TypingIndicator />}
        </div>
      </div>

      {/* Message input box */}
      <div className="border-t border-border py-4 px-4 md:px-8">
        <div className="max-w-3xl mx-auto">
          <MessageInput 
            onSendMessage={handleSendMessage}
            remainingMessages={remainingMessages}
            subscriptionTier={subscriptionTier}
            disabled={isLoading} 
          />
          
          <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
            <div>
              {!user && remainingMessages !== undefined && (
                <span>Free tier: {remainingMessages} messages remaining</span>
              )}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              <span>By messaging Mārefa Source, you agree to our <a href="#" className="underline">Terms</a> and have read our <a href="#" className="underline">Privacy Policy</a>.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuggestionIcon: React.FC<{ name: string, className?: string }> = ({ name, className }) => {
  switch(name) {
    case 'book-open':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      );
    case 'heart':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>
      );
    case 'search':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      );
    default:
      return null;
  }
};

export default ChatInterface;
