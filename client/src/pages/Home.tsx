import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import MobileSidebar from '@/components/MobileSidebar';
import ChatInterface from '@/components/ChatInterface';
import AuthModal from '@/components/AuthModal';
import PricingModal from '@/components/PricingModal';
import MarefaLogo from '@/components/MarefaLogo';
import ThemeToggle from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/contexts/ThemeContext';

const Home: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { 
    isAuthModalOpen, 
    isPricingModalOpen, 
    hideAuthModal, 
    hidePricingModal, 
    showAuthModal, 
    user,
    logout
  } = useAuth();
  const isMobile = useMobile();
  const { theme } = useTheme();
  
  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile]);

  return (
    <div className={`flex h-screen overflow-hidden ${theme === "dark" ? "islamic-pattern dark" : "bg-white"}`}>
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-background flex items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          {isMobile && (
            <button 
              className="p-2 rounded-md hover:bg-secondary text-foreground"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          
          {/* Logo */}
          <div className="flex items-center">
            <div className="mr-2">
              <MarefaLogo className="h-8 w-8" />
            </div>
            <h1 className="font-semibold text-foreground">Mārefa Source</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          
          {user ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                {user.email || user.username}
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logout()}
              >
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => showAuthModal()}
              >
                Log in
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => showAuthModal()}
              >
                Sign up
              </Button>
            </div>
          )}
        </div>
      </header>
      
      {/* Sidebar - desktop view */}
      <aside className="hidden md:flex md:w-64 bg-sidebar border-r border-border h-screen flex-col mt-14">
        <Sidebar />
      </aside>

      {/* Mobile menu sidebar - conditionally shown */}
      <MobileSidebar 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
      
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden h-screen bg-background relative mt-14">
        <ChatInterface />
      </main>
      
      {/* Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={hideAuthModal} 
      />
      
      <PricingModal 
        isOpen={isPricingModalOpen} 
        onClose={hidePricingModal} 
      />
    </div>
  );
};

export default Home;
