// Credentials used for login.
export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  // Data required for registering a new user.
  export interface RegisterData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phoneNumber: string | null;
  }
  
  // Response returned after a successful login, token refresh, or token validation.
  export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }
  
  // Structure used when sending tokens to the backend.
  export interface TokenData {
    accessToken: string;
    refreshToken: string;
  }
  
  // User profile information.
  export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    profilePic?: string;
  }
  