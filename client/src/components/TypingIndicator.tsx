import React from 'react';
import MarefaLogo from './MarefaLogo';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex mb-8">
      <div className="flex-shrink-0 mr-4">
        <div className="w-10 h-10 rounded-full bg-islamic-green flex items-center justify-center text-white">
          <MarefaLogo className="w-10 h-10 rounded-full" />
        </div>
      </div>
      <div className="flex-grow">
        <div className="chat-bubble-ai bg-dark-card p-4 text-light-text shadow-md">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
