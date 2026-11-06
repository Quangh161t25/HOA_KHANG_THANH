import { History } from 'lucide-react';
import { ModuleHistory } from '@/components/data/ModuleHistory';
import { useMemo, useState } from 'react';
import {
  ChartColumn,
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
import type { ColumnDef } from '@/stores/createListStore';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { useFlowerStore } from '@/stores/hoaKhangThanhStore';
import type { Flower } from '@/types/hoaKhangThanh';
import { validateFlowerAliases } from '@/lib/flowerValidation';
import { HoaDrawer } from './HoaDrawer';
import { HoaStats } from './HoaStats';

type Tab = 'danhsach' | 'thongke' | 'lichsu';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'code', label: 'Mã hoa', visible: true, minWidth: 120, width: 140, order: 0 },
  { id: 'name', label: 'Tên hoa', visible: true, minWidth: 260, width: 360, order: 1 },
  { id: 'customName', label: 'Tên riêng (cách nhau dấu ,)', visible: true, minWidth: 260, width: 320, order: 2 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 90, width: 100, order: 3 },
];

export default function HoaPage() {
  const { flowers, deleteFlower, updateFlower } = useFlowerStore();
  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('hoa', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedFlower, setSelectedFlower] = useState<Flower | null>(null);

  const filteredData = useMemo(() => {
    return flowers.filter((f) => {
      const q = searchTerm.toLowerCase().trim();
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        (f.customName && f.customName.toLowerCase().includes(q))
      );
    });
  }, [flowers, searchTerm]);

  
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
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} giống hoa đã chọn?`)) {
      selectedIds.forEach((id) => deleteFlower(id));
      setSelectedIds(new Set());
      toast.success('Đã xóa các loại hoa đã chọn');
    }
  };

  const handleAddNew = () => {
    setSelectedFlower(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleEdit = (f: Flower) => {
    setSelectedFlower(f);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleView = (f: Flower) => {
    setSelectedFlower(f);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleDelete = (f: Flower) => {
    if (confirm(`Bạn có chắc muốn xóa giống hoa "${f.name}"?`)) {
      deleteFlower(f.id);
      toast.success(`Đã xóa giống hoa ${f.name}`);
    }
  };

  const renderCell = (columnId: string, row: Flower) => {
    switch (columnId) {
      case 'code':
        return (
          <button
            type="button"
            onClick={() => handleView(row)}
            className="px-2.5 py-1 rounded text-xs font-mono font-bold border border-border bg-muted/40 text-primary hover:border-primary/50 transition-colors text-left"
          >
            {row.code}
          </button>
        );
      case 'name':
        return (
          <div className="cursor-pointer hover:text-primary py-0.5" onClick={() => handleView(row)}>
            <div className="text-xs font-bold text-foreground">{row.name}</div>
          </div>
        );
      case 'customName':
        return (
          <div className="py-0.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              key={`${row.id}-${row.customName || ''}`}
              defaultValue={row.customName || ''}
              placeholder="Nhiều tên cách nhau dấu phẩy (,)..."
              onBlur={(e) => {
                const newVal = e.target.value.trim();
                if (newVal !== (row.customName || '')) {
                  const check = validateFlowerAliases(newVal, row.id, flowers, row.name);
                  if (!check.isValid) {
                    toast.error(check.error);
                    e.target.value = row.customName || '';
                    return;
                  }
                  updateFlower(row.id, { customName: check.cleanedCustomName });
                  e.target.value = check.cleanedCustomName;
                  toast.success(`Đã lưu tên riêng cho ${row.name}: "${check.cleanedCustomName || '(trống)'}"`);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full max-w-[320px] h-8 px-2.5 rounded-lg border border-border bg-background hover:border-primary/60 focus:border-primary focus:ring-1 focus:ring-primary/20 text-xs font-semibold text-primary focus:outline-none transition-colors placeholder:text-muted-foreground/40 placeholder:font-normal"
            />
          </div>
        );
      case 'actions':
        return (
          <div className="flex items-center gap-2">
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

  const renderMobileCard = (row: Flower, selected: boolean) => (
    <div
      onClick={() => handleView(row)}
      className={`p-3.5 rounded-xl border space-y-2 transition-all cursor-pointer ${
        selected ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-muted/60 border border-border text-primary">
          {row.code}
        </span>
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleEdit(row)}
            className="p-1 rounded text-primary hover:bg-primary/10"
            title="Chỉnh sửa"
          >
            <SquarePen size={14} />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            title="Xóa"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <div className="text-sm font-bold text-foreground">{row.name}</div>
      <div className="pt-1.5" onClick={(e) => e.stopPropagation()}>
        <label className="text-[11px] text-muted-foreground block mb-1">
          Tên riêng (cách nhau dấu ,):
        </label>
        <input
          type="text"
          key={`m-${row.id}-${row.customName || ''}`}
          defaultValue={row.customName || ''}
          placeholder="Nhiều tên cách nhau dấu phẩy (,)..."
          onBlur={(e) => {
            const newVal = e.target.value.trim();
            if (newVal !== (row.customName || '')) {
              const check = validateFlowerAliases(newVal, row.id, flowers, row.name);
              if (!check.isValid) {
                toast.error(check.error);
                e.target.value = row.customName || '';
                return;
              }
              updateFlower(row.id, { customName: check.cleanedCustomName });
              e.target.value = check.cleanedCustomName;
              toast.success(`Đã lưu tên riêng cho ${row.name}: "${check.cleanedCustomName || '(trống)'}"`);
            }
          }}
          className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-semibold text-primary focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );

  const activeFilterCount = searchTerm ? 1 : 0;

  const handleClearAllFilters = () => {
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

      {activeTab === 'lichsu' ? (<ModuleHistory module="hoa" />) : activeTab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          <ListToolbar
            showBack={true}
            searchPlaceholder="Tìm kiếm mã hoa, tên hoa..."
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
              <Button
                size="sm"
                onClick={handleAddNew}
                className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus size={14} className="stroke-[2.5px]" />
                <span>Thêm mới</span>
              </Button>
            }
            filters={null}
          />

          {/* Banner hướng dẫn đặt tên riêng & chống trùng */}
          <div className="px-3 sm:px-4 py-1.5 bg-primary/5 border-y border-border/60 flex items-center gap-2 text-[11px] text-muted-foreground flex-shrink-0">
            <Tag size={13} className="text-primary flex-shrink-0" />
            <span>
              <strong>Quy tắc đặt tên:</strong> Mỗi hoa có thể có nhiều tên riêng cách nhau bởi dấu phẩy (<code className="text-primary font-bold">,</code>). Tên hoa và các tên riêng không được trùng nhau giữa các giống hoa (kể cả chữ hoa chữ thường).
            </span>
          </div>

          <div className="flex-1 min-h-0">
            <DataTable<Flower>
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
          <HoaStats />
        </div>
      )}

      {isDrawerOpen && (
        <HoaDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          flower={selectedFlower}
          mode={drawerMode}
        />
      )}
    </div>
  );
}
