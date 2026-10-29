import { create } from 'zustand';

export type ColumnAlign = 'left' | 'center' | 'right';

export interface ColumnDef {
  id: string;
  label: string;
  visible: boolean;
  minWidth?: number;
  maxWidth?: number;
  width?: number;
  order: number;
  align?: ColumnAlign;
  wrap?: boolean;
  pinned?: boolean;
}

export type SortDirection = 'asc' | 'desc' | null;
export interface SortState {
  column: string | null;
  direction: SortDirection;
}

export const MAX_COLUMN_WIDTH = 400;

export interface ListState<F> {
  searchTerm: string;
  filters: F;
  pagination: { page: number; pageSize: number };
  sort: SortState;
  selectedIds: Set<string>;
  columns: ColumnDef[];
  setSearchTerm: (term: string) => void;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  resetFilters: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  toggleSelection: (id: string) => void;
  toggleAllSelection: (ids: string[]) => void;
  clearSelection: () => void;
  toggleColumn: (id: string) => void;
  reorderColumns: (from: number, to: number) => void;
  resizeColumn: (id: string, width: number) => void;
  resetColumns: () => void;
  setSort: (column: string | null, direction: SortDirection) => void;
  resetState: () => void;
}

/** Tạo store cho một trang danh sách (giống hàm tạo store dùng chung của bản gốc). */
export type ColumnInput = Omit<ColumnDef, 'order'> & { order?: number };

export function createListStore<F extends object>(initialFilters: F, initialColumns: ColumnInput[]) {
  const baseColumns = (): ColumnDef[] => initialColumns.map((c, i) => ({ ...c, order: c.order ?? i }));
  return create<ListState<F>>((set) => ({
    searchTerm: '',
    filters: initialFilters,
    pagination: { page: 1, pageSize: 20 },
    sort: { column: null, direction: null },
    selectedIds: new Set(),
    columns: baseColumns(),
    setSearchTerm: (searchTerm) => set((s) => ({ searchTerm, pagination: { page: 1, pageSize: s.pagination.pageSize } })),
    setFilter: (key, value) => set((s) => ({ filters: { ...s.filters, [key]: value }, pagination: { ...s.pagination, page: 1 } })),
    resetFilters: () => set((s) => ({ filters: initialFilters, pagination: { ...s.pagination, page: 1 } })),
    setPage: (page) => set((s) => ({ pagination: { ...s.pagination, page } })),
    setPageSize: (pageSize) => set((s) => ({ pagination: { ...s.pagination, pageSize, page: 1 } })),
    toggleSelection: (id) =>
      set((s) => {
        const next = new Set(s.selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return { selectedIds: next };
      }),
    toggleAllSelection: (ids) =>
      set((s) => {
        const allSelected = ids.every((id) => s.selectedIds.has(id));
        const next = new Set(s.selectedIds);
        ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
        return { selectedIds: next };
      }),
    clearSelection: () => set({ selectedIds: new Set() }),
    toggleColumn: (id) => set((s) => ({ columns: s.columns.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)) })),
    reorderColumns: (from, to) =>
      set((s) => {
        const sorted = [...s.columns].sort((a, b) => a.order - b.order);
        const [moved] = sorted.splice(from, 1);
        sorted.splice(to, 0, moved);
        return { columns: sorted.map((c, i) => ({ ...c, order: i })) };
      }),
    resizeColumn: (id, width) =>
      set((s) => ({
        columns: s.columns.map((c) =>
          c.id !== id ? c : { ...c, width: Math.min(Math.max(width, c.minWidth ?? 50), c.maxWidth ?? MAX_COLUMN_WIDTH) },
        ),
      })),
    resetColumns: () => set({ columns: baseColumns() }),
    setSort: (column, direction) => set({ sort: { column, direction } }),
    resetState: () =>
      set({
        searchTerm: '',
        filters: initialFilters,
        pagination: { page: 1, pageSize: 20 },
        sort: { column: null, direction: null },
        selectedIds: new Set(),
        columns: baseColumns(),
      }),
  }));
}

/** Lọc dữ liệu theo từ khóa + bộ lọc bằng hàm so khớp của từng trang. */
export function filterItems<T, F>(items: T[], search: string, filters: F, match: (item: T, search: string, filters: F) => boolean) {
  return items.filter((item) => match(item, search, filters));
}
