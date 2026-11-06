import { History } from 'lucide-react';
import { ModuleHistory } from '@/components/data/ModuleHistory';
import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  ChartColumn,
  CheckCircle2,
  List,
  Plus,
  Tag,
  Warehouse,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import { MultiSelectFilter, type FilterOption } from '@/components/ui/MultiSelectFilter';
import type { ColumnDef } from '@/stores/createListStore';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { useInventoryStore } from '@/stores/hoaKhangThanhStore';
import type { InventoryItem } from '@/types/hoaKhangThanh';
import { TonKhoDrawer } from './TonKhoDrawer';
import { TonKhoStats } from './TonKhoStats';

type Tab = 'danhsach' | 'thongke' | 'lichsu';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'flowerCode', label: 'Mã hoa', visible: true, minWidth: 100, width: 110, order: 0 },
  { id: 'flowerName', label: 'Tên hoa tươi', visible: true, minWidth: 170, width: 200, order: 1 },
  { id: 'warehouse', label: 'Kho bảo quản', visible: true, minWidth: 140, width: 160, order: 2 },
  { id: 'currentStock', label: 'Tồn thực tế', visible: true, minWidth: 100, width: 110, order: 3 },
  { id: 'unit', label: 'ĐVT', visible: true, minWidth: 80, width: 90, order: 4 },
  { id: 'minStock', label: 'Ngưỡng min', visible: true, minWidth: 100, width: 110, order: 5 },
  { id: 'costPrice', label: 'Giá vốn', visible: true, minWidth: 100, width: 110, order: 6 },
  { id: 'freshness', label: 'Độ tươi & Ngày nhập', visible: true, minWidth: 160, width: 190, order: 7 },
  { id: 'status', label: 'Trạng thái', visible: true, minWidth: 110, width: 120, order: 8 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 120, width: 130, order: 9 },
];

export default function TonKhoPage() {
  const { inventory } = useInventoryStore();
  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');

  // Filters
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('ton_kho', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'import' | 'export' | 'view'>('import');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const warehouseOptions: FilterOption[] = useMemo(() => {
    const map: Record<string, number> = {};
    inventory.forEach((i) => {
      map[i.warehouse] = (map[i.warehouse] || 0) + 1;
    });
    return Object.entries(map).map(([wh, count]) => ({ label: wh, value: wh, count }));
  }, [inventory]);

  const statusOptions: FilterOption[] = [
    { label: 'Mức an toàn', value: 'normal' },
    { label: 'Sắp hết hàng (Dưới min)', value: 'low' },
  ];

  const filteredData = useMemo(() => {
    return inventory.filter((item) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        item.flowerName.toLowerCase().includes(q) ||
        item.flowerCode.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q);

      const matchWarehouse =
        selectedWarehouses.length === 0 || selectedWarehouses.includes(item.warehouse);
      const isLow = item.currentStock <= item.minStock;
      const matchStatus =
        selectedStatuses.length === 0 ||
        (selectedStatuses.includes('low') && isLow) ||
        (selectedStatuses.includes('normal') && !isLow);

      return matchSearch && matchWarehouse && matchStatus;
    });
  }, [inventory, searchTerm, selectedWarehouses, selectedStatuses]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, page, pageSize]);

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

  const handleOpenImport = (item?: InventoryItem) => {
    setSelectedItem(item || null);
    setDrawerMode('import');
    setIsDrawerOpen(true);
  };

  const handleOpenExport = (item?: InventoryItem) => {
    setSelectedItem(item || null);
    setDrawerMode('export');
    setIsDrawerOpen(true);
  };

  const handleView = (item: InventoryItem) => {
    setSelectedItem(item);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const renderCell = (columnId: string, row: InventoryItem) => {
    const isLow = row.currentStock <= row.minStock;
    switch (columnId) {
      case 'flowerCode':
        return (
          <button
            type="button"
            onClick={() => handleView(row)}
            className="px-2 py-0.5 rounded text-xs font-mono font-medium border border-border bg-muted/40 text-foreground hover:border-primary/40 hover:text-primary transition-colors text-left"
          >
            {row.flowerCode}
          </button>
        );
      case 'flowerName':
        return (
          <div className="text-xs font-semibold text-foreground cursor-pointer hover:text-primary" onClick={() => handleView(row)}>
            <div>{row.flowerName}</div>
          </div>
        );
      case 'warehouse':
        return <span className="text-xs text-muted-foreground">{row.warehouse}</span>;
      case 'currentStock':
        return (
          <span className={`text-xs font-extrabold ${isLow ? 'text-amber-600' : 'text-foreground'}`}>
            {row.currentStock.toLocaleString('vi-VN')}
          </span>
        );
      case 'unit':
        return <span className="text-xs text-muted-foreground">{row.unit}</span>;
      case 'minStock':
        return <span className="text-xs text-muted-foreground">{row.minStock} {row.unit}</span>;
      case 'costPrice':
        return <span className="text-xs text-muted-foreground font-mono">{formatNumber(row.costPrice)}</span>;
      case 'freshness':
        return (
          <div className="text-xs text-muted-foreground truncate max-w-[170px]" title={row.freshness}>
            {row.freshness}
          </div>
        );
      case 'status':
        return isLow ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
            <AlertTriangle size={12} /> Sắp hết
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
            <CheckCircle2 size={12} /> Đầy đủ
          </span>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleOpenImport(row)}
              className="px-2 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              + Nhập
            </button>
            <button
              type="button"
              onClick={() => handleOpenExport(row)}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            >
              - Xuất
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (row: InventoryItem, selected: boolean) => (
    <div
      onClick={() => handleView(row)}
      className={`p-3.5 rounded-xl border space-y-2.5 transition-all cursor-pointer ${
        selected ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-muted/60 border border-border">
          {row.flowerCode}
        </span>
        <span className={`text-xs font-bold ${row.currentStock <= row.minStock ? 'text-amber-600' : 'text-emerald-600'}`}>
          {row.currentStock} {row.unit}
        </span>
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{row.flowerName}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{row.warehouse}</div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
        <span>Min: {row.minStock} {row.unit}</span>
        <span>{row.freshness}</span>
      </div>
    </div>
  );

  const activeFilterCount = (selectedWarehouses.length > 0 ? 1 : 0) + (selectedStatuses.length > 0 ? 1 : 0);

  const handleClearAllFilters = () => {
    setSelectedWarehouses([]);
    setSelectedStatuses([]);
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

      {activeTab === 'lichsu' ? (<ModuleHistory module="ton-kho" />) : activeTab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <ListToolbar
            showBack={true}
            searchPlaceholder="Tìm kiếm . . ."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
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
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenExport()}
                  className="h-8 gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <ArrowUpRight size={14} />
                  <span>Xuất hủy</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleOpenImport()}
                  className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  <Plus size={14} className="stroke-[2.5px]" />
                  <span>Nhập kho</span>
                </Button>
              </div>
            }
            filters={
              <>
                <MultiSelectFilter
                  icon={Warehouse}
                  placeholder="Kho bảo quản"
                  options={warehouseOptions}
                  value={selectedWarehouses}
                  onChange={setSelectedWarehouses}
                />
                <MultiSelectFilter
                  icon={Tag}
                  placeholder="Mức tồn"
                  options={statusOptions}
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
              </>
            }
          />

          <div className="flex-1 min-h-0">
            <DataTable<InventoryItem>
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
              keyExtractor={(r) => r.flowerId}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TonKhoStats />
        </div>
      )}

      <TonKhoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        inventoryItem={selectedItem}
        defaultType={drawerMode}
      />
    </div>
  );
}
