"use client";

import React, { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { authService } from "../services/authService";
import { User, LoginCredentials, RegisterData } from "../types/auth";
import axios from "axios";

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the current user profile if authenticated.
  const loadUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authService.isAuthenticated()) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  // Login action: authenticate and load user profile.
  const login = async (credentials: LoginCredentials) => {
    try {
      await authService.login(credentials);
      await loadUser();
    } catch (error) { 
      throw error;
    }
  };

  // Logout action: clear tokens and user data.
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // Register action: create a new user.
  // After a successful registration, the UI should redirect to sign in.
  const register = async (data: RegisterData) => {
    try {
      await authService.register(data);
      
    } catch (error) {
      throw error;
    }
  };

  // Refresh token action: update tokens if possible.
  const refreshToken = async () => {
    try {
      await authService.refreshToken();
    } catch (error) {
      logout();
    }
  };

  // Refresh user data action: fetch user data using access token.
  const refreshUser = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) return;

      interface UserResponse {
        user: User;
      }

      const response = await axios.get<UserResponse>("/api/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUser(response.data.user);
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        register,
        refreshToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using authentication context.
export const useAuth = (): AuthContextData => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
