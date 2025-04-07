import axios from "axios";
import { toast } from "sonner";

// Create axios instance with a request ID
const axiosClient = axios.create({
  baseURL: "/api", // Use relative path that will be proxied
  withCredentials: true,
});

// Add request interceptor to include authentication token
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  
  // Include current user ID in request to avoid caching issues between accounts
  const userId = localStorage.getItem("userId");
  
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Add response interceptor for better error handling and authentication
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle specific error cases
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401) {
        toast.error("Your session has expired. Please sign in again.");
      } else if (status === 403) {
        toast.error("You don't have permission to access this resource");
      } else if (status >= 500) {
        toast.error("Server error. Please try again later.");
      }
      
      console.error("Response error:", status);
    } else if (error.request) {
      // The request was made but no response was received
      toast.error("No response from server. Please check your connection.");
      console.error("Request error: No response received");
    } else {
      // Something happened in setting up the request that triggered an Error
      toast.error("An error occurred. Please try again.");
      console.error("Error:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;
