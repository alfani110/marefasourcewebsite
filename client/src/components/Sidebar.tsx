import React from 'react';
import { Link, useLocation } from 'wouter';
import MarefaLogo from './MarefaLogo';
import { useChat } from '@/hooks/use-chat';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Crown, Settings, LogOut } from 'lucide-react';

const Sidebar: React.FC = () => {
  const [location, navigate] = useLocation();
  const { chats, startNewChat, activeChat } = useChat();
  const { user, logout, isAuthenticated, showAuthModal, showPricingModal } = useAuth();
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex flex-col items-center mb-4">
        <div className="flex items-center mb-2">
          <MarefaLogo className="h-10 w-10 mr-2" />
          <h1 className="text-lg font-semibold text-foreground">Mārefa Source</h1>
        </div>
        
        <Button 
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md flex items-center justify-center"
          onClick={startNewChat}
          variant="default"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      <div className="overflow-y-auto flex-grow px-2">
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground px-3 py-2">Recent Chats</h3>
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li 
                key={chat.id} 
                className={`rounded-md transition-colors ${chat.id === activeChat?.id ? 'bg-secondary' : 'hover:bg-secondary/50'}`}
              >
                <Link 
                  href={`/chat/${chat.id}`} 
                  className="px-3 py-2 flex items-center text-sm text-foreground"
                >
                  <MessageSquare className="w-4 h-4 mr-2 text-primary" />
                  <span className="truncate">{chat.title || 'New Conversation'}</span>
                </Link>
              </li>
            ))}
            {chats.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground italic">
                No conversations yet
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="p-3 border-t border-border mt-auto">
        <div className="flex items-center mb-4">
          {isAuthenticated ? (
            <>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-2">
                <span className="text-xs font-bold">{user?.username?.substring(0, 2).toUpperCase() || 'MS'}</span>
              </div>
              <div className="truncate">
                <p className="text-sm text-foreground truncate">{user?.email || user?.username}</p>
                <p className="text-xs text-muted-foreground">
                  {user?.subscriptionTier === 'free' && `Free Plan (${user?.messageCount || 0}/50 messages)`}
                  {user?.subscriptionTier === 'basic' && 'Basic Plan'}
                  {user?.subscriptionTier === 'research' && 'Research Plan'}
                  {user?.subscriptionTier === 'teams' && 'Teams Plan'}
                </p>
              </div>
            </>
          ) : (
            <div className="w-full">
              <p className="text-sm text-muted-foreground mb-2">Not logged in</p>
              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  variant="outline"
                  size="sm"
                  onClick={showAuthModal}
                >
                  Log in
                </Button>
                <Button
                  className="flex-1"
                  variant="default"
                  size="sm"
                  onClick={showAuthModal}
                >
                  Sign up
                </Button>
              </div>
            </div>
          )}
        </div>
        {isAuthenticated && (
          <div className="flex space-x-2">
            <Button
              className="flex-1 text-xs"
              variant="outline"
              size="sm"
              onClick={showPricingModal}
            >
              <Crown className="w-3 h-3 mr-1" /> Upgrade
            </Button>
            {user?.role === 'admin' && (
              <Button
                className="text-xs"
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin')}
              >
                Admin
              </Button>
            )}
            <Button
              className="text-xs"
              variant="outline"
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-3 h-3" />
            </Button>
            <Button
              className="text-xs"
              variant="outline"
              size="sm"
              onClick={logout}
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
