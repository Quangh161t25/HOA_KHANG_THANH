import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyReconcileItem {
  id: string; // date_flowerId
  date: string; // YYYY-MM-DD
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  unit: string;
  openingStock: number; // Tồn đầu ngày
  orderQuantity: number; // Tổng khách đặt trong ngày
  importQuantity: number; // Tổng thực tế nhập từ NCC trong ngày
  remainingQuantity: number; // Số lượng hoa còn lại (Người dùng nhập vào để kiểm đếm)
  difference: number; // Chênh lệch = (Tồn đầu + Nhập) - (Đơn hàng + Hoa còn lại)
  status: 'matched' | 'excess' | 'shortage'; // matched: Khớp đơn, excess: Thừa nhập (+), shortage: Thiếu nhập (-)
  notes?: string;
}

interface DailyStockReconcileState {
  records: Record<string, DailyReconcileItem[]>; // Key là ngày YYYY-MM-DD
  setRemainingQuantity: (
    date: string,
    flowerId: string,
    quantity: number,
    flowerInfo?: { flowerCode?: string; flowerName?: string; unit?: string; orderQuantity?: number; importQuantity?: number; openingStock?: number },
  ) => void;
  setOpeningStock: (date: string, flowerId: string, opening: number) => void;
  setNotes: (date: string, flowerId: string, notes: string) => void;
  saveDailyItems: (date: string, items: DailyReconcileItem[]) => void;
  deleteItem: (date: string, flowerId: string) => void;
  clearDate: (date: string) => void;
}

export function computeReconcileStatus(opening: number, imported: number, ordered: number, remaining: number): {
  difference: number;
  status: 'matched' | 'excess' | 'shortage';
} {
  // Lượng hoa cung ứng (Tồn đầu + Nhập) so với Lượng hoa phân bổ (Đơn hàng giao khách + Hoa còn lại trong kho)
  const difference = (opening + imported) - (ordered + remaining);
  if (difference === 0) {
    return { difference: 0, status: 'matched' };
  } else if (difference > 0) {
    return { difference, status: 'excess' }; // Thừa nhập / Dư hoa
  } else {
    return { difference, status: 'shortage' }; // Thiếu nhập / Thiếu hoa giao đơn
  }
}

export const useDailyStockReconcileStore = create<DailyStockReconcileState>()(
  persist(
    (set) => ({
      records: {},

      setRemainingQuantity: (date, flowerId, quantity, flowerInfo) =>
        set((state) => {
          const dayItems = state.records[date] || [];
          const existingIndex = dayItems.findIndex((it) => it.flowerId === flowerId);

          let updatedItems: DailyReconcileItem[];
          if (existingIndex >= 0) {
            const current = dayItems[existingIndex];
            const { difference, status } = computeReconcileStatus(
              current.openingStock || 0,
              current.importQuantity || 0,
              current.orderQuantity || 0,
              quantity,
            );
            const updated = {
              ...current,
              remainingQuantity: quantity,
              difference,
              status,
            };
            updatedItems = [...dayItems];
            updatedItems[existingIndex] = updated;
          } else {
            const opening = flowerInfo?.openingStock || 0;
            const imported = flowerInfo?.importQuantity || 0;
            const ordered = flowerInfo?.orderQuantity || 0;
            const { difference, status } = computeReconcileStatus(opening, imported, ordered, quantity);
            const newItem: DailyReconcileItem = {
              id: `${date}_${flowerId}`,
              date,
              flowerId,
              flowerCode: flowerInfo?.flowerCode || '',
              flowerName: flowerInfo?.flowerName || '',
              unit: flowerInfo?.unit || 'cành',
              openingStock: opening,
              orderQuantity: ordered,
              importQuantity: imported,
              remainingQuantity: quantity,
              difference,
              status,
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

      setOpeningStock: (date, flowerId, opening) =>
        set((state) => {
          const dayItems = state.records[date] || [];
          const existingIndex = dayItems.findIndex((it) => it.flowerId === flowerId);
          if (existingIndex < 0) return state;

          const current = dayItems[existingIndex];
          const { difference, status } = computeReconcileStatus(
            opening,
            current.importQuantity || 0,
            current.orderQuantity || 0,
            current.remainingQuantity || 0,
          );

          const updated = {
            ...current,
            openingStock: opening,
            difference,
            status,
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
