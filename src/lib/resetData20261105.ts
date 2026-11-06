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

// Restore sync once for installations affected by the owner's reset.
// Do not change the reset key or clear any newly entered business records.
const syncRepairKey = 'hkt-sync-restored-2026-11-06-v1';
if (typeof window !== 'undefined' && localStorage.getItem(syncRepairKey) !== 'done') {
  const key = 'hkt-google-sheets-storage';
  const saved = JSON.parse(localStorage.getItem(key) || '{"state":{},"version":0}');
  saved.state = { ...saved.state, autoSync: true };
  localStorage.setItem(key, JSON.stringify(saved));
  localStorage.setItem(syncRepairKey, 'done');
}


// Xóa sạch các giá trị ảo cũ ('Đa sắc', 'Đà Lạt', tồn kho 100, 200) khỏi danh sách hoa
const flowerMockCleanKey = 'hkt-clean-flower-mocks-2026-11-06-v3';
if (typeof window !== 'undefined' && localStorage.getItem(flowerMockCleanKey) !== 'done') {
  try {
    const raw = localStorage.getItem('hkt-flowers-storage');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.state?.flowers)) {
        parsed.state.flowers = parsed.state.flowers.map((f) => ({
          ...f,
          color: (f.color === 'Đa sắc' ? '' : (f.color || '')),
          origin: (f.origin === 'Đà Lạt' ? '' : (f.origin || '')),
          stock: ((f.stock === 100 || f.stock === 200) ? 0 : (f.stock || 0)),
          category: (f.category === 'Khác' ? '' : (f.category || '')),
        }));
        localStorage.setItem('hkt-flowers-storage', JSON.stringify(parsed));
      }
    }
  } catch (err) {
    console.error('Error cleaning flower mocks:', err);
  }
  localStorage.setItem(flowerMockCleanKey, 'done');
}
