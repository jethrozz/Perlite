import React, { createContext, useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { UserLoginCredentials, UserRegisterData } from '@shared/schema';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  isCreator: boolean;
  bio?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: UserLoginCredentials) => Promise<void>;
  register: (userData: UserRegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Check for existing session
  const { isLoading } = useQuery({
    queryKey: ['/api/auth/session'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          return data;
        } else {
          setUser(null);
          return null;
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setUser(null);
        return null;
      }
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: UserLoginCredentials) => {
      const res = await apiRequest('POST', '/api/auth/login', credentials);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.fullName}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Login Failed',
        description: error.message || 'Unable to login. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: UserRegisterData) => {
      const res = await apiRequest('POST', '/api/auth/register', userData);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data);
      toast({
        title: 'Registration Successful',
        description: `Welcome, ${data.fullName}!`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.message || 'Unable to register. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/auth/logout', {});
      return res.json();
    },
    onSuccess: () => {
      setUser(null);
      toast({
        title: 'Logout Successful',
        description: 'You have been logged out.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Logout Failed',
        description: error.message || 'Unable to logout. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Login function
  const login = async (credentials: UserLoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  // Register function
  const register = async (userData: UserRegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  // Logout function
  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
