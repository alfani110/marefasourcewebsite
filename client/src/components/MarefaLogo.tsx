import React from 'react';

interface MarefaLogoProps {
  className?: string;
  showText?: boolean;
  theme?: 'light' | 'dark';
}

const MarefaLogo: React.FC<MarefaLogoProps> = ({ 
  className = "h-12", 
  showText = false, 
  theme = 'dark' 
}) => {
  // Use the actual PNG logo image 
  return (
    <div className={`${className} flex flex-col items-center`}>
      <img 
        src="/images/logo-white.png" 
        alt="Mārefa Source Logo" 
        className="h-full w-auto"
      />
      {showText && (
        <div className="mt-2 text-center text-lg font-bold tracking-wider">
          MĀREFA SOURCE
        </div>
      )}
    </div>
  );
};

export default MarefaLogo;
