import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
export function normalizeText(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
}

/** Dò năm từ chuỗi ngày dạng YYYY-MM-DD, DD/MM/YYYY hoặc YYYY. */
export function extractYear(value?: string | null): number | null {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  const iso = v.match(/^(\d{4})-/);
  if (iso) return parseInt(iso[1], 10);
  const vn = v.match(/\/(\d{4})$/);
  if (vn) return parseInt(vn[1], 10);
  return /^\d{4}$/.test(v) ? parseInt(v, 10) : null;
}

export function genId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}
