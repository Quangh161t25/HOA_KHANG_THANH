import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyStockItem {
  id: string; // date_flowerId
  date: string; // YYYY-MM-DD
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  unit: string;
  openingStock: number; // Tồn đầu (lấy từ Tồn cuối hôm trước)
  dailyExport: number; // Xuất ngày (lấy từ đơn hàng theo ngày)
  closingStock: number; // Tồn cuối (người dùng nhập vào)
  calculatedImport: number; // Nhập = Tồn cuối + Xuất ngày - Tồn đầu
  actualImportFromNCC: number; // Thực tế nhập từ NCC trong ngày (nếu có đơn nhập)
  notes?: string;
  isOpeningCustom?: boolean; // Người dùng tự sửa tồn đầu thủ công
}

interface DailyStockReconcileState {
  records: Record<string, DailyStockItem[]>; // Key là ngày YYYY-MM-DD

  // Cập nhật số lượng Tồn cuối (người dùng nhập vào ô tồn cuối)
  setClosingStock: (
    date: string,
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

  // Điều chỉnh tồn đầu thủ công (nếu ngày đầu tiên chưa có tồn cuối hôm trước)
  setOpeningStock: (date: string, flowerId: string, openingStock: number) => void;

  setNotes: (date: string, flowerId: string, notes: string) => void;
  saveDailyItems: (date: string, items: DailyStockItem[]) => void;
  deleteItem: (date: string, flowerId: string) => void;
  clearDate: (date: string) => void;
}

// Tìm Tồn cuối của ngày hôm trước (hoặc ngày gần nhất trước ngày hiện tại)
export function getPreviousClosingStock(
  records: Record<string, DailyStockItem[]>,
  currentDate: string,
  flowerId: string,
): number | undefined {
  // 1. Kiểm tra ngày hôm qua chính xác (D - 1)
  const prevDate = new Date(currentDate);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = prevDate.toISOString().split('T')[0];

  const yesterdayItems = records[prevDateStr];
  if (yesterdayItems && yesterdayItems.length > 0) {
    const it = yesterdayItems.find(
      (i) => i.flowerId === flowerId || (i.flowerCode && i.flowerCode.toLowerCase() === flowerId.toLowerCase()),
    );
    if (it && it.closingStock !== undefined && it.closingStock !== null) {
      return it.closingStock;
    }
  }

  // 2. Tìm ngày ghi nhận gần nhất trước ngày hiện tại (nếu có ngày nghỉ/cuối tuần)
  const pastDates = Object.keys(records)
    .filter((d) => d < currentDate)
    .sort((a, b) => b.localeCompare(a));

  for (const d of pastDates) {
    const items = records[d];
    const it = items?.find(
      (i) => i.flowerId === flowerId || (i.flowerCode && i.flowerCode.toLowerCase() === flowerId.toLowerCase()),
    );
    if (it && it.closingStock !== undefined && it.closingStock !== null) {
      return it.closingStock;
    }
  }

  return undefined;
}

export const useDailyStockReconcileStore = create<DailyStockReconcileState>()(
  persist(
    (set) => ({
      records: {},

      setClosingStock: (date, flowerId, closingStock, flowerInfo) =>
        set((state) => {
          const dayItems = state.records[date] || [];
          const existingIndex = dayItems.findIndex((it) => it.flowerId === flowerId);

          const closing = Math.max(0, closingStock || 0);

          let updatedItems: DailyStockItem[];
          if (existingIndex >= 0) {
            const current = dayItems[existingIndex];
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
              getPreviousClosingStock(state.records, date, flowerId) ??
              0;
            const exportQty = flowerInfo?.dailyExport || 0;
            const calcImport = Math.max(0, closing + exportQty - opening);

            const newItem: DailyStockItem = {
              id: `${date}_${flowerId}`,
              date,
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
              [date]: updatedItems,
            },
          };
        }),

      setOpeningStock: (date, flowerId, openingStock) =>
        set((state) => {
          const dayItems = state.records[date] || [];
          const existingIndex = dayItems.findIndex((it) => it.flowerId === flowerId);
          if (existingIndex < 0) return state;

          const current = dayItems[existingIndex];
          const opening = Math.max(0, openingStock || 0);
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
              [date]: updatedItems,
            },
          };
        }),

      setNotes: (date, flowerId, notes) =>
        set((state) => {
          const dayItems = state.records[date] || [];
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
              [date]: updatedItems,
            },
          };
        }),

      saveDailyItems: (date, items) =>
        set((state) => ({
          records: {
            ...state.records,
            [date]: items,
          },
        })),

      deleteItem: (date, flowerId) =>
        set((state) => {
          const dayItems = state.records[date] || [];
          return {
            records: {
              ...state.records,
              [date]: dayItems.filter((i) => i.flowerId !== flowerId),
            },
          };
        }),

      clearDate: (date) =>
        set((state) => {
          const copy = { ...state.records };
          delete copy[date];
          return { records: copy };
        }),
    }),
    {
      name: 'hkt-daily-stock-reconcile-storage',
    },
  ),
);
