import vi from '@/i18n/vi.json';

const dict = vi as Record<string, string>;

export type TParams = Record<string, string | number | undefined | null>;

/** Tra chuỗi tiếng Việt theo khóa, thay `{{name}}` bằng tham số. Trả lại khóa nếu không có bản dịch. */
export function t(key: string, params?: TParams): string {
  const raw = dict[key] ?? key;
  if (!params) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(params[name] ?? ''));
}

export function useT() {
  return { t };
}

export const LOCALE = 'vi';
