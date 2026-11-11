import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { idbJSONStorage } from '@/lib/idbStorage';
import type { Order, OrderAuditAction, OrderAuditDiff, OrderAuditLog } from '@/types/hoaKhangThanh';
import { useAuthStore } from './auth';

export const ORDER_STATUS_LABELS: Record<string, string> = {
  nhap: 'Nháp',
  da_xac_nhan: 'Đã xác nhận',
  dang_giao: 'Đang giao',
  hoan_thanh: 'Hoàn thành',
  huy: 'Đã hủy',
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  delivering: 'Đang giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

function formatMoney(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0';
  return Number(n).toLocaleString('vi-VN');
}

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60 * 1000).toISOString();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 24 * 3600 * 1000).toISOString();

export const INITIAL_ORDER_LOGS: OrderAuditLog[] = [
  {
    id: 'log-seed-1',
    orderId: 'dh-2026-004',
    orderCode: 'DH-2026-004',
    action: 'status_change',
    actionLabel: 'Đổi trạng thái',
    performerId: 'nv-002',
    performerName: 'Trần Thị Kim Thành',
    performerCode: 'NV-002',
    performerRole: 'Kế toán trưởng',
    distributorId: 'npp-4',
    distributorName: 'NPP Hương Lan Cần Thơ',
    timestamp: minutesAgo(14),
    summary: 'Chuyển trạng thái đơn DH-2026-004 sang "Đang giao"',
    details: 'Đổi trạng thái: Đã xác nhận → Đang giao | Khách hàng: NPP Hương Lan Cần Thơ',
    diff: [
      { field: 'status', label: 'Trạng thái', oldValue: 'Đã xác nhận', newValue: 'Đang giao' },
    ],
  },
  {
    id: 'log-seed-2',
    orderId: 'dh-2026-003',
    orderCode: 'DH-2026-003',
    action: 'update',
    actionLabel: 'Chỉnh sửa đơn',
    performerId: 'nv-003',
    performerName: 'Lê Minh Công',
    performerCode: 'NV-003',
    performerRole: 'Nhân viên kinh doanh',
    distributorId: 'npp-3',
    distributorName: 'NPP Mai Vàng Đà Nẵng',
    timestamp: hoursAgo(2),
    summary: 'Chỉnh sửa đơn hàng DH-2026-003 (NPP Mai Vàng Đà Nẵng)',
    details: 'Số lượng hoa: 180 hoa → 220 hoa | Cước xe: 120.000 → 150.000 | Tổng tiền: 5.400.000 → 6.600.000',
    diff: [
      { field: 'totalQuantity', label: 'Số lượng hoa', oldValue: '180 hoa', newValue: '220 hoa' },
      { field: 'shippingFee', label: 'Cước xe', oldValue: '120.000', newValue: '150.000' },
      { field: 'totalAmount', label: 'Tổng tiền', oldValue: '5.400.000', newValue: '6.600.000' },
    ],
  },
  {
    id: 'log-seed-3',
    orderId: 'dh-2026-004',
    orderCode: 'DH-2026-004',
    action: 'create',
    actionLabel: 'Thêm mới đơn',
    performerId: 'nv-004',
    performerName: 'Lê Hoàng Nam',
    performerCode: 'NV-004',
    performerRole: 'Nhân viên kinh doanh',
    distributorId: 'npp-4',
    distributorName: 'NPP Hương Lan Cần Thơ',
    timestamp: hoursAgo(5),
    summary: 'Tạo mới đơn hàng DH-2026-004 cho NPP Hương Lan Cần Thơ',
    details: 'Khách hàng: NPP Hương Lan Cần Thơ | Số lượng: 350 hoa | Tiền hàng: 8.750.000 | Cước xe: 200.000 | Tổng tiền: 8.950.000',
    itemsCount: 3,
    totalQuantity: 350,
    totalAmount: 8950000,
    oldDebt: 1200000,
    totalPayment: 10150000,
  },
  {
    id: 'log-seed-4',
    orderId: 'dh-2026-002',
    orderCode: 'DH-2026-002',
    action: 'create',
    actionLabel: 'Thêm mới đơn',
    performerId: 'nv-003',
    performerName: 'Lê Minh Công',
    performerCode: 'NV-003',
    performerRole: 'Nhân viên kinh doanh',
    distributorId: 'npp-2',
    distributorName: 'NPP Lan Rừng Hà Nội',
    timestamp: daysAgo(1),
    summary: 'Tạo mới đơn hàng DH-2026-002 cho NPP Lan Rừng Hà Nội',
    details: 'Khách hàng: NPP Lan Rừng Hà Nội | Số lượng: 200 hoa | Tiền hàng: 6.200.000 | Cước xe: 150.000 | Tổng tiền: 6.350.000',
    itemsCount: 2,
    totalQuantity: 200,
    totalAmount: 6350000,
    oldDebt: 0,
    totalPayment: 6350000,
  },
  {
    id: 'log-seed-5',
    orderId: 'dh-2026-001',
    orderCode: 'DH-2026-001',
    action: 'create',
    actionLabel: 'Thêm mới đơn',
    performerId: 'nv-001',
    performerName: 'Nguyễn Văn Khang',
    performerCode: 'NV-001',
    performerRole: 'Giám đốc Điều hành',
    distributorId: 'npp-1',
    distributorName: 'NPP Hoa Tươi Sài Gòn',
    timestamp: daysAgo(2),
    summary: 'Tạo mới đơn hàng DH-2026-001 cho NPP Hoa Tươi Sài Gòn',
    details: 'Khách hàng: NPP Hoa Tươi Sài Gòn | Số lượng: 500 hoa | Tiền hàng: 15.000.000 | Cước xe: 300.000 | Tổng tiền: 15.300.000',
    itemsCount: 4,
    totalQuantity: 500,
    totalAmount: 15300000,
    oldDebt: 0,
    totalPayment: 15300000,
  },
  {
    id: 'log-seed-6',
    orderId: 'dh-2026-old-99',
    orderCode: 'DH-2026-099',
    action: 'delete',
    actionLabel: 'Xóa đơn hàng',
    performerId: 'nv-001',
    performerName: 'Nguyễn Văn Khang',
    performerCode: 'NV-001',
    performerRole: 'Giám đốc Điều hành',
    distributorId: 'npp-1',
    distributorName: 'NPP Hoa Tươi Sài Gòn',
    timestamp: daysAgo(3),
    summary: 'Đã xóa đơn hàng DH-2026-099 của NPP Hoa Tươi Sài Gòn',
    details: 'Khách hàng: NPP Hoa Tươi Sài Gòn | Tổng tiền đơn: 3.500.000 | Số lượng: 100 hoa | Lý do: Khách hàng hủy đặt đột xuất',
    totalQuantity: 100,
    totalAmount: 3500000,
  },
];

interface OrderLogState {
  logs: OrderAuditLog[];
  addLog: (log: Omit<OrderAuditLog, 'id' | 'timestamp'> & { timestamp?: string }) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  resetLogs: () => void;
}

export const useOrderLogStore = create<OrderLogState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (logInput) =>
        set((state) => {
          const newLog: OrderAuditLog = {
            ...logInput,
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: logInput.timestamp || new Date().toISOString(),
          };
          return { logs: [newLog, ...state.logs].slice(0, 500) };
        }),
      deleteLog: (id) =>
        set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
      clearLogs: () => set({ logs: [] }),
      resetLogs: () => set({ logs: [] }),
    }),
    { name: 'hkt-order-audit-logs-storage', storage: idbJSONStorage },
  ),
);

/**
 * Ghi nhận lịch sử thao tác thêm / sửa / xóa / trạng thái đơn hàng của nhân viên
 */
export function recordOrderAudit(params: {
  action: OrderAuditAction;
  order: Order;
  oldOrder?: Order;
  performer?: string;
  performerCode?: string;
  performerRole?: string;
  customSummary?: string;
  customDetails?: string;
}): void {
  const { action, order, oldOrder } = params;
  const authUser = useAuthStore.getState().user;

  const performerName =
    params.performer?.trim() ||
    authUser?.full_name ||
    order.creator ||
    'Nguyễn Văn Khang';

  const performerCode =
    params.performerCode ||
    (performerName === authUser?.full_name ? authUser?.code : undefined) ||
    'NV-001';

  const performerRole =
    params.performerRole ||
    (performerName === authUser?.full_name ? authUser?.position || authUser?.role : 'Nhân viên kinh doanh') ||
    'Admin';

  const totalQty =
    order.totalQuantity ??
    (order.items || []).reduce((sum, i) => sum + (i.quantity || 0), 0);

  const itemsCount = (order.items || []).length;

  let actionLabel = 'Thao tác đơn hàng';
  let summary = params.customSummary || '';
  let details = params.customDetails || '';
  const diff: OrderAuditDiff[] = [];

  if (action === 'create') {
    actionLabel = 'Thêm mới đơn';
    summary = `Tạo mới đơn hàng ${order.code} cho ${order.distributorName}`;
    const itemsPreview = (order.items || [])
      .slice(0, 3)
      .map((i) => `${i.flowerName} (x${i.quantity.toLocaleString('vi-VN')})`)
      .join(', ');
    const moreText = itemsCount > 3 ? ` và ${itemsCount - 3} loại hoa khác` : '';

    details = `Khách hàng: ${order.distributorName} | Số lượng: ${totalQty.toLocaleString('vi-VN')} hoa (${itemsCount} mặt hàng: ${itemsPreview}${moreText}) | Tiền hàng: ${formatMoney(order.itemsSubtotal)} | Cước xe: ${formatMoney(order.shippingFee)} | Trừ hàng: ${formatMoney(order.discount)} | Tổng tiền: ${formatMoney(order.totalAmount)} | Nợ cũ: ${formatMoney(order.oldDebt)} | Thanh toán: ${formatMoney(order.totalPayment)}`;
  } else if (action === 'update') {
    actionLabel = 'Chỉnh sửa đơn';
    summary = `Chỉnh sửa đơn hàng ${order.code} (${order.distributorName})`;

    if (oldOrder) {
      if (oldOrder.distributorName !== order.distributorName) {
        diff.push({
          field: 'distributorName',
          label: 'NPP / Khách hàng',
          oldValue: oldOrder.distributorName,
          newValue: order.distributorName,
        });
      }
      if (oldOrder.status !== order.status) {
        diff.push({
          field: 'status',
          label: 'Trạng thái',
          oldValue: ORDER_STATUS_LABELS[oldOrder.status] || oldOrder.status,
          newValue: ORDER_STATUS_LABELS[order.status] || order.status,
        });
      }
      if ((oldOrder.totalQuantity ?? 0) !== totalQty) {
        diff.push({
          field: 'totalQuantity',
          label: 'Số lượng hoa',
          oldValue: `${(oldOrder.totalQuantity || 0).toLocaleString('vi-VN')} hoa`,
          newValue: `${totalQty.toLocaleString('vi-VN')} hoa`,
        });
      }
      if ((oldOrder.itemsSubtotal ?? 0) !== (order.itemsSubtotal ?? 0)) {
        diff.push({
          field: 'itemsSubtotal',
          label: 'Thành tiền hoa',
          oldValue: formatMoney(oldOrder.itemsSubtotal),
          newValue: formatMoney(order.itemsSubtotal),
        });
      }
      if ((oldOrder.shippingFee ?? 0) !== (order.shippingFee ?? 0)) {
        diff.push({
          field: 'shippingFee',
          label: 'Cước xe',
          oldValue: formatMoney(oldOrder.shippingFee),
          newValue: formatMoney(order.shippingFee),
        });
      }
      if ((oldOrder.discount ?? 0) !== (order.discount ?? 0)) {
        diff.push({
          field: 'discount',
          label: 'Trừ hàng',
          oldValue: formatMoney(oldOrder.discount),
          newValue: formatMoney(order.discount),
        });
      }
      if (oldOrder.totalAmount !== order.totalAmount) {
        diff.push({
          field: 'totalAmount',
          label: 'Tổng tiền',
          oldValue: formatMoney(oldOrder.totalAmount),
          newValue: formatMoney(order.totalAmount),
        });
      }
      if ((oldOrder.oldDebt ?? 0) !== (order.oldDebt ?? 0)) {
        diff.push({
          field: 'oldDebt',
          label: 'Công nợ cũ',
          oldValue: formatMoney(oldOrder.oldDebt),
          newValue: formatMoney(order.oldDebt),
        });
      }
      if ((oldOrder.totalPayment ?? 0) !== (order.totalPayment ?? 0)) {
        diff.push({
          field: 'totalPayment',
          label: 'Thanh toán',
          oldValue: formatMoney(oldOrder.totalPayment),
          newValue: formatMoney(order.totalPayment),
        });
      }
      if ((oldOrder.paidAmount ?? 0) !== (order.paidAmount ?? 0)) {
        diff.push({
          field: 'paidAmount',
          label: 'Đã thanh toán',
          oldValue: formatMoney(oldOrder.paidAmount),
          newValue: formatMoney(order.paidAmount),
        });
      }
      if ((oldOrder.notes ?? '') !== (order.notes ?? '')) {
        diff.push({
          field: 'notes',
          label: 'Ghi chú',
          oldValue: oldOrder.notes || '(trống)',
          newValue: order.notes || '(trống)',
        });
      }
      // Kiểm tra mặt hàng hoa
      const oldItemsCount = (oldOrder.items || []).length;
      if (oldItemsCount !== itemsCount) {
        diff.push({
          field: 'itemsCount',
          label: 'Số loại hoa',
          oldValue: `${oldItemsCount} loại`,
          newValue: `${itemsCount} loại`,
        });
      }
    }

    if (diff.length > 0) {
      details = diff.map((d) => `${d.label}: ${d.oldValue} → ${d.newValue}`).join(' | ');
    } else {
      details = `Cập nhật thông tin chi tiết đơn hàng: ${totalQty} hoa, Tổng tiền: ${formatMoney(order.totalAmount)}`;
    }
  } else if (action === 'delete') {
    actionLabel = 'Xóa đơn hàng';
    summary = `Đã xóa đơn hàng ${order.code} của ${order.distributorName}`;
    details = `Khách hàng: ${order.distributorName} | Tổng tiền đơn: ${formatMoney(order.totalAmount)} | Số lượng: ${totalQty.toLocaleString('vi-VN')} hoa | Ngày đặt: ${order.orderDate}`;
  } else if (action === 'status_change') {
    actionLabel = 'Đổi trạng thái';
    const oldStatusLabel = oldOrder?.status ? ORDER_STATUS_LABELS[oldOrder.status] || oldOrder.status : '';
    const newStatusLabel = ORDER_STATUS_LABELS[order.status] || order.status;
    summary = `Chuyển trạng thái đơn ${order.code} sang "${newStatusLabel}"`;
    details = oldStatusLabel
      ? `Đổi trạng thái: ${oldStatusLabel} → ${newStatusLabel} | Khách hàng: ${order.distributorName}`
      : `Trạng thái: ${newStatusLabel} | Khách hàng: ${order.distributorName}`;

    diff.push({
      field: 'status',
      label: 'Trạng thái',
      oldValue: oldStatusLabel || '(chưa rõ)',
      newValue: newStatusLabel,
    });
  }

  useOrderLogStore.getState().addLog({
    orderId: order.id,
    orderCode: order.code,
    action,
    actionLabel,
    performerId: authUser?.id,
    performerName,
    performerCode,
    performerRole,
    distributorId: order.distributorId,
    distributorName: order.distributorName,
    summary,
    details,
    itemsCount,
    totalQuantity: totalQty,
    totalAmount: order.totalAmount,
    oldDebt: order.oldDebt,
    totalPayment: order.totalPayment,
    diff: diff.length > 0 ? diff : undefined,
    snapshot: order,
  });
}
