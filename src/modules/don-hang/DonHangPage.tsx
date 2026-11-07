import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  ChartColumn,
  Coins,
  ExternalLink,
  History,
  List,
  Plus,
  Printer,
  SquarePen,
  Tag,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import { MultiSelectFilter, type FilterOption } from '@/components/ui/MultiSelectFilter';
import type { ColumnDef } from '@/stores/createListStore';
import { useDebtStore, useDistributorStore, useOrderStore } from '@/stores/hoaKhangThanhStore';
import type { Order } from '@/types/hoaKhangThanh';
import { formatDate, parseDateTimestamp } from '@/lib/format';
import { checkCustomerOverdueDebt } from '@/lib/debtCheck';
import { computeAllOrdersVirtualDebt, formatOldDebtDisplay } from '@/lib/orderDebtHelper';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { DonHangFormModal } from './DonHangFormModal';
import { DonHangDetailModal } from './DonHangDetailModal';
import { DonHangStats } from './DonHangStats';
import { DonHangLichSu } from './DonHangLichSu';
import { HoaDonPrintModal, generateInvoiceUrl } from './HoaDonPrintModal';

type Tab = 'danhsach' | 'thongke' | 'lichsu';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'code', label: 'ID đơn hàng', visible: true, minWidth: 110, width: 120, order: 0 },
  { id: 'orderDate', label: 'Ngày đặt', visible: true, minWidth: 100, width: 105, order: 1 },
  { id: 'partner', label: 'NPP / Khách hàng', visible: true, minWidth: 180, width: 200, order: 2 },
  { id: 'totalQuantity', label: 'Số lượng hoa', visible: true, minWidth: 100, width: 115, order: 3 },
  { id: 'itemsSubtotal', label: 'Thành tiền', visible: true, minWidth: 115, width: 125, order: 4 },
  { id: 'shippingFee', label: 'Cước xe', visible: true, minWidth: 95, width: 105, order: 5 },
  { id: 'discount', label: 'Trừ hàng', visible: true, minWidth: 95, width: 105, order: 6 },
  { id: 'totalAmount', label: 'Tổng tiền', visible: true, minWidth: 120, width: 130, order: 7 },
  { id: 'debt', label: 'Công nợ cũ', visible: true, minWidth: 110, width: 120, order: 8 },
  { id: 'totalPayment', label: 'Thanh toán', visible: true, minWidth: 120, width: 130, order: 9 },
  { id: 'status', label: 'Trạng thái', visible: true, minWidth: 110, width: 120, order: 10 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 80, width: 85, order: 11 },
];

export default function DonHangPage() {
  const { orders, deleteOrder } = useOrderStore();
  const debtRecords = useDebtStore((s) => s.records);
  const distributors = useDistributorStore((s) => s.distributors);

  // Cột ảo: Tự động tính toán công nợ cũ & thanh toán theo dòng thời gian lũy kế thực tế
  const virtualDebtMap = useMemo(() => {
    return computeAllOrdersVirtualDebt(orders, debtRecords, distributors);
  }, [orders, debtRecords, distributors]);

  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [selectedDebtStatuses, setSelectedDebtStatuses] = useState<string[]>([]);

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('don_hang', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Filter options with counts
  const statusOptions: FilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      const s = o.status;
      counts[s] = (counts[s] || 0) + 1;
    });
    return [
      { label: 'Nháp', value: 'nhap', count: counts['nhap'] || counts['pending'] || 0 },
      { label: 'Đã xác nhận', value: 'da_xac_nhan', count: counts['da_xac_nhan'] || counts['processing'] || 0 },
      { label: 'Đang giao', value: 'dang_giao', count: counts['dang_giao'] || counts['delivering'] || 0 },
      { label: 'Hoàn thành', value: 'hoan_thanh', count: counts['hoan_thanh'] || counts['completed'] || 0 },
      { label: 'Đã hủy', value: 'huy', count: counts['huy'] || counts['cancelled'] || 0 },
    ];
  }, [orders]);

  const partnerOptions: FilterOption[] = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.distributorName] = (map[o.distributorName] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      label: name,
      value: name,
      count,
    }));
  }, [orders]);

  // Bản đồ kiểm tra nợ quá hạn 4 ngày theo nguyên tắc FIFO của từng khách hàng
  const overdueCustomerMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof checkCustomerOverdueDebt>>();
    const processed = new Set<string>();
    orders.forEach((o) => {
      const key = o.distributorId || o.distributorName.trim().toLowerCase();
      if (!processed.has(key)) {
        processed.add(key);
        const result = checkCustomerOverdueDebt(
          o.distributorId || '',
          o.distributorName,
          orders,
          undefined,
          undefined,
          debtRecords,
        );
        map.set(key, result);
        if (o.distributorName) {
          map.set(o.distributorName.trim().toLowerCase(), result);
        }
        if (o.distributorId) {
          map.set(o.distributorId, result);
        }
      }
    });
    return map;
  }, [orders, debtRecords]);

  const debtOptions: FilterOption[] = useMemo(() => {
    let overdueCount = 0;
    const hasDebt = orders.filter((o) => {
      const total = o.totalAmount || 0;
      const paid = o.paidAmount || 0;
      return total - paid > 0;
    }).length;
    const noDebt = orders.length - hasDebt;

    orders.forEach((o) => {
      const check =
        (o.distributorId ? overdueCustomerMap.get(o.distributorId) : null) ||
        overdueCustomerMap.get(o.distributorName.trim().toLowerCase());
      if (check?.hasOverdueUnpaidDebt) {
        overdueCount++;
      }
    });

    return [
      { label: '⚠️ Chưa trả nợ (≥ 4 ngày)', value: 'overdue_debt', count: overdueCount },
      { label: 'Còn nợ', value: 'has_debt', count: hasDebt },
      { label: 'Đã thanh toán đủ', value: 'paid', count: noDebt },
    ];
  }, [orders, overdueCustomerMap]);

  // Filter logic
  const filteredData = useMemo(() => {
    return orders.filter((o) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.distributorName.toLowerCase().includes(q) ||
        o.creator.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q)) ||
        o.items.some((i) => i.flowerName.toLowerCase().includes(q) || i.flowerCode.toLowerCase().includes(q));

      const matchStatus =
        selectedStatuses.length === 0 ||
        selectedStatuses.includes(o.status) ||
        (selectedStatuses.includes('nhap') && o.status === 'pending') ||
        (selectedStatuses.includes('da_xac_nhan') && o.status === 'processing') ||
        (selectedStatuses.includes('dang_giao') && o.status === 'delivering') ||
        (selectedStatuses.includes('hoan_thanh') && o.status === 'completed');

      const matchPartner =
        selectedPartners.length === 0 || selectedPartners.includes(o.distributorName);

      const debt = (o.totalAmount || 0) - (o.paidAmount || 0);
      const check =
        (o.distributorId ? overdueCustomerMap.get(o.distributorId) : null) ||
        overdueCustomerMap.get(o.distributorName.trim().toLowerCase());
      const isOverdue = Boolean(check?.hasOverdueUnpaidDebt);

      const matchDebt =
        selectedDebtStatuses.length === 0 ||
        (selectedDebtStatuses.includes('overdue_debt') && isOverdue) ||
        (selectedDebtStatuses.includes('has_debt') && debt > 0) ||
        (selectedDebtStatuses.includes('paid') && debt <= 0);

      return matchSearch && matchStatus && matchPartner && matchDebt;
    }).sort((a, b) => {
      const tA = parseDateTimestamp(a.orderDate) ?? 0;
      const tB = parseDateTimestamp(b.orderDate) ?? 0;
      if (tB !== tA) return tB - tA; // Lớn tới bé: ngày mới nhất hiển thị lên đầu
      return (b.code || '').localeCompare(a.code || '', undefined, { numeric: true });
    });
  }, [orders, searchTerm, selectedStatuses, selectedPartners, selectedDebtStatuses, overdueCustomerMap]);

  // Paginated Data
  
  // Selection handlers
  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = (ids: string[]) => {
    setSelectedIds((prev) => {
      if (prev.size === ids.length) return new Set();
      return new Set(ids);
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteMany = () => {
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} đơn hàng đã chọn?`)) {
      selectedIds.forEach((id) => deleteOrder(id));
      setSelectedIds(new Set());
      toast.success('Đã xóa các đơn hàng đã chọn');
    }
  };

  const handleAddNew = () => {
    setOrderToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (order: Order) => {
    const v = virtualDebtMap.get(order.id);
    const enriched = v ? { ...order, oldDebt: v.oldDebt, totalPayment: v.totalPayment } : order;
    setOrderToEdit(enriched);
    setIsFormOpen(true);
  };

  const handleDelete = (order: Order) => {
    if (confirm(`Bạn có chắc muốn xóa đơn hàng ${order.code}?`)) {
      deleteOrder(order.id);
      toast.success(`Đã xóa đơn hàng ${order.code}`);
    }
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const renderStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'nhap':
      case 'pending':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/80">
            Nháp
          </span>
        );
      case 'da_xac_nhan':
      case 'processing':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Đã xác nhận
          </span>
        );
      case 'dang_giao':
      case 'delivering':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Đang giao
          </span>
        );
      case 'hoan_thanh':
      case 'completed':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Hoàn thành
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Đã hủy
          </span>
        );
    }
  };

  const renderCell = (columnId: string, row: Order) => {
    const totalQty = row.totalQuantity || row.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = row.itemsSubtotal || row.items.reduce((s, i) => s + i.amount, 0);
    const shipping = row.shippingFee || 0;
    const discount = row.discount || 0;
    const total = row.totalAmount || subtotal + shipping - discount;

    switch (columnId) {
      case 'code':
        return (
          <button
            type="button"
            onClick={() => setSelectedOrderDetail(row)}
            className="px-2 py-0.5 rounded text-xs font-mono font-bold border border-border bg-muted/40 text-primary hover:border-primary/50 transition-colors text-left"
          >
            {row.code}
          </button>
        );
      case 'orderDate':
        return <span className="text-xs text-muted-foreground font-mono">{formatDate(row.orderDate)}</span>;
      case 'partner': {
        const debtCheck =
          (row.distributorId ? overdueCustomerMap.get(row.distributorId) : null) ||
          overdueCustomerMap.get(row.distributorName.trim().toLowerCase());
        return (
          <div className="cursor-pointer hover:text-primary space-y-1" onClick={() => setSelectedOrderDetail(row)}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-foreground truncate max-w-[190px]" title={row.distributorName}>
                {row.distributorName}
              </span>
              {debtCheck?.hasOverdueUnpaidDebt && debtCheck.earliestUnpaidOrder && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 shrink-0"
                  title={`Chưa trả nợ đơn ${debtCheck.earliestUnpaidOrder.code} (quá ${debtCheck.earliestUnpaidOrder.daysAgo} ngày, còn nợ ${formatNumber(debtCheck.earliestUnpaidOrder.remainingDebt)})`}
                >
                  <AlertTriangle size={11} className="shrink-0 text-rose-600" />
                  Chưa trả nợ ({debtCheck.earliestUnpaidOrder.daysAgo} ngày)
                </span>
              )}
            </div>
            {row.phone && <span className="text-[11px] text-muted-foreground font-mono block">{row.phone}</span>}
          </div>
        );
      }
      case 'totalQuantity':
        return (
          <span className="text-xs font-bold text-foreground font-mono">
            {totalQty.toLocaleString('vi-VN')}
          </span>
        );
      case 'itemsSubtotal':
        return <span className="text-xs font-medium text-foreground font-mono">{formatNumber(subtotal)}</span>;
      case 'shippingFee':
        return (
          <span className="text-xs font-medium text-primary font-mono">
            {shipping > 0 ? `+${formatNumber(shipping)}` : '-'}
          </span>
        );
      case 'discount':
        return (
          <span className="text-xs font-medium text-rose-600 font-mono">
            {discount > 0 ? `-${formatNumber(discount)}` : '-'}
          </span>
        );
      case 'totalAmount':
        return <span className="text-xs font-bold text-primary font-mono">{formatNumber(total)}</span>;
      case 'debt':
      case 'oldDebt': {
        const debtInfo = virtualDebtMap.get(row.id) ?? {
          oldDebt: row.oldDebt !== undefined ? row.oldDebt : 0,
          totalPayment: row.totalPayment !== undefined ? row.totalPayment : (total + (row.oldDebt || 0)),
          finalDebt: total + (row.oldDebt || 0),
        };
        const oldDebtVal = debtInfo.oldDebt;
        const display = formatOldDebtDisplay(oldDebtVal);
        return (
          <span
            className={`text-xs font-mono ${display.className}`}
            title={oldDebtVal < 0 ? `Khách hàng đang có số dư trả thừa: -${Math.abs(oldDebtVal).toLocaleString('vi-VN')}` : undefined}
          >
            {display.text}
          </span>
        );
      }
      case 'totalPayment': {
        const debtInfo = virtualDebtMap.get(row.id) ?? {
          oldDebt: row.oldDebt !== undefined ? row.oldDebt : 0,
          totalPayment: row.totalPayment !== undefined ? row.totalPayment : (total + (row.oldDebt || 0)),
          finalDebt: total + (row.oldDebt || 0),
        };
        const payVal = debtInfo.totalPayment;
        return (
          <span className="text-xs font-bold font-mono text-primary">
            {payVal < 0 ? `Dư: ${Math.abs(payVal).toLocaleString('vi-VN')}` : formatNumber(payVal)}
          </span>
        );
      }
      case 'status':
        return renderStatusBadge(row.status);
      case 'actions': {
        const debtInfo = virtualDebtMap.get(row.id);
        const enrichedRow: Order = debtInfo ? { ...row, oldDebt: debtInfo.oldDebt, totalPayment: debtInfo.totalPayment } : row;
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(generateInvoiceUrl(enrichedRow), '_blank');
              }}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Mở phiếu in trong tab mới"
            >
              <ExternalLink size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPrintOrder(enrichedRow);
              }}
              className="p-1 rounded text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
              title="Xem & In phiếu hóa đơn (Popup)"
            >
              <Printer size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(enrichedRow);
              }}
              className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
              title="Chỉnh sửa đơn hàng"
            >
              <SquarePen size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(row);
              }}
              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xóa đơn hàng"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      }
      default:
        return null;
    }
  };

  const renderMobileCard = (row: Order, selected: boolean) => {
    const totalQty = row.totalQuantity || row.items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = row.itemsSubtotal || row.items.reduce((s, i) => s + i.amount, 0);
    const shipping = row.shippingFee || 0;
    const discount = row.discount || 0;
    const total = row.totalAmount || (subtotal + shipping - discount);
    const debtInfo = virtualDebtMap.get(row.id) ?? {
      oldDebt: row.oldDebt !== undefined ? row.oldDebt : 0,
      totalPayment: row.totalPayment !== undefined ? row.totalPayment : (total + (row.oldDebt || 0)),
      finalDebt: total + (row.oldDebt || 0),
    };
    const oldDebtVal = debtInfo.oldDebt;
    const totalPayVal = debtInfo.totalPayment;
    const oldDebtDisplay = formatOldDebtDisplay(oldDebtVal);
    const debtCheck =
      (row.distributorId ? overdueCustomerMap.get(row.distributorId) : null) ||
      overdueCustomerMap.get(row.distributorName.trim().toLowerCase());
    const enrichedRow: Order = { ...row, oldDebt: oldDebtVal, totalPayment: totalPayVal };

    return (
      <div
        onClick={() => setSelectedOrderDetail(enrichedRow)}
        className={`p-3.5 rounded-xl border space-y-2.5 transition-all cursor-pointer ${
          selected ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-muted/60 border border-border text-primary">
            {row.code}
          </span>
          <div className="flex items-center gap-1.5">
            {debtCheck?.hasOverdueUnpaidDebt && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                <AlertTriangle size={10} className="text-rose-600" />
                Chưa trả nợ
              </span>
            )}
            {renderStatusBadge(row.status)}
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{row.distributorName}</div>
          <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>SL: <strong className="text-foreground font-mono">{totalQty.toLocaleString('vi-VN')}</strong> hoa</span>
            <span>•</span>
            <span>Tổng: <strong className="text-foreground font-mono">{formatNumber(total)}</strong></span>
            <span>•</span>
            <span>Thanh toán: <strong className="text-primary font-mono font-bold">{totalPayVal < 0 ? `Dư: ${Math.abs(totalPayVal).toLocaleString('vi-VN')}` : formatNumber(totalPayVal)}</strong></span>
          </div>
          {row.items.length > 0 && (
            <div className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
              Hoa: {row.items.map((i) => `${i.flowerName} (${i.quantity})`).join(', ')}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>Ngày: {formatDate(row.orderDate)}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open(generateInvoiceUrl(enrichedRow), '_blank');
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
              title="Mở phiếu in trong tab mới"
            >
              <ExternalLink size={11} />
              Tab mới
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPrintOrder(enrichedRow);
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100"
              title="Xem phiếu in (Popup)"
            >
              <Printer size={11} />
              In phiếu
            </button>
            <span className="font-mono text-xs">
              <span className="text-muted-foreground">Nợ cũ: </span>
              <strong className={oldDebtDisplay.className}>
                {oldDebtDisplay.text}
              </strong>
            </span>
          </div>
        </div>
      </div>
    );
  };

  const activeFilterCount =
    (selectedStatuses.length > 0 ? 1 : 0) +
    (selectedPartners.length > 0 ? 1 : 0) +
    (selectedDebtStatuses.length > 0 ? 1 : 0);

  const handleClearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedPartners([]);
    setSelectedDebtStatuses([]);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Top Segmented Tabs: Danh sách | Thống kê | Lịch sử thao tác */}
      <div className="px-3 sm:px-4 pt-3 pb-1 shrink-0 bg-background">
        <Tabs<Tab>
          tabs={[
            { id: 'danhsach', label: 'Danh sách đơn hàng', icon: List },
            { id: 'thongke', label: 'Báo cáo & Thống kê đơn', icon: ChartColumn },
            { id: 'lichsu', label: 'Lịch sử thao tác', icon: History },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'danhsach' && (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* List Toolbar */}
          <ListToolbar
            showBack={true}
            searchPlaceholder="Tìm kiếm theo ID đơn, tên NPP/Khách hàng, tên hoa, người đặt..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCount={selectedIds.size}
            onClearSelection={handleClearSelection}
            onDeleteMany={handleDeleteMany}
            columns={columns}
            onToggleColumn={handleToggleColumn}
            onUpdateColumn={handleUpdateColumn}
            onReorderColumns={handleReorderColumns}
            onResetColumns={handleResetColumns}
            activeFilterCount={activeFilterCount}
            onClearAllFilters={handleClearAllFilters}
            actions={
              <div className="flex items-center gap-1.5">
                {orders.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ ${orders.length} đơn hàng hiện tại không?`)) {
                        useOrderStore.setState({ orders: [] });
                        try {
                          localStorage.removeItem('hkt-orders-storage');
                        } catch {
                          // Ignore
                        }
                        toast.success('Đã làm sạch toàn bộ đơn hàng!');
                      }
                    }}
                    className="h-8 gap-1 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Xóa toàn bộ đơn hàng hiện tại"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">Xóa tất cả đơn</span>
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleAddNew}
                  className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Plus size={14} className="stroke-[2.5px]" />
                  <span>Thêm mới</span>
                </Button>
              </div>
            }
            filters={
              <>
                <MultiSelectFilter
                  icon={Tag}
                  placeholder="Trạng thái đơn"
                  options={statusOptions}
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
                <MultiSelectFilter
                  icon={Building2}
                  placeholder="NPP / Khách hàng"
                  options={partnerOptions}
                  value={selectedPartners}
                  onChange={setSelectedPartners}
                />
                <MultiSelectFilter
                  icon={Coins}
                  placeholder="Công nợ"
                  options={debtOptions}
                  value={selectedDebtStatuses}
                  onChange={setSelectedDebtStatuses}
                />
              </>
            }
          />

          {/* DataTable */}
          <div className="flex-1 min-h-0">
            <DataTable<Order>
              defaultSort={{ column: 'orderDate', direction: 'desc' }}
              data={filteredData}
              columns={columns}
              selectedIds={selectedIds}
              onToggleSelection={handleToggleSelection}
              onToggleAll={handleToggleAll}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onResizeColumn={(id, width) => handleUpdateColumn(id, { width })}
              renderCell={renderCell}
              renderMobileCard={renderMobileCard}
              keyExtractor={(r) => r.id}
            />
          </div>
        </div>
      )}

      {activeTab === 'thongke' && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <DonHangStats />
        </div>
      )}

      {activeTab === 'lichsu' && (
        <div className="flex-1 min-h-0 flex flex-col">
          <DonHangLichSu />
        </div>
      )}

      {/* Form Modal & Detail Modal */}
      {isFormOpen && (
        <DonHangFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setOrderToEdit(null);
          }}
          orderToEdit={orderToEdit}
        />
      )}
      {selectedOrderDetail && (
        <DonHangDetailModal
          order={(() => {
            const v = virtualDebtMap.get(selectedOrderDetail.id);
            return v
              ? { ...selectedOrderDetail, oldDebt: v.oldDebt, totalPayment: v.totalPayment }
              : selectedOrderDetail;
          })()}
          onClose={() => setSelectedOrderDetail(null)}
          onEdit={(order) => {
            setSelectedOrderDetail(null);
            handleEdit(order);
          }}
        />
      )}
      <HoaDonPrintModal
        isOpen={!!printOrder}
        onClose={() => setPrintOrder(null)}
        order={(() => {
          if (!printOrder) return null;
          const v = virtualDebtMap.get(printOrder.id);
          return v ? { ...printOrder, oldDebt: v.oldDebt, totalPayment: v.totalPayment } : printOrder;
        })()}
      />
    </div>
  );
}
