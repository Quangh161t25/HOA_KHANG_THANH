import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyStockItem {
  id: string; // date_flowerId
  date: string; // YYYY-MM-DD
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  unit: string;
  openingStock: number; // Tồn đầu (tự động nhận từ Tồn cuối ngày hôm trước)
  dailyExport: number; // Xuất ngày (lấy từ Đơn hàng theo ngày)
  closingStock: number; // Tồn cuối (người dùng nhập vào)
  calculatedImport: number; // Nhập (tìm ra nhập = Tồn cuối + Xuất ngày - Tồn đầu)
  actualImportFromNCC: number; // Thực tế nhập từ NCC trong ngày (nếu có đơn nhập NCC)
  notes?: string;
  isOpeningCustom?: boolean; // Đánh dấu nếu người dùng tự sửa tồn đầu thủ công
}

interface DailyStockReconcileState {
  records: Record<string, DailyStockItem[]>; // Key là ngày YYYY-MM-DD

  // Người dùng nhập/sửa số lượng Tồn cuối
  setClosingStock: (
    dateYMD: string,
    flowerId: string,
    closingStock: number,
    flowerInfo?: {
      flowerCode?: string;
      flowerName?: string;
      unit?: string;
      dailyExport?: number;
      openingStock?: number;
      actualImportFromNCC?: number;
    },
  ) => void;

  // Điều chỉnh tồn đầu thủ công cho một ngày
  setOpeningStock: (dateYMD: string, flowerId: string, openingStock: number) => void;

  // Ghi chú đối soát
  setNotes: (dateYMD: string, flowerId: string, notes: string) => void;

  // Thêm mặt hàng hoa vào một ngày
  addFlowerToDate: (dateYMD: string, item: DailyStockItem) => void;

  // Xóa mặt hàng khỏi ngày
  deleteItem: (dateYMD: string, flowerId: string) => void;

  // Xóa toàn bộ dữ liệu ngày
  clearDate: (dateYMD: string) => void;
}

// Chuẩn hóa chuỗi ngày sang định dạng chuẩn YYYY-MM-DD
export function normalizeDateToYMD(dStr?: string): string {
  if (!dStr) return '';
  const trimmed = dStr.trim();
  if (!trimmed) return '';
  if (trimmed.includes('T')) return trimmed.split('T')[0];
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      const p0 = parts[0].trim();
      const p1 = parts[1].trim();
      const p2 = parts[2].trim();
      if (p0.length === 4) {
        return `${p0}-${p1.padStart(2, '0')}-${p2.padStart(2, '0')}`;
      }
      return `${p2}-${p1.padStart(2, '0')}-${p0.padStart(2, '0')}`;
    }
  }
  return trimmed;
}

// Chuyển YYYY-MM-DD sang định dạng hiển thị tiếng Việt DD/MM/YYYY
export function formatYMDToDisplay(ymdStr: string): string {
  if (!ymdStr) return '';
  const normalized = normalizeDateToYMD(ymdStr);
  const parts = normalized.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return ymdStr;
}

// Tìm Tồn cuối của ngày hôm trước (hoặc ngày gần nhất trước ngày hiện tại)
export function getPreviousClosingStock(
  records: Record<string, DailyStockItem[]>,
  currentDateYMD: string,
  flowerIdOrCode: string,
): number | undefined {
  const normCurrent = normalizeDateToYMD(currentDateYMD);
  const pastDates = Object.keys(records)
    .map(normalizeDateToYMD)
    .filter((d) => d < normCurrent)
    .sort((a, b) => b.localeCompare(a)); // Ngày mới nhất trong quá khứ đứng đầu

  for (const prevDate of pastDates) {
    const items = records[prevDate];
    const prevItem = items?.find(
      (i) =>
        i.flowerId === flowerIdOrCode ||
        (i.flowerCode && i.flowerCode.trim().toLowerCase() === flowerIdOrCode.trim().toLowerCase()),
    );
    if (prevItem && prevItem.closingStock !== undefined && prevItem.closingStock !== null) {
      return prevItem.closingStock;
    }
  }

  return undefined;
}

export const useDailyStockReconcileStore = create<DailyStockReconcileState>()(
  persist(
    (set) => ({
      records: {},

      setClosingStock: (dateYMD, flowerId, closingStock, flowerInfo) =>
        set((state) => {
          const normDate = normalizeDateToYMD(dateYMD);
          const dayItems = state.records[normDate] || [];
          const existingIndex = dayItems.findIndex((it) => it.flowerId === flowerId);

          const closing = Math.max(0, closingStock || 0);

          let updatedItems: DailyStockItem[];
          if (existingIndex >= 0) {
            const current = dayItems[existingIndex];
            if (current.closingStock === closing) {
              return state; // Không thay đổi thì giữ nguyên, tránh re-render và ghi localStorage thừa
            }
            const opening = current.openingStock || 0;
            const exportQty = current.dailyExport || 0;
            const calcImport = Math.max(0, closing + exportQty - opening);

            const updated: DailyStockItem = {
              ...current,
              closingStock: closing,
              calculatedImport: calcImport,
            };
            updatedItems = [...dayItems];
            updatedItems[existingIndex] = updated;
          } else {
            const opening =
              flowerInfo?.openingStock ??
              getPreviousClosingStock(state.records, normDate, flowerId) ??
              0;
            const exportQty = flowerInfo?.dailyExport || 0;
            const calcImport = Math.max(0, closing + exportQty - opening);

            const newItem: DailyStockItem = {
              id: `${normDate}_${flowerId}`,
              date: normDate,
              flowerId,
              flowerCode: flowerInfo?.flowerCode || '',
              flowerName: flowerInfo?.flowerName || '',
              unit: flowerInfo?.unit || 'cành',
              openingStock: opening,
              dailyExport: exportQty,
              closingStock: closing,
              calculatedImport: calcImport,
              actualImportFromNCC: flowerInfo?.actualImportFromNCC || 0,
            };
            updatedItems = [...dayItems, newItem];
          }

          return {
            records: {
              ...state.records,
              [normDate]: updatedItems,
            },
          };
        }),

      setOpeningStock: (dateYMD, flowerId, openingStock) =>
        set((state) => {
          const normDate = normalizeDateToYMD(dateYMD);
          const dayItems = state.records[normDate] || [];
          const existingIndex = dayItems.findIndex((it) => it.flowerId === flowerId);
          if (existingIndex < 0) return state;

          const current = dayItems[existingIndex];
          const opening = Math.max(0, openingStock || 0);
          if (current.openingStock === opening && current.isOpeningCustom) {
            return state;
          }
          const calcImport = Math.max(0, current.closingStock + current.dailyExport - opening);

          const updated: DailyStockItem = {
            ...current,
            openingStock: opening,
            calculatedImport: calcImport,
            isOpeningCustom: true,
          };
          const updatedItems = [...dayItems];
          updatedItems[existingIndex] = updated;

          return {
            records: {
              ...state.records,
              [normDate]: updatedItems,
            },
          };
        }),

      setNotes: (dateYMD, flowerId, notes) =>
        set((state) => {
          const normDate = normalizeDateToYMD(dateYMD);
          const dayItems = state.records[normDate] || [];
          const existingIndex = dayItems.findIndex((it) => it.flowerId === flowerId);
          if (existingIndex < 0) return state;

          const updatedItems = [...dayItems];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            notes,
          };

          return {
            records: {
              ...state.records,
              [normDate]: updatedItems,
            },
          };
        }),

      addFlowerToDate: (dateYMD, item) =>
        set((state) => {
          const normDate = normalizeDateToYMD(dateYMD);
          const dayItems = state.records[normDate] || [];
          const exists = dayItems.some((i) => i.flowerId === item.flowerId);
          if (exists) return state;
          return {
            records: {
              ...state.records,
              [normDate]: [...dayItems, item],
            },
          };
        }),

      deleteItem: (dateYMD, flowerId) =>
        set((state) => {
          const normDate = normalizeDateToYMD(dateYMD);
          const dayItems = state.records[normDate] || [];
          return {
            records: {
              ...state.records,
              [normDate]: dayItems.filter((i) => i.flowerId !== flowerId),
            },
          };
        }),

      clearDate: (dateYMD) =>
        set((state) => {
          const normDate = normalizeDateToYMD(dateYMD);
          const copy = { ...state.records };
          delete copy[normDate];
          return { records: copy };
        }),
    }),
    {
      name: 'hkt-daily-stock-reconcile-storage',
    },
  ),
);
