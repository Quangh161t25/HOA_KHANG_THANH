import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  checkGoogleSheetsConnection,
  pullFromGoogleSheets,
  syncAllToGoogleSheets,
  type GoogleSheetsStatus,
} from '@/lib/googleSheetsService';
import {
  useCashStore,
  useDebtStore,
  useInventoryStore,
  useEmployeeStore,
  useSupplierOrderStore,
  useDistributorStore,
  useFlowerStore,
  useOrderStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import { toast } from 'sonner';

export interface SyncLogEntry {
  id: string;
  time: string;
  type: 'push' | 'pull' | 'check';
  status: 'success' | 'error';
  message: string;
}

interface GoogleSheetsState {
  isConnected: boolean;
  isChecking: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  autoSync: boolean;
  sheetInfo: GoogleSheetsStatus | null;
  syncLogs: SyncLogEntry[];

  // Actions
  checkStatus: () => Promise<void>;
  syncToSheets: (isBackground?: boolean) => Promise<boolean>;
  pullFromSheets: () => Promise<boolean>;
  setAutoSync: (enabled: boolean) => void;
  clearLogs: () => void;
}

export const useGoogleSheetsStore = create<GoogleSheetsState>()(
  persist(
    (set, get) => ({
      isConnected: false, // Set only after a successful connection check or sync
      isChecking: false,
      isSyncing: false,
      lastSyncTime: null,
      autoSync: true, // Auto-sync enabled by default
      sheetInfo: null,
      syncLogs: [],

      checkStatus: async () => {
        set({ isChecking: true });
        try {
          const info = await checkGoogleSheetsConnection();
          set({
            isConnected: info.connected,
            sheetInfo: info,
            isChecking: false,
          });
        } catch {
          set({ isChecking: false });
        }
      },

      syncToSheets: async (isBackground = false) => {
        if (get().isSyncing) return false;
        set({ isSyncing: true });

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');

        try {
          const result = await syncAllToGoogleSheets();
          if (result.success) {
            set((state) => ({
              isSyncing: false,
              isConnected: true,
              lastSyncTime: timeStr,
              syncLogs: [
                {
                  id: `log-${Date.now()}`,
                  time: timeStr,
                  type: 'push',
                  status: 'success',
                  message: `Đã đồng bộ ${result.updatedSheetsCount || 11} sheets (${result.totalUpdatedCells || 0} ô dữ liệu) lên Google Sheets`,
                },
                ...state.syncLogs.slice(0, 49),
              ],
            }));
            if (!isBackground) {
              toast.success('Đã đồng bộ toàn bộ dữ liệu lên Google Sheets thành công!');
            }
            return true;
          } else {
            set((state) => ({
              isSyncing: false,
              syncLogs: [
                {
                  id: `log-${Date.now()}`,
                  time: timeStr,
                  type: 'push',
                  status: 'error',
                  message: result.error || 'Lỗi khi đồng bộ lên Google Sheets',
                },
                ...state.syncLogs.slice(0, 49),
              ],
            }));
            {
              toast.error(`Đồng bộ thất bại: ${result.error}`);
            }
            return false;
          }
        } catch (err: any) {
          set((state) => ({
            isSyncing: false,
            syncLogs: [
              {
                id: `log-${Date.now()}`,
                time: timeStr,
                type: 'push',
                status: 'error',
                message: err?.message || 'Lỗi kết nối khi đồng bộ',
              },
              ...state.syncLogs.slice(0, 49),
            ],
          }));
          {
            toast.error(`Lỗi: ${err?.message}`);
          }
          return false;
        }
      },

      pullFromSheets: async () => {
        if (get().isSyncing) return false;
        set({ isSyncing: true });

        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN');

        try {
          const result = await pullFromGoogleSheets();
          if (result.success) {
            set((state) => ({
              isSyncing: false,
              isConnected: true,
              lastSyncTime: timeStr,
              syncLogs: [
                {
                  id: `log-${Date.now()}`,
                  time: timeStr,
                  type: 'pull',
                  status: 'success',
                  message: result.message,
                },
                ...state.syncLogs.slice(0, 49),
              ],
            }));
            toast.success(result.message);
            return true;
          } else {
            set((state) => ({
              isSyncing: false,
              syncLogs: [
                {
                  id: `log-${Date.now()}`,
                  time: timeStr,
                  type: 'pull',
                  status: 'error',
                  message: result.message,
                },
                ...state.syncLogs.slice(0, 49),
              ],
            }));
            toast.error(result.message);
            return false;
          }
        } catch (err: any) {
          set({ isSyncing: false });
          toast.error(`Lỗi tải dữ liệu: ${err?.message}`);
          return false;
        }
      },

      setAutoSync: (enabled) => set({ autoSync: enabled }),
      clearLogs: () => set({ syncLogs: [] }),
    }),
    {
      name: 'hkt-google-sheets-storage',
      partialize: (state) => ({
        autoSync: state.autoSync,
        lastSyncTime: state.lastSyncTime,
        syncLogs: state.syncLogs.slice(0, 20),
      }),
    }
  )
);

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let isInitialized = false;
let applyingRemoteData = false;
let initialPullDone = false;

/**
 * Tự động đồng bộ lên Google Sheets mỗi khi có thay đổi dữ liệu đơn hàng, hoa, NPP, NCC, thu chi
 */
export function initGoogleSheetsAutoSync() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  const handleStoreChange = () => {
    if (applyingRemoteData) return;
    // Google Sheets là chuẩn: chưa tải xong dữ liệu từ Sheets thì KHÔNG đẩy dữ liệu cũ trên web lên
    // (tránh làm sống lại các dòng vừa xóa trên Sheets).
    if (!initialPullDone) return;
    const { autoSync, syncToSheets, isSyncing } = useGoogleSheetsStore.getState();
    if (!autoSync) return;
    if (isSyncing) {
      if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
      syncDebounceTimer = setTimeout(handleStoreChange, 2000);
      return;
    }

    if (syncDebounceTimer) {
      clearTimeout(syncDebounceTimer);
    }

    // Debounce 2 giây để gom các thao tác liên tiếp
    syncDebounceTimer = setTimeout(() => {
      if (useGoogleSheetsStore.getState().autoSync) syncToSheets(true);
    }, 2000);
  };

  _startSubscriptions(handleStoreChange);

  // Mở web: tải dữ liệu từ Google Sheets TRƯỚC (Sheets là chuẩn), tải xong mới cho phép tự đẩy lên.
  // Tải lỗi (mất mạng...) thì thử lại sau 30 giây, trong lúc đó không đẩy dữ liệu cũ lên.
  const refreshFromSheets = async () => {
    const { autoSync, pullFromSheets } = useGoogleSheetsStore.getState();
    if (!autoSync) {
      initialPullDone = true;
      return;
    }
    applyingRemoteData = true;
    let ok = false;
    try {
      ok = Boolean(await pullFromSheets());
    } catch {
      ok = false;
    } finally {
      applyingRemoteData = false;
    }
    if (ok) initialPullDone = true;
    else window.setTimeout(() => void refreshFromSheets(), 30000);
  };

  void refreshFromSheets();
}

function _startSubscriptions(handleStoreChange: () => void) {
  useOrderStore.subscribe(handleStoreChange);
  useFlowerStore.subscribe(handleStoreChange);
  useDistributorStore.subscribe(handleStoreChange);
  useSupplierStore.subscribe(handleStoreChange);
  useCashStore.subscribe(handleStoreChange);
  useDebtStore.subscribe(handleStoreChange);
  useInventoryStore.subscribe(handleStoreChange);
  useEmployeeStore.subscribe(handleStoreChange);
  useSupplierOrderStore.subscribe(handleStoreChange);
  // Lịch sử thao tác chỉ lưu trên web → thay đổi lịch sử không cần đẩy lên Google Sheets
}

