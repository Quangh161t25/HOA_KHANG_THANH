import { resolveRelativeDates } from './format';

const DEFAULT_DELAY = 500;
const STORAGE_PREFIX = 'lnk-hcns:';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface GetAllOptions<T> {
  orderBy?: keyof T & string;
  ascending?: boolean;
  offset?: number;
  limit?: number;
}

/**
 * Bảng dữ liệu mẫu (giống MockService của bản gốc) nhưng lưu xuống localStorage,
 * nên thêm/sửa/xóa vẫn còn sau khi tải lại trang.
 */
export class MockTable<T extends { id: string }> {
  private data: T[];
  private readonly key: string;
  private readonly delayMs: number;

  constructor(name: string, seed: T[], options?: { delay?: number }) {
    this.key = STORAGE_PREFIX + name;
    this.delayMs = options?.delay ?? DEFAULT_DELAY;
    this.data = this.load() ?? resolveRelativeDates(JSON.parse(JSON.stringify(seed)) as T[]);
  }

  private load(): T[] | null {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.data));
    } catch {
      // Hết dung lượng hoặc bị chặn: vẫn chạy được với dữ liệu trong bộ nhớ.
    }
  }

  async getAll(options?: GetAllOptions<T>): Promise<T[]> {
    await wait(this.delayMs);
    let rows = [...this.data];
    if (options?.orderBy) {
      const col = options.orderBy;
      const asc = options.ascending !== false;
      rows = rows.sort((a, b) => {
        const x = a[col] as unknown;
        const y = b[col] as unknown;
        if (x === y) return 0;
        if (x == null) return asc ? 1 : -1;
        if (y == null) return asc ? -1 : 1;
        if (typeof x === 'string' && typeof y === 'string') return asc ? x.localeCompare(y) : y.localeCompare(x);
        return asc ? ((x as number) < (y as number) ? -1 : 1) : (y as number) < (x as number) ? -1 : 1;
      });
    }
    const offset = options?.offset ?? 0;
    if (options?.limit != null) rows = rows.slice(offset, offset + options.limit);
    else if (offset > 0) rows = rows.slice(offset);
    return rows;
  }

  async getById(id: string): Promise<T | null> {
    await wait(this.delayMs);
    const row = this.data.find((r) => r.id === id);
    return row ? { ...row } : null;
  }

  async insert(row: Omit<T, 'id'> & { id?: string }): Promise<T> {
    await wait(this.delayMs);
    const id = row.id ?? `mock-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const created = { ...row, id } as T;
    this.data = [...this.data, created];
    this.persist();
    return { ...created };
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    await wait(this.delayMs);
    const idx = this.data.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Not found');
    const updated = { ...this.data[idx], ...patch, id } as T;
    this.data = [...this.data.slice(0, idx), updated, ...this.data.slice(idx + 1)];
    this.persist();
    return { ...updated };
  }

  async remove(ids: string[]): Promise<void> {
    await wait(this.delayMs);
    const set = new Set(ids);
    this.data = this.data.filter((r) => !set.has(r.id));
    this.persist();
  }
}

export function createMockTable<T extends { id: string }>(name: string, seed: T[], delay?: number) {
  return new MockTable<T>(name, seed, { delay });
}
