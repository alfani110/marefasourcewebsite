import React from 'react';
import { Message } from '@/lib/api';
import MarefaLogo from './MarefaLogo';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  if (message.sender === 'ai') {
    return (
      <div className="group relative">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <MarefaLogo className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-grow prose prose-sm dark:prose-invert">
            <div dangerouslySetInnerHTML={{ __html: formatContent(message.content) }} />
            
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 mt-4">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="p-3 bg-accent hover:bg-primary hover:text-primary-foreground transition-colors 
                               rounded-lg text-left text-sm border border-border"
                    onClick={() => {
                      if (suggestion.onClick) suggestion.onClick();
                    }}
                  >
                    {suggestion.icon && <SuggestionIcon name={suggestion.icon} className="inline-block mr-2" />}
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="group relative">
        <div className="flex items-start justify-end">
          <div className="flex-grow max-w-3xl">
            <div className="bg-primary/10 p-4 rounded-xl ml-auto text-foreground">
              <p>{message.content}</p>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
              <span className="font-semibold text-sm">
                {message.username ? message.username.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// Helper function to format message content with markdown-like syntax
const formatContent = (content: string): string => {
  // Convert markdown-style headers
  content = content.replace(/^### (.*$)/gm, '<h4 class="font-bold mb-2 text-primary">$1</h4>');
  content = content.replace(/^## (.*$)/gm, '<h3 class="font-bold mb-2 text-primary text-lg">$1</h3>');
  content = content.replace(/^# (.*$)/gm, '<h2 class="font-bold mb-3 text-primary text-xl">$1</h2>');
  
  // Convert lists
  content = content.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  content = content.replace(/^- (.*$)/gm, '<li>$1</li>');
  
  // Simplify list handling - convert ordered lists
  if (content.includes('<li>')) {
    // Check if it contains a numbered list
    if (content.includes('1. ')) {
      content = '<ol class="list-decimal pl-5 mb-4 space-y-1">' + content + '</ol>';
    } else {
      content = '<ul class="list-disc pl-5 mb-4 space-y-1">' + content + '</ul>';
    }
  }
  
  // Convert paragraphs (double newlines)
  content = content.replace(/\n\n/gm, '</p><p class="mb-4">');
  
  // Bold and italic
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Wrap content in paragraph tag
  content = `<p class="mb-4">${content}</p>`;
  
  return content;
};

const SuggestionIcon: React.FC<{ name: string, className?: string }> = ({ name, className }) => {
  switch(name) {
    case 'book-open':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
        </svg>
      );
    case 'heart':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>
      );
    case 'search':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.3-4.3"></path>
        </svg>
      );
    default:
      return null;
  }
};

export default ChatMessage;
