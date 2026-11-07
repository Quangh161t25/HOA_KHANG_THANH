import { create, type StoreApi } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './auth';

export type AuditModule = 'hoa' | 'ncc' | 'npp' | 'don-hang-ncc' | 'ton-kho' | 'nhan-vien' | 'thu-chi' | 'cong-no';
export const actionLabels = { create: 'Thêm mới', update: 'Chỉnh sửa', delete: 'Xóa', status_change: 'Đổi trạng thái' };
export interface ModuleAuditLog {
  id: string;
  module: AuditModule;
  timestamp: string;
  action: keyof typeof actionLabels;
  record: string;
  performer: string;
  performerCode: string;
  changes: { field: string; before: string; after: string }[];
}

let auditPauseDepth = 0;

/** Tạm ngưng ghi lịch sử khi đang áp dữ liệu hàng loạt từ Google Sheets. */
export function pauseModuleAudit() {
  auditPauseDepth += 1;
  return () => {
    auditPauseDepth = Math.max(0, auditPauseDepth - 1);
  };
}

export const useModuleAuditStore = create<{ logs: ModuleAuditLog[]; append: (logs: ModuleAuditLog[]) => void }>()(
  persist((set) => ({
    logs: [],
    append: (logs) => set((state) => ({ logs: [...logs, ...state.logs].slice(0, 500) })),
  }), { name: 'hkt-module-audit-storage' }),
);

const labels: Record<string, string> = {
  code: 'Mã', name: 'Tên', fullName: 'Họ tên', customName: 'Tên riêng', category: 'Danh mục',
  unit: 'Đơn vị', costPrice: 'Giá nhập', wholesalePrice: 'Giá bán', stock: 'Tồn kho',
  origin: 'Xuất xứ', color: 'Màu sắc', status: 'Trạng thái', description: 'Mô tả',
  contactPerson: 'Người đại diện', representative: 'Người đại diện', phone: 'Điện thoại',
  email: 'Email', address: 'Địa chỉ', specialties: 'Hoa chủ lực', rating: 'Đánh giá',
  totalDebt: 'Tổng nợ', oldDebt: 'Nợ cũ', importAmount: 'Tiền nhập', paidAmount: 'Đã trả',
  finalDebt: 'Nợ cuối', notes: 'Ghi chú', region: 'Khu vực', tier: 'Hạng', discount: 'Chiết khấu / trừ hàng',
  totalRevenue: 'Doanh thu', currentDebt: 'Nợ hiện tại', salesAmount: 'Tiền bán', collectedAmount: 'Đã thu',
  supplierName: 'Nhà cung cấp', orderDate: 'Ngày đặt', deliveryDate: 'Ngày giao', warehouse: 'Kho',
  creator: 'Người tạo', paymentStatus: 'Trạng thái thanh toán', items: 'Chi tiết sản phẩm',
  totalQuantity: 'Tổng số lượng', itemsSubtotal: 'Tiền hàng', shippingFee: 'Cước xe', totalAmount: 'Tổng tiền',
  debtAmount: 'Còn nợ', flowerCode: 'Mã hoa', flowerName: 'Tên hoa', currentStock: 'Tồn hiện tại',
  minStock: 'Tồn tối thiểu', maxStock: 'Tồn tối đa', lastImportDate: 'Ngày nhập cuối',
  shelfLifeDays: 'Số ngày bảo quản', freshness: 'Độ tươi', username: 'Tên đăng nhập', password: 'Mật khẩu',
  role: 'Quyền', department: 'Phòng ban', position: 'Chức vụ', joinDate: 'Ngày vào làm', salary: 'Lương',
  type: 'Loại', amount: 'Số tiền', date: 'Ngày', paymentMethod: 'Phương thức thanh toán', partner: 'Đối tác',
  partnerType: 'Loại đối tác', partnerCode: 'Mã đối tác', partnerName: 'Tên đối tác', entryType: 'Loại ghi nhận',
  remainingDebt: 'Nợ còn lại', increaseAmount: 'Phát sinh tăng', decreaseAmount: 'Phát sinh giảm',
  referenceCode: 'Mã tham chiếu',
};

function display(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'number') return value.toLocaleString('vi-VN');
  if (typeof value === 'object') return JSON.stringify(value, (key, item) => /password|token|secret/i.test(key) ? '[Ẩn]' : item);
  return String(value);
}

// Subscribe after hydration: existing data is not reported as newly created.
// Observing stores also captures bulk actions and updates from related modules.
export function watchModule<S, T extends object>(store: StoreApi<S>, select: (state: S) => T[], module: AuditModule, key: (row: T) => string) {
  return store.subscribe((state, previous) => {
    if (auditPauseDepth > 0) return;
    const rows = select(state);
    const oldRows = select(previous);
    if (rows === oldRows) return;
    const before = new Map(oldRows.map((row) => [key(row), row]));
    const after = new Map(rows.map((row) => [key(row), row]));
    const user = useAuthStore.getState().user;
    const logs: ModuleAuditLog[] = [];
    for (const id of new Set([...after.keys(), ...before.keys()])) {
      const oldRow = before.get(id) as Record<string, unknown> | undefined;
      const newRow = after.get(id) as Record<string, unknown> | undefined;
      if (oldRow === newRow) continue;
      const changes = [...new Set([...Object.keys(oldRow ?? {}), ...Object.keys(newRow ?? {})])]
        .filter((field) => labels[field] && JSON.stringify(oldRow?.[field]) !== JSON.stringify(newRow?.[field]))
        .map((field) => ({ field: labels[field], before: field === 'password' ? '[Ẩn]' : display(oldRow?.[field]), after: field === 'password' ? '[Đã thay đổi]' : display(newRow?.[field]) }));
      if (oldRow && newRow && !changes.length) continue;
      const row = newRow ?? oldRow!;
      logs.push({
        id: crypto.randomUUID(), module, timestamp: new Date().toISOString(),
        action: !oldRow ? 'create' : !newRow ? 'delete' : oldRow.status !== newRow.status ? 'status_change' : 'update',
        record: [row.code ?? row.flowerCode ?? row.referenceCode ?? row.partnerCode, row.name ?? row.fullName ?? row.flowerName ?? row.supplierName ?? row.partnerName ?? row.partner].filter(Boolean).join(' · ') || id,
        performer: user?.full_name ?? 'Hệ thống', performerCode: user?.code ?? '', changes,
      });
    }
    if (logs.length) useModuleAuditStore.getState().append(logs);
  });
}
