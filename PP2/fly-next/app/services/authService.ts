"use client";

import axios from "axios";
import axiosClient from "../../lib/axiosClient";
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  TokenData,
  User,
} from "../types/auth";

// Export the axiosApi function so it can be used by other services.
export async function axiosApi<T>(
  endpoint: string,
  method: string = "GET",
  data?: unknown
): Promise<T> {
  try {
    const response = await axiosClient.request<T>({
      url: `${endpoint}`,
      method,
      data: data as T | undefined,
    });
    return response.data;
  } catch (error: any) {
    console.error(`API request failed for endpoint ${endpoint}`, error);
    // Check directly for the isAxiosError property on the error object.
    if ((error as any).isAxiosError) {
      const backendMessage =
        error.response?.data?.message || error.response?.data?.error;
      if (backendMessage) {
        throw new Error(backendMessage);
      }
    }
    throw error;
  }
}

export const authService = {
  // Log in a user with the provided credentials and store tokens.
  login: async (
    credentials: LoginCredentials
  ): Promise<AuthResponse> => {
    // Call the endpoint and expect an AuthResponse object directly.
    const result = await axiosApi<AuthResponse>(
      "/auth/login",
      "POST",
      credentials
    );
    if (result.accessToken && result.refreshToken) {
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      return result;
    } else {
      throw new Error("Login failed: Invalid response structure");
    }
  },  

  // Register a new user using the provided registration data.
  // Expects a backend response of { message: string, user: User }.
  register: async (userData: RegisterData): Promise<void> => {
    try {
      const result = await axiosApi<{ message: string; user: User }>(
        "/auth/signup",
        "POST",
        userData
      );
      // Check that the user was created.
      if (!result.user) {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Log out the current user by clearing stored tokens.
  logout: (): void => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  // Refresh the access token using the stored refresh token.
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }
    const tokenData: TokenData = {
      accessToken: localStorage.getItem("accessToken") || "",
      refreshToken,
    };
    const result = await axiosApi<{ success: boolean; message: string; data: AuthResponse }>(
      "/auth/refresh",
      "POST",
      tokenData
    );
    if (result.success && result.data) {
      localStorage.setItem("accessToken", result.data.accessToken);
      localStorage.setItem("refreshToken", result.data.refreshToken);
      return result.data;
    } else {
      authService.logout();
      throw new Error(result.message || "Token refresh failed");
    }
  },

  // Retrieve the current user's profile.
  getCurrentUser: async (): Promise<User> => {
    const result = await axiosApi<{ user: User, message: string }>(
      "/user",
      "GET"
    );
    if (result.user) {
      return result.user;
    } else {
      throw new Error(result.message || "Failed to retrieve user data");
    }
  },

  // Update the current user's profile.
  updateUser: async (
    userId: string,
    userData: Partial<User>
  ): Promise<User> => {
    const result = await axiosApi<{ success: boolean; message: string; data: User }>(
      `/${userId}`,
      "PUT",
      userData
    );
    if (result.success && result.data) {
      return result.data;
    } else {
      throw new Error(result.message || "Failed to update user profile");
    }
  },

  // Check whether the user is authenticated (based on token presence).
  isAuthenticated: (): boolean => {
    if (!localStorage.getItem("accessToken")) {
      return false;
    }
    return true;
  },

  // Validate tokens with the backend and update them if needed.
  validateTokens: async (): Promise<AuthResponse> => {
    const accessToken = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (!accessToken || !refreshToken) {
      throw new Error("No tokens available");
    }
    const tokenData: TokenData = { accessToken, refreshToken };
    const result = await axiosApi<{ success: boolean; message: string; data: AuthResponse }>(
      "/validateTokens",
      "POST",
      tokenData
    );
    if (result.success && result.data) {
      localStorage.setItem("accessToken", result.data.accessToken);
      localStorage.setItem("refreshToken", result.data.refreshToken);
      return result.data;
    } else {
      throw new Error(result.message || "Token validation failed");
    }
  },
};
