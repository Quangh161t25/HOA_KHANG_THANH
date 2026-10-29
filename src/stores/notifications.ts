import { create } from 'zustand';
import seed from '@/data/notifications.json';
import { resolveRelativeDates } from '@/lib/format';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

interface NotificationState {
  notifications: AppNotification[];
  remove: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: resolveRelativeDates(seed as AppNotification[]),
  remove: (id) => set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
  markAsRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllAsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  clearAll: () => set({ notifications: [] }),
}));
