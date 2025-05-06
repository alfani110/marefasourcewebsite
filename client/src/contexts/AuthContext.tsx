import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  subscriptionTier: 'free' | 'basic' | 'research' | 'teams';
  messageCount: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  isPricingModalOpen: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  showAuthModal: () => void;
  hideAuthModal: () => void;
  showPricingModal: () => void;
  hidePricingModal: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAuthModalOpen: false,
  isPricingModalOpen: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  showAuthModal: () => {},
  hideAuthModal: () => {},
  showPricingModal: () => {},
  hidePricingModal: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest('GET', '/api/auth/me');
      const data = await response.json();
      setUser(data);
      return data;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      setUser(data);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.username}!`,
      });
      // Invalidate any cached queries that might contain user data
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, username: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', { email, password, username });
      const data = await response.json();
      setUser(data);
      toast({
        title: "Registration successful",
        description: `Welcome to Mārefa Source, ${data.username}!`,
      });
      // Invalidate any cached queries that might contain user data
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
      // Invalidate any cached queries that might contain user data
      queryClient.invalidateQueries();
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const showAuthModal = () => setIsAuthModalOpen(true);
  const hideAuthModal = () => setIsAuthModalOpen(false);
  const showPricingModal = () => setIsPricingModalOpen(true);
  const hidePricingModal = () => setIsPricingModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAuthModalOpen,
        isPricingModalOpen,
        login,
        register,
        logout,
        showAuthModal,
        hideAuthModal,
        showPricingModal,
        hidePricingModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
