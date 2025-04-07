"use client";

import { axiosApi } from "./authService";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  isRead: boolean;
}

export const notificationService = {
  getAll: async (): Promise<Notification[]> => {
    const response = await axiosApi<Notification[]>("/notifications");
    return Array.isArray(response) ? response : [];
  },

  create: async (title: string, description: string): Promise<{ message: string; notification: Notification }> => {
    return axiosApi<{ message: string; notification: Notification }>(
      "/notifications",
      "POST",
      { title, description }
    );
  },

  markAsRead: async (notificationId: string): Promise<{ message: string; notification: Notification }> => {
    return axiosApi<{ message: string; notification: Notification }>(
      `/notifications/${notificationId}`,
      "PATCH",
      { isRead: true }
    );
  }
};
