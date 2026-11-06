import { History } from 'lucide-react';
import { ModuleHistory } from '@/components/data/ModuleHistory';
import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartColumn,
  CreditCard,
  List,
  Plus,
  Settings2,
  SquarePen,
  Trash2,
  Wallet,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import { MultiSelectFilter, type FilterOption } from '@/components/ui/MultiSelectFilter';
import type { ColumnDef } from '@/stores/createListStore';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { useCashStore, useFixedExpenseStore } from '@/stores/hoaKhangThanhStore';
import type { CashTransaction, FixedExpensePreset } from '@/types/hoaKhangThanh';
import { formatDate, todayISODate } from '@/lib/format';
import { ThuChiDrawer } from './ThuChiDrawer';
import { ThuChiStats } from './ThuChiStats';
import { FixedExpenseModal } from './FixedExpenseModal';

type Tab = 'danhsach' | 'thongke' | 'lichsu';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'code', label: 'Mã Phiếu', visible: true, minWidth: 120, width: 130, order: 0 },
  { id: 'date', label: 'Ngày ghi sổ', visible: true, minWidth: 100, width: 110, order: 1 },
  { id: 'type', label: 'Loại thu/chi', visible: true, minWidth: 100, width: 110, order: 2 },
  { id: 'category', label: 'Hạng mục', visible: true, minWidth: 180, width: 220, order: 3 },
  { id: 'amount', label: 'Số tiền', visible: true, minWidth: 120, width: 140, order: 4 },
  { id: 'paymentMethod', label: 'Hình thức', visible: true, minWidth: 150, width: 170, order: 5 },
  { id: 'partner', label: 'Đối tượng nộp / nhận', visible: true, minWidth: 160, width: 180, order: 6 },
  { id: 'creator', label: 'Người lập', visible: true, minWidth: 120, width: 130, order: 7 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 90, width: 90, order: 8 },
];

export default function ThuChiPage() {
  const { transactions, addTransaction, deleteTransaction } = useCashStore();
  const { presets } = useFixedExpenseStore();
  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFixedModalOpen, setIsFixedModalOpen] = useState(false);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('thu_chi', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [defaultCreateType, setDefaultCreateType] = useState<'income' | 'expense'>('income');
  const [selectedTransaction, setSelectedTransaction] = useState<CashTransaction | null>(null);

  const typeOptions: FilterOption[] = useMemo(() => {
    const incomeCount = transactions.filter((t) => t.type === 'income').length;
    const expenseCount = transactions.filter((t) => t.type === 'expense').length;
    return [
      { label: 'Phiếu thu', value: 'income', count: incomeCount },
      { label: 'Phiếu chi', value: 'expense', count: expenseCount },
    ];
  }, [transactions]);

  const methodOptions: FilterOption[] = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((t) => {
      map[t.paymentMethod] = (map[t.paymentMethod] || 0) + 1;
    });
    return Object.entries(map).map(([val, cnt]) => ({
      label: val,
      value: val,
      count: cnt,
    }));
  }, [transactions]);

  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        t.code.toLowerCase().includes(q) ||
        t.partner.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        t.creator.toLowerCase().includes(q);

      const matchType = selectedTypes.length === 0 || selectedTypes.includes(t.type);
      const matchMethod = selectedMethods.length === 0 || selectedMethods.includes(t.paymentMethod);

      return matchSearch && matchType && matchMethod;
    });
  }, [transactions, searchTerm, selectedTypes, selectedMethods]);

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

  const handleDeleteMany = () => {
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} phiếu đã chọn?`)) {
      selectedIds.forEach((id) => deleteTransaction(id));
      setSelectedIds(new Set());
      toast.success('Đã xóa các phiếu đã chọn');
    }
  };

  const handleCreate = (type: 'income' | 'expense') => {
    setSelectedTransaction(null);
    setDefaultCreateType(type);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleView = (item: CashTransaction) => {
    setSelectedTransaction(item);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleEdit = (item: CashTransaction) => {
    setSelectedTransaction(item);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleDelete = (item: CashTransaction) => {
    if (confirm(`Bạn có chắc muốn xóa phiếu ${item.code}?`)) {
      deleteTransaction(item.id);
      toast.success(`Đã xóa phiếu ${item.code}`);
    }
  };

  const formatNumber = (num?: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const handleQuickFixedExpense = (preset: FixedExpensePreset) => {
    const code = `PC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    addTransaction({
      code,
      type: 'expense',
      category: preset.category,
      amount: preset.amount,
      date: todayISODate(),
      paymentMethod: preset.paymentMethod,
      partner: 'Nội bộ / Tài xế xe',
      creator: 'Trần Thị Kim Thành',
      notes: preset.notes || `Chi tiền ${preset.name}`,
    });
    toast.success(
      `Đã thêm phiếu chi ${code}: ${preset.name} (${formatNumber(preset.amount)})`,
    );
  };

  const renderCell = (columnId: string, row: CashTransaction) => {
    switch (columnId) {
      case 'code':
        return (
          <button
            type="button"
            onClick={() => handleView(row)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border border-border bg-muted/40 hover:border-primary/40 hover:text-primary transition-colors text-left"
          >
            <span
              className={`p-0.5 rounded ${
                row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {row.type === 'income' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
            </span>
            <span>{row.code}</span>
          </button>
        );
      case 'date':
        return <span className="text-xs text-muted-foreground font-mono">{formatDate(row.date)}</span>;
      case 'type':
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              row.type === 'income'
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-500/10 text-rose-600 border-rose-200 dark:border-rose-800'
            }`}
          >
            {row.type === 'income' ? 'Phiếu thu' : 'Phiếu chi'}
          </span>
        );
      case 'category':
        return (
          <div>
            <span className="text-xs font-medium text-foreground">{row.category}</span>
            {row.notes && <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">{row.notes}</p>}
          </div>
        );
      case 'amount':
        return (
          <span
            className={`text-xs font-bold ${
              row.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {row.type === 'income' ? '+' : '-'} {formatNumber(row.amount)}
          </span>
        );
      case 'paymentMethod':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CreditCard size={12} />
            {row.paymentMethod}
          </span>
        );
      case 'partner':
        return <span className="text-xs text-foreground font-medium">{row.partner}</span>;
      case 'creator':
        return <span className="text-xs text-muted-foreground">{row.creator}</span>;
      case 'actions':
        return (
          <div className="flex items-center gap-1">
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

  const renderMobileCard = (row: CashTransaction, selected: boolean) => (
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
          className={`text-xs font-bold ${
            row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {row.type === 'income' ? '+' : '-'} {formatNumber(row.amount)}
        </span>
      </div>
      <div>
        <div className="text-sm font-semibold text-foreground">{row.category}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{row.partner} • {row.paymentMethod}</div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
        <span className="font-mono">{formatDate(row.date)}</span>
        <span>{row.creator}</span>
      </div>
    </div>
  );

  const activeFilterCount = (selectedTypes.length > 0 ? 1 : 0) + (selectedMethods.length > 0 ? 1 : 0);

  const handleClearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedMethods([]);
    setSearchTerm('');
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Top Segmented Tabs */}
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

      {activeTab === 'lichsu' ? (<ModuleHistory module="thu-chi" />) : activeTab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* Thanh Nút Chi Phí Cố Định (Bấm 1-click thêm ngay) */}
          <div className="mx-3 sm:mx-4 mt-2 mb-1 p-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 shrink-0">
                <Zap size={14} className="text-amber-600" />
                <span>Nút chi phí cố định:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleQuickFixedExpense(p)}
                    className="px-2.5 py-1 rounded-lg border border-border bg-card hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-foreground transition-all shadow-2xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title={`Bấm 1-click để ghi ngay phiếu chi: ${p.name} - ${formatNumber(p.amount)}`}
                  >
                    <span className="font-semibold">{p.name}:</span>
                    <span className="font-mono font-extrabold text-rose-600">{formatNumber(p.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFixedModalOpen(true)}
              className="h-7 px-2.5 rounded-lg border border-border bg-card text-[11px] font-semibold text-primary hover:bg-primary/5 flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Settings2 size={13} />
              <span>Quản lý nút chi</span>
            </button>
          </div>

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
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => handleCreate('expense')}
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                >
                  <ArrowUpRight size={14} className="stroke-[2.5px]" />
                  <span>Phiếu Chi</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleCreate('income')}
                  className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Plus size={14} className="stroke-[2.5px]" />
                  <span>Phiếu Thu</span>
                </Button>
              </div>
            }
            filters={
              <>
                <MultiSelectFilter
                  icon={Wallet}
                  placeholder="Loại thu chi"
                  options={typeOptions}
                  value={selectedTypes}
                  onChange={setSelectedTypes}
                />
                <MultiSelectFilter
                  icon={CreditCard}
                  placeholder="Hình thức thanh toán"
                  options={methodOptions}
                  value={selectedMethods}
                  onChange={setSelectedMethods}
                />
              </>
            }
          />

          <div className="flex-1 min-h-0">
            <DataTable<CashTransaction>
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
              renderCell={renderCell}
              renderMobileCard={renderMobileCard}
              keyExtractor={(r) => r.id}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <ThuChiStats />
        </div>
      )}

      {/* Drawer */}
      <ThuChiDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        transaction={selectedTransaction}
        mode={drawerMode}
        defaultType={defaultCreateType}
      />

      {/* Modal Quản lý nút chi phí cố định */}
      <FixedExpenseModal
        isOpen={isFixedModalOpen}
        onClose={() => setIsFixedModalOpen(false)}
      />
    </div>
  );
}
