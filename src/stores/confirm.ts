import type { ReactNode } from 'react';
import { create } from 'zustand';

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  variant?: 'danger' | 'warning' | 'info' | 'default';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => unknown | Promise<unknown>;
  onCancel?: () => void;
}

const defaults: ConfirmOptions = {
  title: 'Xác nhận',
  message: '',
  variant: 'default',
  confirmText: 'Xác nhận',
  cancelText: 'Hủy bỏ',
  onConfirm: () => {},
};

interface ConfirmState {
  isOpen: boolean;
  isLoading: boolean;
  options: ConfirmOptions;
  confirm: (options: ConfirmOptions) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  isOpen: false,
  isLoading: false,
  options: defaults,
  confirm: (options) => set({ isOpen: true, options: { ...defaults, ...options } }),
  close: () => set({ isOpen: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));

export const useConfirm = () => useConfirmStore((s) => s.confirm);
