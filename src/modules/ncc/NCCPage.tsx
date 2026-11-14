import { History } from 'lucide-react';
import { ModuleHistory } from '@/components/data/ModuleHistory';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChartColumn,
  List,
  MapPin,
  Plus,
  Receipt,
  RotateCcw,
  SquarePen,
  Star,
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
import { useColumnSettings } from '@/hooks/useColumnSettings';
import {
  calculateSupplierFinancials,
  clearAllDebtAndOrderData,
  useDebtStore,
  useSupplierOrderStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import type { Supplier } from '@/types/hoaKhangThanh';
import { NCCDrawer } from './NCCDrawer';
import { NCCStats } from './NCCStats';

type Tab = 'danhsach' | 'thongke' | 'lichsu';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'code', label: 'Mã NCC', visible: true, minWidth: 95, width: 105, order: 0 },
  { id: 'name', label: 'Tên Nhà Cung Cấp', visible: true, minWidth: 180, width: 220, order: 1 },
  { id: 'contactPerson', label: 'Người đại diện', visible: true, minWidth: 120, width: 130, order: 2 },
  { id: 'phone', label: 'Số điện thoại', visible: true, minWidth: 110, width: 120, order: 3 },
  { id: 'oldDebt', label: 'Công nợ cũ', visible: true, minWidth: 115, width: 125, order: 4 },
  { id: 'importAmount', label: 'Tiền nhập hoa', visible: true, minWidth: 125, width: 135, order: 5 },
  { id: 'paidAmount', label: 'Tiền trả NCC', visible: true, minWidth: 120, width: 130, order: 6 },
  { id: 'finalDebt', label: 'Công nợ cuối', visible: true, minWidth: 125, width: 135, order: 7 },
  { id: 'status', label: 'Trạng thái', visible: true, minWidth: 105, width: 115, order: 8 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 80, width: 85, order: 9 },
  { id: 'address', label: 'Khu vực / Địa chỉ', visible: false, minWidth: 160, width: 200, order: 10 },
  { id: 'specialties', label: 'Hoa chủ lực', visible: false, minWidth: 150, width: 170, order: 11 },
  { id: 'rating', label: 'Đánh giá', visible: false, minWidth: 85, width: 95, order: 12 },
];

export default function NCCPage() {
  const navigate = useNavigate();
  const { suppliers, deleteSupplier } = useSupplierStore();
  const { records: debtRecords } = useDebtStore();
  const { orders: supplierOrders } = useSupplierOrderStore();

  // Đồng bộ và tính toán chính xác tiền nhập hoa, tiền trả, công nợ cuối cho từng NCC từ sổ công nợ & đơn nhập
  const enrichedSuppliers = useMemo(() => {
    return suppliers.map((s) => {
      const fin = calculateSupplierFinancials(s, debtRecords, supplierOrders);
      return {
        ...s,
        oldDebt: fin.oldDebt,
        importAmount: fin.importAmount,
        paidAmount: fin.paidAmount,
        finalDebt: fin.finalDebt,
        totalDebt: fin.totalDebt,
      };
    });
  }, [suppliers, debtRecords, supplierOrders]);
  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('ncc', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const statusOptions: FilterOption[] = useMemo(() => {
    const map: Record<string, number> = {};
    enrichedSuppliers.forEach((s) => {
      map[s.status] = (map[s.status] || 0) + 1;
    });
    return [
      { label: 'Đang hợp tác', value: 'active', count: map['active'] || 0 },
      { label: 'Tạm ngưng', value: 'inactive', count: map['inactive'] || 0 },
    ];
  }, [enrichedSuppliers]);

  const regionOptions: FilterOption[] = [
    { label: 'Lâm Đồng / Đà Lạt', value: 'Lâm Đồng' },
    { label: 'Hà Nội', value: 'Hà Nội' },
    { label: 'Đồng Tháp', value: 'Đồng Tháp' },
    { label: 'TP. Hồ Chí Minh', value: 'Hồ Chí Minh' },
  ];

  const filteredData = useMemo(() => {
    return enrichedSuppliers.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.phone.includes(q);

      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);
      const matchRegion =
        selectedRegions.length === 0 ||
        selectedRegions.some((r) => s.address.toLowerCase().includes(r.toLowerCase()));

      return matchSearch && matchStatus && matchRegion;
    });
  }, [enrichedSuppliers, searchTerm, selectedStatuses, selectedRegions]);

  
  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = (ids: string[]) => {
    setSelectedIds((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  };

  const handleDeleteMany = () => {
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} nhà cung cấp đã chọn?`)) {
      selectedIds.forEach((id) => deleteSupplier(id));
      setSelectedIds(new Set());
      toast.success('Đã xóa các nhà cung cấp đã chọn');
    }
  };

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleEdit = (s: Supplier) => {
    setSelectedSupplier(s);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleView = (s: Supplier) => {
    setSelectedSupplier(s);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleDelete = (s: Supplier) => {
    if (confirm(`Bạn có chắc muốn xóa nhà cung cấp "${s.name}"?`)) {
      deleteSupplier(s.id);
      toast.success(`Đã xóa nhà cung cấp ${s.name}`);
    }
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const renderCell = (columnId: string, row: Supplier) => {
    switch (columnId) {
      case 'code':
        return (
          <button
            type="button"
            onClick={() => handleView(row)}
            className="px-2 py-0.5 rounded text-xs font-mono font-medium border border-border bg-muted/40 text-foreground hover:border-primary/40 hover:text-primary transition-colors text-left"
          >
            {row.code}
          </button>
        );
      case 'name':
        return (
          <div className="text-xs font-semibold text-foreground cursor-pointer hover:text-primary" onClick={() => handleView(row)}>
            <div>{row.name}</div>
          </div>
        );
      case 'contactPerson':
        return <span className="text-xs font-medium text-foreground">{row.contactPerson}</span>;
      case 'phone':
        return (
          <a href={`tel:${row.phone}`} className="text-xs text-primary hover:underline font-medium">
            {row.phone}
          </a>
        );
      case 'oldDebt':
        return (
          <span className="text-xs font-mono font-medium text-muted-foreground">
            {formatNumber(row.oldDebt || 0)}
          </span>
        );
      case 'importAmount':
        return (
          <span className="text-xs font-mono font-bold text-foreground">
            {formatNumber(row.importAmount || 0)}
          </span>
        );
      case 'paidAmount':
        return (
          <span className="text-xs font-mono font-bold text-emerald-600">
            {formatNumber(row.paidAmount || 0)}
          </span>
        );
      case 'finalDebt': {
        const finalDebt =
          row.finalDebt !== undefined
            ? row.finalDebt
            : (row.oldDebt || 0) + (row.importAmount || 0) - (row.paidAmount || 0);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cong-no-ncc?nccId=${row.id}`);
            }}
            className="group inline-flex items-center gap-1 hover:underline text-left cursor-pointer"
            title="Nhấn để xem sổ chi tiết công nợ của NCC này"
          >
            <span className={`text-xs font-mono font-extrabold ${finalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatNumber(finalDebt)}
            </span>
          </button>
        );
      }
      case 'address':
        return <span className="text-xs text-muted-foreground truncate max-w-[180px]">{row.address}</span>;
      case 'specialties':
        return (
          <span className="text-xs text-muted-foreground truncate max-w-[160px]">
            {row.specialties.join(', ')}
          </span>
        );
      case 'rating':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-500">
            <Star size={12} className="fill-amber-500" />
            {row.rating}
          </span>
        );
      case 'totalDebt':
        return (
          <span className={`text-xs font-mono font-bold ${row.totalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatNumber(row.totalDebt)}
          </span>
        );
      case 'status':
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              row.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            {row.status === 'active' ? 'Đang hợp tác' : 'Tạm ngưng'}
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(`/cong-no-ncc?nccId=${row.id}`)}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
              title="Xem sổ công nợ NCC này"
            >
              <Receipt size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleEdit(row)}
              className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
              title="Chỉnh sửa"
            >
              <SquarePen size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xóa"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (row: Supplier, selected: boolean) => {
    const finalDebt =
      row.finalDebt !== undefined
        ? row.finalDebt
        : (row.oldDebt || 0) + (row.importAmount || 0) - (row.paidAmount || 0);

    return (
      <div
        onClick={() => handleView(row)}
        className={`p-3.5 rounded-xl border space-y-2.5 transition-all cursor-pointer ${
          selected ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-muted/60 border border-border">
            {row.code}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              row.status === 'active'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
                : 'bg-muted text-muted-foreground border border-border'
            }`}
          >
            {row.status === 'active' ? 'Đang hợp tác' : 'Tạm ngưng'}
          </span>
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{row.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{row.contactPerson} • {row.phone}</div>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono pt-2 border-t border-border/50">
          <div>
            <span className="text-muted-foreground block text-[10px]">Nợ cũ:</span>
            <span className="font-medium text-muted-foreground">{formatNumber(row.oldDebt || 0)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Tiền nhập:</span>
            <span className="font-bold text-foreground">{formatNumber(row.importAmount || 0)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Đã trả:</span>
            <span className="font-bold text-emerald-600">{formatNumber(row.paidAmount || 0)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px]">Nợ cuối:</span>
            <span className={`font-extrabold ${finalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatNumber(finalDebt)}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cong-no-ncc?nccId=${row.id}`);
            }}
            className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
          >
            <Receipt size={12} /> Xem sổ công nợ NCC
          </button>
        </div>
      </div>
    );
  };

  const activeFilterCount = (selectedStatuses.length > 0 ? 1 : 0) + (selectedRegions.length > 0 ? 1 : 0);

  const handleClearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedRegions([]);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      <div className="px-3 sm:px-4 pt-3 pb-1 shrink-0 bg-background">
        <Tabs<Tab>
          tabs={[
            { id: 'danhsach', label: 'Danh sách', icon: List },
            { id: 'thongke', label: 'Thống kê', icon: ChartColumn },
            { id: 'lichsu', label: 'Lịch sử thao tác', icon: History },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'lichsu' ? (<ModuleHistory module="ncc" />) : activeTab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <ListToolbar
            showBack={true}
            searchPlaceholder="Tìm kiếm . . ."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
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
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/cong-no-ncc')}
                  className="h-8 gap-1 text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  title="Chuyển sang module Sổ công nợ NCC"
                >
                  <Receipt size={13} />
                  <span className="hidden sm:inline">Sổ công nợ NCC</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ số liệu công nợ của tất cả NCC về 0?')) {
                      clearAllDebtAndOrderData();
                      toast.success('Đã đưa công nợ của tất cả NCC về 0!');
                    }
                  }}
                  className="h-8 gap-1 text-xs text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Đặt lại toàn bộ số liệu công nợ về 0"
                >
                  <RotateCcw size={13} />
                  <span className="hidden sm:inline">Đặt lại nợ về 0</span>
                </Button>
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
                  placeholder="Trạng thái"
                  options={statusOptions}
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
                <MultiSelectFilter
                  icon={MapPin}
                  placeholder="Khu vực"
                  options={regionOptions}
                  value={selectedRegions}
                  onChange={setSelectedRegions}
                />
              </>
            }
          />

          <div className="flex-1 min-h-0">
            <DataTable<Supplier>
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
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <NCCStats />
        </div>
      )}

      {isDrawerOpen && (
        <NCCDrawer
          isOpen
          onClose={() => setIsDrawerOpen(false)}
          supplier={selectedSupplier}
          mode={drawerMode}
        />
      )}
    </div>
  );
}
