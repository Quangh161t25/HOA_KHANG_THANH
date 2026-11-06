// One-time reset explicitly requested by the owner on 2026-11-06.
// Run once before Zustand hydrates. New entries survive subsequent reloads.
// Pause automatic Sheets writes after the local reset; keep the remote sheet intact.
const resetKey = 'hkt-owner-reset-2026-11-06-v1';
if (typeof window !== 'undefined' && localStorage.getItem(resetKey) !== 'done') {
  const emptyStores: Record<string, string> = {
    'hkt-flowers-storage': 'flowers',
    'hkt-suppliers-storage': 'suppliers',
    'hkt-distributors-storage': 'distributors',
    'hkt-orders-storage': 'orders',
    'hkt-supplier-orders-storage': 'orders',
    'hkt-inventory-storage': 'inventory',
    'hkt-employees-storage': 'employees',
    'hkt-cash-storage': 'transactions',
    'hkt-debt-records-storage': 'records',
    'hkt-fixed-expenses-storage': 'presets',
    'hkt-order-audit-logs-storage': 'logs',
    'hkt-module-audit-storage': 'logs',
  };
  for (const [key, field] of Object.entries(emptyStores)) {
    localStorage.setItem(key, JSON.stringify({ state: { [field]: [] }, version: 0 }));
  }
  localStorage.setItem('hkt-google-sheets-storage', JSON.stringify({ state: { autoSync: false, lastSyncTime: null, syncLogs: [] }, version: 0 }));
  localStorage.setItem('hkt-debts-cleared-clean-v2', 'true');
  localStorage.setItem(resetKey, 'done');
}
