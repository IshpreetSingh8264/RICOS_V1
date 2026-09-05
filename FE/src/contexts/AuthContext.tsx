import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, groupsAPI, newsAPI, isTokenExpired, decodeToken } from '@/lib/api';
import type { UserType } from '@/lib/api';

interface User {
  email: string;
  name?: string;
  organization?: string;
  phone?: string;
  role?: string;
  isProfileComplete: boolean;
  accountType?: string;
  responderType?: string;
  needsProfileCompletion?: boolean;
  userType: UserType;
  userId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  checkProfileCompletion: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('ricos_token');
    const storedUser = localStorage.getItem('ricos_user');

    if (storedToken && !isTokenExpired(storedToken)) {
      setToken(storedToken);
      
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          // Clear invalid data
          localStorage.removeItem('ricos_user');
          localStorage.removeItem('ricos_token');
          localStorage.removeItem('ricos_user_type');
        }
      }
    } else {
      // Token expired or doesn't exist, clear everything
      localStorage.removeItem('ricos_token');
      localStorage.removeItem('ricos_user');
      localStorage.removeItem('ricos_user_type');
    }
  }, []);

  // Save user and token to localStorage whenever they change
  useEffect(() => {
    if (user && token) {
      localStorage.setItem('ricos_user', JSON.stringify(user));
      localStorage.setItem('ricos_token', token);
      localStorage.setItem('ricos_user_type', user.userType);
    } else {
      localStorage.removeItem('ricos_user');
      localStorage.removeItem('ricos_token');
      localStorage.removeItem('ricos_user_type');
    }
  }, [user, token]);

  const checkProfileCompletion = (): boolean => {
    if (!user) return false;
    return !!(user.name && user.organization && user.phone && user.role);
  };

  const prefetchNewsInBackground = (accessToken: string) => {
    void newsAPI.getDisasterNews(accessToken).catch((error) => {
      console.error('Background news prefetch failed:', error);
    });
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Group login only for dedicated group identifiers, not normal emails with underscores
      const normalizedEmail = email.trim();
      const isGroupLogin =
        normalizedEmail.includes('@groups.ricos.com') ||
        (!normalizedEmail.includes('@') && normalizedEmail.includes('_'));
      
      let response: any;
      
      if (isGroupLogin) {
        // Use group signin endpoint
        response = await groupsAPI.signin({ username: email, password });
      } else {
        // Use regular user signin endpoint
        response = await authAPI.signin({ email, password });
      }
      
      // Decode the token to get user information
      const tokenPayload = decodeToken(response.access_token);
      
      if (!tokenPayload) {
        throw new Error('Invalid token received');
      }

      // Create user object from token payload (includes full_name now)
      const userData: User = {
        email: tokenPayload.email || email,
        userId: tokenPayload.sub,
        userType: response.user_type,
        accountType: response.user_type,
        role: response.user_type,
        name: tokenPayload.full_name || response.group_name || email, // Get name from JWT token or group name
        isProfileComplete: true,
        needsProfileCompletion: false,
      };

      // Store the token and user data
      setToken(response.access_token);
      setUser(userData);
      prefetchNewsInBackground(response.access_token);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ricos_user');
    localStorage.removeItem('ricos_token');
    localStorage.removeItem('ricos_user_type');
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      ...data,
    };

    // Check if profile is complete
    updatedUser.isProfileComplete = !!(
      updatedUser.name &&
      updatedUser.organization &&
      updatedUser.phone &&
      updatedUser.role
    );

    setUser(updatedUser);
    
    // Also update the user-specific storage
    localStorage.setItem(`ricos_user_${user.email}`, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        updateProfile,
        checkProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
