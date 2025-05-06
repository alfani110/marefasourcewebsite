import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  remainingMessages?: number;
  subscriptionTier?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  disabled = false,
  remainingMessages,
  subscriptionTier = 'free'
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      
      // Reset height after sending
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      <form className="relative flex flex-col w-full rounded-xl border shadow-sm border-border bg-background" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="w-full px-4 pt-3 pb-10 bg-background text-foreground border-none
                     rounded-t-xl focus:outline-none focus:ring-0
                     resize-none min-h-[50px] max-h-[200px]"
          placeholder="Message Mārefa Source..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={disabled}
        />
        
        {/* Action buttons row */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-2">
          <div className="flex items-center space-x-2">
            {/* Attach button */}
            <button 
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              aria-label="Attach file"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
              </svg>
            </button>
            
            {/* Mic/voice button */}
            <button 
              type="button"
              className="p-1 text-muted-foreground hover:text-foreground rounded-md"
              aria-label="Voice input"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" x2="12" y1="19" y2="22"></line>
              </svg>
            </button>
          </div>
          
          {/* Send button */}
          <button
            type="submit"
            className={`p-1.5 rounded-md ${
              !message.trim() || disabled 
                ? 'text-muted-foreground cursor-not-allowed opacity-50' 
                : 'text-primary hover:bg-primary/10 cursor-pointer'
            } transition-colors`}
            disabled={!message.trim() || disabled}
            aria-label="Send message"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
