import './lib/resetData20261105';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { initGoogleSheetsAutoSync } from './stores/googleSheetsStore';
import { waitForHydration } from './lib/idbStorage';
import {
  useCashStore,
  useDebtStore,
  useDistributorStore,
  useEmployeeStore,
  useFixedExpenseStore,
  useFlowerStore,
  useInventoryStore,
  useOrderStore,
  useSupplierOrderStore,
  useSupplierStore,
  syncAllOrdersToDebtRecords,
  recalcAllDistributorsDebts,
  recalcAllSuppliersDebts,
} from './stores/hoaKhangThanhStore';
import { useOrderLogStore } from './stores/orderLogStore';
import { useModuleAuditStore } from './stores/moduleAuditStore';
import { useDailyStockReconcileStore } from './stores/dailyStockReconcileStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

async function bootstrap() {
  // Dữ liệu lưu trong IndexedDB được nạp bất đồng bộ: chờ nạp xong rồi mới hiển thị
  // và bật đồng bộ Google Sheets, tránh đẩy dữ liệu rỗng lên Sheets.
  const hydrated = await waitForHydration([
    useFlowerStore,
    useSupplierStore,
    useDistributorStore,
    useOrderStore,
    useInventoryStore,
    useEmployeeStore,
    useCashStore,
    useDebtStore,
    useFixedExpenseStore,
    useSupplierOrderStore,
    useOrderLogStore,
    useModuleAuditStore,
    useDailyStockReconcileStore,
  ]);

  if (hydrated) {
    // Tự động kiểm tra và đồng bộ đơn hàng sang sổ công nợ: đơn hàng có đơn thì công nợ có dữ liệu
    syncAllOrdersToDebtRecords();
    recalcAllDistributorsDebts();
    recalcAllSuppliersDebts();

    initGoogleSheetsAutoSync();
  } else {
    console.error('[bootstrap] Nạp dữ liệu IndexedDB quá lâu, tạm tắt tự đồng bộ Google Sheets cho phiên này');
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" richColors closeButton />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void bootstrap();
