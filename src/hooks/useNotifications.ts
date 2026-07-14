import { useEffect, useCallback, useRef } from 'react';
import { create } from 'zustand';
import { api } from '../lib/api';

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'PAYOUT' | 'CHALLENGE' | 'KYC' | 'TRADE' | 'AFFILIATE';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  mockMode: boolean;
}

const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  loading: false,
  error: null,
  mockMode: false,
  setNotifications: (notifications) => set({ notifications, loading: false, error: null }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [notification, ...state.notifications] })),
}));

export function useNotifications() {
  const { notifications, loading, error, setNotifications, mockMode } = useNotificationStore.getState();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.get<Notification[]>('/notifications');
      setNotifications(data);
    } catch {
      useNotificationStore.setState({ mockMode: true, loading: false });
    }
  }, [setNotifications]);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
    } catch {
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
      }));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    } catch {
      useNotificationStore.setState((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      }));
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return { notifications, unreadCount, loading, error, mockMode, markAsRead, markAllAsRead };
}
