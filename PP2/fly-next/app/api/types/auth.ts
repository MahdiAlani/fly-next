import jwt from "jsonwebtoken";

export interface LoginRequestBody {
    email: string;
    password: string;
}

// Define the expected shape of the request body.
export interface RefreshRequestBody {
  refreshToken: string;
}

// Extend the JwtPayload type to include our custom property.
export interface CustomJwtPayload extends jwt.JwtPayload {
  userID: string;
}

// Define the expected shape of the signup request body.
export interface SignupRequestBody {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}