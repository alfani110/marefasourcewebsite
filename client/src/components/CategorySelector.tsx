import React from 'react';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';

const CategorySelector: React.FC = () => {
  const { selectedCategory, setCategory } = useChat();
  const { user, showPricingModal } = useAuth();
  
  const isResearchLocked = !user || user.subscriptionTier === 'free' || user.subscriptionTier === 'basic';
  
  return (
    <div className="py-2 border-b border-border bg-background flex items-center justify-between px-4 md:px-8">
      <div className="flex space-x-1 overflow-x-auto hide-scrollbar">
        <button 
          className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap flex items-center
                    ${selectedCategory === 'ahkam' 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-secondary text-foreground'}`}
          onClick={() => setCategory('ahkam')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
          <span>Ahkam 101</span>
        </button>
        
        <button 
          className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap flex items-center
                    ${selectedCategory === 'sukoon' 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-secondary text-foreground'}`}
          onClick={() => setCategory('sukoon')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
          </svg>
          <span>Sukoon</span>
        </button>
        
        <button 
          className={`px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap flex items-center
                    ${selectedCategory === 'research' 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-secondary text-foreground'}`}
          onClick={() => isResearchLocked ? showPricingModal() : setCategory('research')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <span>Research Mode</span>
          {isResearchLocked && (
            <span className="ml-1.5 w-3 h-3 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </span>
          )}
        </button>
      </div>
      
      <div className="flex items-center">
        <button className="p-1.5 rounded-md text-foreground hover:bg-secondary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CategorySelector;
