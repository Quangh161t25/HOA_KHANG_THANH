import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbJSONStorage } from '@/lib/idbStorage';

/**
 * Bản ghi kiểm tồn ngày — CHỈ lưu các cột "thật":
 *  - Mã hoa, Tên hoa
 *  - Tồn cuối (người dùng nhập)
 *  - Tồn đầu chỉ lưu khi người dùng sửa tay (openingStockCustom)
 * Các cột còn lại (Tồn đầu tự động, Xuất ngày, Nhập, Thực nhập NCC, Đối soát) là cột ảo,
 * được tính lại khi hiển thị từ Đơn hàng / Đơn nhập NCC / Tồn cuối hôm trước.
 */
export interface DailyStockRecord {
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  closingStock: number;
  openingStockCustom?: number;
  notes?: string;
}

interface DailyStockReconcileState {
  records: Record<string, DailyStockRecord[]>; // key: YYYY-MM-DD

  setClosingStock: (
    dateYMD: string,
    flowerId: string,
    closingStock: number,
    flowerInfo: { flowerCode: string; flowerName: string },
  ) => void;
  setOpeningStockCustom: (
    dateYMD: string,
    flowerId: string,
    openingStock: number | undefined,
    flowerInfo: { flowerCode: string; flowerName: string },
  ) => void;
  setNotes: (dateYMD: string, flowerId: string, notes: string) => void;
  deleteItem: (dateYMD: string, flowerId: string) => void;
  clearDate: (dateYMD: string) => void;
}

// Chuẩn hóa chuỗi ngày sang định dạng chuẩn YYYY-MM-DD
// Hỗ trợ đọc mọi định dạng: DD/MM/YYYY, D/M/YYYY, DD-MM-YYYY, YYYY-MM-DD, ISO...
export function normalizeDateToYMD(dStr?: string): string {
  if (!dStr) return '';
  const trimmed = dStr.trim();
  if (!trimmed) return '';

  // 1. Khớp ngày Việt Nam: DD/MM/YYYY hoặc D/M/YYYY hoặc DD-MM-YYYY
  let m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s.*)?$/);
  if (m) {
    return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }

  // 2. Khớp ngày chuẩn YYYY-MM-DD hoặc YYYY/MM/DD hoặc ISO có giờ
  m = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
  if (m) {
    return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
  }

  return trimmed;
}

// Chuyển sang định dạng hiển thị dd/mm/yyyy chuẩn Việt Nam
export function formatYMDToDisplay(ymdStr: string): string {
  if (!ymdStr) return '';
  const normalized = normalizeDateToYMD(ymdStr);
  const parts = normalized.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return ymdStr;
}

type DayUpdater = (items: DailyStockRecord[]) => DailyStockRecord[] | null;

function updateDay(
  records: Record<string, DailyStockRecord[]>,
  dateYMD: string,
  updater: DayUpdater,
): Record<string, DailyStockRecord[]> | null {
  const normDate = normalizeDateToYMD(dateYMD);
  const next = updater(records[normDate] || []);
  if (!next) return null;
  const copy = { ...records };
  if (next.length === 0) delete copy[normDate];
  else copy[normDate] = next;
  return copy;
}

/** Bản ghi không còn dữ liệu thật nào thì bỏ đi cho nhẹ */
function isEmptyRecord(r: DailyStockRecord) {
  return !r.closingStock && r.openingStockCustom === undefined && !r.notes;
}

function upsert(
  items: DailyStockRecord[],
  flowerId: string,
  flowerInfo: { flowerCode: string; flowerName: string } | undefined,
  patch: (current: DailyStockRecord) => DailyStockRecord,
): DailyStockRecord[] | null {
  const idx = items.findIndex((it) => it.flowerId === flowerId);
  const base: DailyStockRecord =
    idx >= 0
      ? items[idx]
      : {
          flowerId,
          flowerCode: flowerInfo?.flowerCode || '',
          flowerName: flowerInfo?.flowerName || '',
          closingStock: 0,
        };
  const updated = patch(base);
  if (idx >= 0 && JSON.stringify(updated) === JSON.stringify(base)) return null;

  const next = [...items];
  if (isEmptyRecord(updated)) {
    if (idx < 0) return null;
    next.splice(idx, 1);
  } else if (idx >= 0) {
    next[idx] = updated;
  } else {
    next.push(updated);
  }
  return next;
}

export const useDailyStockReconcileStore = create<DailyStockReconcileState>()(
  persist(
    (set) => ({
      records: {},

      setClosingStock: (dateYMD, flowerId, closingStock, flowerInfo) =>
        set((state) => {
          const closing = Math.max(0, closingStock || 0);
          const records = updateDay(state.records, dateYMD, (items) =>
            upsert(items, flowerId, flowerInfo, (cur) => ({
              ...cur,
              flowerCode: flowerInfo.flowerCode || cur.flowerCode,
              flowerName: flowerInfo.flowerName || cur.flowerName,
              closingStock: closing,
            })),
          );
          return records ? { records } : state;
        }),

      setOpeningStockCustom: (dateYMD, flowerId, openingStock, flowerInfo) =>
        set((state) => {
          const records = updateDay(state.records, dateYMD, (items) =>
            upsert(items, flowerId, flowerInfo, (cur) => {
              const next = { ...cur };
              if (openingStock === undefined) delete next.openingStockCustom;
              else next.openingStockCustom = Math.max(0, openingStock || 0);
              return next;
            }),
          );
          return records ? { records } : state;
        }),

      setNotes: (dateYMD, flowerId, notes) =>
        set((state) => {
          const records = updateDay(state.records, dateYMD, (items) =>
            upsert(items, flowerId, undefined, (cur) => ({ ...cur, notes })),
          );
          return records ? { records } : state;
        }),

      deleteItem: (dateYMD, flowerId) =>
        set((state) => {
          const records = updateDay(state.records, dateYMD, (items) =>
            items.some((i) => i.flowerId === flowerId) ? items.filter((i) => i.flowerId !== flowerId) : null,
          );
          return records ? { records } : state;
        }),

      clearDate: (dateYMD) =>
        set((state) => {
          const copy = { ...state.records };
          delete copy[normalizeDateToYMD(dateYMD)];
          return { records: copy };
        }),
    }),
    {
      name: 'hkt-daily-stock-reconcile-storage',
      storage: idbJSONStorage,
      version: 1,
      // v0 lưu kèm các cột ảo (tồn đầu, xuất ngày, nhập, NCC...) → chỉ giữ lại cột thật
      migrate: (persisted, version) => {
        const state = (persisted || {}) as { records?: Record<string, any[]> };
        if (version >= 1) return state as DailyStockReconcileState;
        const records: Record<string, DailyStockRecord[]> = {};
        Object.entries(state.records || {}).forEach(([date, items]) => {
          const ymd = normalizeDateToYMD(date);
          if (!ymd) return;
          const slim: DailyStockRecord[] = (items || [])
            .map((it) => {
              const r: DailyStockRecord = {
                flowerId: it.flowerId,
                flowerCode: it.flowerCode || '',
                flowerName: it.flowerName || '',
                closingStock: Number(it.closingStock) || 0,
              };
              if (it.isOpeningCustom) r.openingStockCustom = Number(it.openingStock) || 0;
              if (it.notes) r.notes = it.notes;
              return r;
            })
            .filter((r) => r.flowerId && !isEmptyRecord(r));
          if (slim.length) records[ymd] = [...(records[ymd] || []), ...slim];
        });
        return { records } as DailyStockReconcileState;
      },
    },
  ),
);
