import React from 'react';
import Sidebar from './Sidebar';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  return (
    <aside 
      id="mobile-menu" 
      className={`fixed z-30 w-80 bg-dark-surface flex-col border-r border-dark-border h-screen ${isOpen ? 'open' : ''}`}
    >
      <div className="flex justify-between items-center p-4">
        <div className="flex-1">
          {/* Sidebar already has the logo */}
        </div>
        <button 
          id="close-mobile-menu" 
          className="text-light-text-secondary hover:text-light-text"
          onClick={onClose}
        >
          <i className="fas fa-times text-xl"></i>
        </button>
      </div>
      
      <Sidebar />
    </aside>
  );
};

export default MobileSidebar;
