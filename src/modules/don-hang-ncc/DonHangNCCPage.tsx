import { useMemo, useState } from 'react';
import {
  Building2,
  Camera,
  ChartColumn,
  Coins,
  List,
  Plus,
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
import { useSupplierOrderStore } from '@/stores/hoaKhangThanhStore';
import type { SupplierOrder, SupplierOrderItem } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { DonHangNCCFormModal } from './DonHangNCCFormModal';
import { DonHangNCCDetailModal } from './DonHangNCCDetailModal';
import { DonHangNCCStats } from './DonHangNCCStats';
import { ImageOrderReaderModal } from './ImageOrderReaderModal';

type Tab = 'danhsach' | 'thongke';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'code', label: 'ID đơn nhập', visible: true, minWidth: 110, width: 120, order: 0 },
  { id: 'orderDate', label: 'Ngày đặt', visible: true, minWidth: 100, width: 105, order: 1 },
  { id: 'supplier', label: 'Nhà cung cấp / Vườn', visible: true, minWidth: 180, width: 210, order: 2 },
  { id: 'totalQuantity', label: 'Số lượng hoa', visible: true, minWidth: 100, width: 115, order: 3 },
  { id: 'itemsSubtotal', label: 'Thành tiền', visible: true, minWidth: 115, width: 125, order: 4 },
  { id: 'shippingFee', label: 'Cước xe', visible: true, minWidth: 95, width: 105, order: 5 },
  { id: 'discount', label: 'Trừ hàng', visible: true, minWidth: 95, width: 105, order: 6 },
  { id: 'totalAmount', label: 'Tổng tiền', visible: true, minWidth: 120, width: 130, order: 7 },
  { id: 'debt', label: 'Công nợ NCC', visible: true, minWidth: 115, width: 125, order: 8 },
  { id: 'status', label: 'Trạng thái', visible: true, minWidth: 115, width: 125, order: 9 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 80, width: 85, order: 10 },
];

export default function DonHangNCCPage() {
  const { orders, deleteOrder } = useSupplierOrderStore();
  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [selectedDebtStatuses, setSelectedDebtStatuses] = useState<string[]>([]);

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('don_hang_ncc', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<SupplierOrder | null>(null);
  const [initialItemsForNewOrder, setInitialItemsForNewOrder] = useState<SupplierOrderItem[] | undefined>(undefined);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<SupplierOrder | null>(null);
  const [isQuickOCRModalOpen, setIsQuickOCRModalOpen] = useState(false);

  // Filter options with counts
  const statusOptions: FilterOption[] = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach((o) => {
      const s = o.status;
      counts[s] = (counts[s] || 0) + 1;
    });
    return [
      { label: 'Nháp (Chuẩn bị gửi)', value: 'nhap', count: counts['nhap'] || 0 },
      { label: 'Đã gửi cho NCC', value: 'da_gui_ncc', count: counts['da_gui_ncc'] || 0 },
      { label: 'Đang chuyển về', value: 'dang_chuyen', count: counts['dang_chuyen'] || 0 },
      { label: 'Đã nhập kho đủ', value: 'da_nhap_kho', count: counts['da_nhap_kho'] || 0 },
      { label: 'Đã hủy', value: 'huy', count: counts['huy'] || 0 },
    ];
  }, [orders]);

  const supplierOptions: FilterOption[] = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => {
      map[o.supplierName] = (map[o.supplierName] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({
      label: name,
      value: name,
      count,
    }));
  }, [orders]);

  const debtOptions: FilterOption[] = useMemo(() => {
    const hasDebt = orders.filter((o) => {
      const debt = o.debtAmount !== undefined ? o.debtAmount : (o.totalAmount || 0) - (o.paidAmount || 0);
      return debt > 0;
    }).length;
    const noDebt = orders.length - hasDebt;

    return [
      { label: 'Còn nợ NCC', value: 'has_debt', count: hasDebt },
      { label: 'Đã trả đủ', value: 'paid', count: noDebt },
    ];
  }, [orders]);

  // Filter logic
  const filteredData = useMemo(() => {
    return orders.filter((o) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        o.code.toLowerCase().includes(q) ||
        o.supplierName.toLowerCase().includes(q) ||
        o.creator.toLowerCase().includes(q) ||
        (o.notes && o.notes.toLowerCase().includes(q)) ||
        o.items.some(
          (i) =>
            i.flowerName.toLowerCase().includes(q) ||
            (i.flowerCode && i.flowerCode.toLowerCase().includes(q)) ||
            (i.customName && i.customName.toLowerCase().includes(q))
        );

      const matchStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(o.status);

      const matchSupplier =
        selectedSuppliers.length === 0 || selectedSuppliers.includes(o.supplierName);

      const debt = o.debtAmount !== undefined ? o.debtAmount : (o.totalAmount || 0) - (o.paidAmount || 0);
      const matchDebt =
        selectedDebtStatuses.length === 0 ||
        (selectedDebtStatuses.includes('has_debt') && debt > 0) ||
        (selectedDebtStatuses.includes('paid') && debt <= 0);

      return matchSearch && matchStatus && matchSupplier && matchDebt;
    });
  }, [orders, searchTerm, selectedStatuses, selectedSuppliers, selectedDebtStatuses]);

  // Paginated Data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

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
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} đơn đặt hàng NCC đã chọn?`)) {
      selectedIds.forEach((id) => deleteOrder(id));
      setSelectedIds(new Set());
      toast.success('Đã xóa các đơn hàng NCC đã chọn');
    }
  };

  const handleAddNew = () => {
    setOrderToEdit(null);
    setInitialItemsForNewOrder(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (order: SupplierOrder) => {
    setOrderToEdit(order);
    setInitialItemsForNewOrder(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = (order: SupplierOrder) => {
    if (confirm(`Bạn có chắc muốn xóa đơn đặt hàng NCC ${order.code}?`)) {
      deleteOrder(order.id);
      toast.success(`Đã xóa đơn đặt hàng NCC ${order.code}`);
    }
  };

  // Quick OCR handler from page toolbar
  const handleApplyItemsFromQuickOCR = (items: SupplierOrderItem[]) => {
    setIsQuickOCRModalOpen(false);
    setOrderToEdit(null);
    setInitialItemsForNewOrder(items);
    setIsFormOpen(true);
    toast.success(`Đã nhận diện thành công ${items.length} mặt hàng. Đang mở form tạo đơn mới!`);
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const renderStatusBadge = (status: SupplierOrder['status']) => {
    switch (status) {
      case 'nhap':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border/80">
            Nháp
          </span>
        );
      case 'da_gui_ncc':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Đã gửi NCC
          </span>
        );
      case 'dang_chuyen':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Đang chuyển
          </span>
        );
      case 'da_nhap_kho':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Đã nhập kho
          </span>
        );
      case 'huy':
        return (
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  // Render cell
  const renderCell = (order: SupplierOrder, colId: string) => {
    const totalQty =
      order.totalQuantity || order.items.reduce((sum, i) => sum + i.quantity, 0);
    const itemsSubtotal =
      order.itemsSubtotal || order.items.reduce((sum, i) => sum + i.amount, 0);
    const shippingFee = order.shippingFee || 0;
    const discount = order.discount || 0;
    const totalAmount =
      order.totalAmount || Math.max(0, itemsSubtotal + shippingFee - discount);
    const paidAmount = order.paidAmount || 0;
    const debtAmount =
      order.debtAmount !== undefined ? order.debtAmount : Math.max(0, totalAmount - paidAmount);

    switch (colId) {
      case 'code':
        return (
          <button
            type="button"
            onClick={() => setSelectedOrderDetail(order)}
            className="font-mono text-xs font-bold text-primary hover:underline flex items-center gap-1 text-left"
          >
            <span>{order.code}</span>
          </button>
        );

      case 'orderDate':
        return (
          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
            {formatDate(order.orderDate)}
          </span>
        );

      case 'supplier':
        return (
          <div className="flex flex-col min-w-0">
            <span
              onClick={() => setSelectedOrderDetail(order)}
              className="font-semibold text-xs text-foreground truncate cursor-pointer hover:text-primary transition-colors"
            >
              {order.supplierName}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {order.phone || order.warehouse || order.creator}
            </span>
          </div>
        );

      case 'totalQuantity':
        return (
          <span className="text-xs font-mono font-bold text-foreground">
            {formatNumber(totalQty)}
          </span>
        );

      case 'itemsSubtotal':
        return (
          <span className="text-xs font-mono text-foreground">
            {formatNumber(itemsSubtotal)}
          </span>
        );

      case 'shippingFee':
        return (
          <span className="text-xs font-mono text-muted-foreground">
            {shippingFee > 0 ? `+${formatNumber(shippingFee)}` : '0'}
          </span>
        );

      case 'discount':
        return (
          <span className="text-xs font-mono text-rose-600">
            {discount > 0 ? `-${formatNumber(discount)}` : '0'}
          </span>
        );

      case 'totalAmount':
        return (
          <span className="text-xs font-mono font-bold text-primary">
            {formatNumber(totalAmount)}
          </span>
        );

      case 'debt':
        return (
          <div className="flex flex-col">
            <span
              className={`text-xs font-mono font-bold ${
                debtAmount > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatNumber(debtAmount)}
            </span>
            {debtAmount <= 0 ? (
              <span className="text-[10px] text-emerald-600">Đã trả đủ</span>
            ) : (
              <span className="text-[10px] text-rose-500">Còn nợ NCC</span>
            )}
          </div>
        );

      case 'status':
        return renderStatusBadge(order.status);

      case 'actions':
        return (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(order);
              }}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Chỉnh sửa đơn"
            >
              <SquarePen size={14} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(order);
              }}
              className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-muted transition-colors"
              title="Xóa đơn"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // Render mobile card
  const renderMobileCard = (order: SupplierOrder) => {
    const totalQty =
      order.totalQuantity || order.items.reduce((sum, i) => sum + i.quantity, 0);
    const totalAmount = order.totalAmount || 0;
    const debt = order.debtAmount !== undefined ? order.debtAmount : Math.max(0, totalAmount - (order.paidAmount || 0));

    return (
      <div
        onClick={() => setSelectedOrderDetail(order)}
        className="p-3 bg-card border border-border rounded-xl space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-mono font-bold text-xs text-primary">{order.code}</span>
          {renderStatusBadge(order.status)}
        </div>
        <div className="font-semibold text-xs text-foreground">{order.supplierName}</div>
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
          <span>SL hoa: <strong className="text-foreground">{formatNumber(totalQty)}</strong></span>
          <span>Tổng: <strong className="text-primary font-mono">{formatNumber(totalAmount)}</strong></span>
          <span className={debt > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
            Nợ: {formatNumber(debt)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* TABS */}
      <div className="border-b border-border/80 px-4 pt-2 bg-card/60 backdrop-blur flex-shrink-0">
        <Tabs
          tabs={[
            {
              id: 'danhsach',
              label: `Danh sách đơn đặt NCC (${orders.length})`,
              icon: List,
            },
            {
              id: 'thongke',
              label: 'Báo cáo & Thống kê hoa nhập',
              icon: ChartColumn,
            },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as Tab)}
        />
      </div>

      {activeTab === 'danhsach' ? (
        <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3 overflow-hidden">
          {/* TOOLBAR */}
          <ListToolbar
            searchPlaceholder="Tìm mã đơn, tên NCC, người lập, tên hoa..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            columns={columns}
            onToggleColumn={handleToggleColumn}
            onUpdateColumn={handleUpdateColumn}
            onReorderColumns={handleReorderColumns}
            onResetColumns={handleResetColumns}
            selectedCount={selectedIds.size}
            onClearSelection={handleClearSelection}
            onDeleteMany={handleDeleteMany}
            actions={
              <div className="flex items-center gap-2">
                {orders.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm(`Bạn có chắc chắn muốn xóa toàn bộ ${orders.length} đơn nhập NCC hiện tại không?`)) {
                        useSupplierOrderStore.setState({ orders: [] });
                        try {
                          localStorage.removeItem('hkt-supplier-orders-storage');
                        } catch {
                          // Ignore
                        }
                        toast.success('Đã làm sạch toàn bộ đơn nhập NCC!');
                      }
                    }}
                    className="h-8 gap-1 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Xóa toàn bộ đơn nhập NCC hiện tại"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">Xóa tất cả đơn</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQuickOCRModalOpen(true)}
                  className="h-8 gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/10 shadow-xs"
                >
                  <Camera size={14} className="stroke-[2.2]" />
                  <span>📷 Lên đơn từ ảnh</span>
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAddNew}
                  className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Plus size={14} className="stroke-[2.5]" />
                  <span>Thêm đơn nhập</span>
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
                  placeholder="Nhà cung cấp / Vườn"
                  options={supplierOptions}
                  value={selectedSuppliers}
                  onChange={setSelectedSuppliers}
                />
                <MultiSelectFilter
                  icon={Coins}
                  placeholder="Công nợ NCC"
                  options={debtOptions}
                  value={selectedDebtStatuses}
                  onChange={setSelectedDebtStatuses}
                />
              </>
            }
          />

          {/* DATA TABLE */}
          <div className="flex-1 min-h-0">
            <DataTable<SupplierOrder>
              data={paginatedData}
              columns={columns}
              selectedIds={selectedIds}
              onToggleSelection={handleToggleSelection}
              onToggleAll={handleToggleAll}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onResizeColumn={(id, width) => handleUpdateColumn(id, { width })}
              renderCell={(columnId, order) => renderCell(order, columnId)}
              renderMobileCard={renderMobileCard}
              keyExtractor={(r) => r.id}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <DonHangNCCStats />
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <DonHangNCCFormModal
          isOpen={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setOrderToEdit(null);
            setInitialItemsForNewOrder(undefined);
          }}
          orderToEdit={orderToEdit}
          initialItems={initialItemsForNewOrder}
        />
      )}

      {/* Detail Drawer */}
      {selectedOrderDetail && (
        <DonHangNCCDetailModal
          order={selectedOrderDetail}
          onClose={() => setSelectedOrderDetail(null)}
          onEdit={(order) => {
            setSelectedOrderDetail(null);
            handleEdit(order);
          }}
        />
      )}

      {/* Quick OCR Modal from Toolbar */}
      {isQuickOCRModalOpen && (
        <ImageOrderReaderModal
          isOpen={isQuickOCRModalOpen}
          onClose={() => setIsQuickOCRModalOpen(false)}
          onApplyItems={handleApplyItemsFromQuickOCR}
        />
      )}
    </div>
  );
}
