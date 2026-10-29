import { useMemo, useState } from 'react';
import {
  Briefcase,
  Calendar,
  ChartColumn,
  Eye,
  EyeOff,
  KeyRound,
  List,
  LogIn,
  Phone,
  Plus,
  SquarePen,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import { MultiSelectFilter, type FilterOption } from '@/components/ui/MultiSelectFilter';
import type { ColumnDef } from '@/stores/createListStore';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import { useEmployeeStore } from '@/stores/hoaKhangThanhStore';
import { useAuthStore } from '@/stores/auth';
import type { Employee } from '@/types/hoaKhangThanh';
import { formatDate } from '@/lib/format';
import { NhanVienDrawer } from './NhanVienDrawer';
import { NhanVienStats } from './NhanVienStats';

type Tab = 'danhsach' | 'thongke';

const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'code', label: 'Mã NV', visible: true, minWidth: 90, width: 100, order: 0 },
  { id: 'fullName', label: 'Họ và tên', visible: true, minWidth: 160, width: 190, order: 1 },
  { id: 'account', label: 'Tài khoản & Mật khẩu', visible: true, minWidth: 190, width: 230, order: 2 },
  { id: 'phone', label: 'Số điện thoại', visible: true, minWidth: 120, width: 130, order: 3 },
  { id: 'department', label: 'Phòng ban', visible: true, minWidth: 140, width: 160, order: 4 },
  { id: 'position', label: 'Vị trí công việc', visible: true, minWidth: 140, width: 170, order: 5 },
  { id: 'salary', label: 'Lương cơ bản', visible: true, minWidth: 120, width: 130, order: 6 },
  { id: 'joinDate', label: 'Ngày vào làm', visible: true, minWidth: 100, width: 110, order: 7 },
  { id: 'status', label: 'Trạng thái', visible: true, minWidth: 110, width: 120, order: 8 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 90, width: 90, order: 9 },
];

export default function NhanVienPage() {
  const { employees, deleteEmployee } = useEmployeeStore();
  const { user: currentUser, loginAsEmployee } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassMap, setShowPassMap] = useState<Record<string, boolean>>({});

  // Filters
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('nhan_vien', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const deptOptions: FilterOption[] = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => {
      map[e.department] = (map[e.department] || 0) + 1;
    });
    return Object.entries(map).map(([val, cnt]) => ({
      label: val,
      value: val,
      count: cnt,
    }));
  }, [employees]);

  const statusOptions: FilterOption[] = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach((e) => {
      map[e.status] = (map[e.status] || 0) + 1;
    });
    return [
      { label: 'Chính thức', value: 'active', count: map['active'] || 0 },
      { label: 'Thử việc', value: 'probation', count: map['probation'] || 0 },
      { label: 'Nghỉ phép', value: 'leave', count: map['leave'] || 0 },
      { label: 'Thôi việc', value: 'resigned', count: map['resigned'] || 0 },
    ];
  }, [employees]);

  const filteredData = useMemo(() => {
    return employees.filter((e) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        e.phone.includes(q) ||
        e.email.toLowerCase().includes(q);

      const matchDept = selectedDepts.length === 0 || selectedDepts.includes(e.department);
      const matchStatus = selectedStatuses.length === 0 || selectedStatuses.includes(e.status);

      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, selectedDepts, selectedStatuses]);

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
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} nhân viên đã chọn?`)) {
      selectedIds.forEach((id) => deleteEmployee(id));
      setSelectedIds(new Set());
      toast.success('Đã xóa các nhân viên đã chọn');
    }
  };

  const handleAddNew = () => {
    setSelectedEmployee(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleView = (item: Employee) => {
    setSelectedEmployee(item);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleEdit = (item: Employee) => {
    setSelectedEmployee(item);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleDelete = (item: Employee) => {
    if (confirm(`Bạn có chắc muốn xóa nhân viên "${item.fullName}"?`)) {
      deleteEmployee(item.id);
      toast.success(`Đã xóa nhân viên ${item.fullName}`);
    }
  };

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const toggleShowPass = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassMap((p) => ({ ...p, [id]: !p[id] }));
  };

  const handleQuickLogin = (row: Employee, e?: React.MouseEvent) => {
    e?.stopPropagation();
    loginAsEmployee(row);
    toast.success(`Đã đăng nhập bằng tài khoản: ${row.fullName} (${row.position || 'Nhân viên'})`);
  };

  const renderCell = (columnId: string, row: Employee) => {
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
      case 'fullName':
        return (
          <div className="flex items-center gap-2 cursor-pointer hover:text-primary" onClick={() => handleView(row)}>
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {row.fullName.charAt(0)}
            </div>
            <div>
              <span className="text-xs font-medium text-foreground block">{row.fullName}</span>
              {row.email && <span className="text-[11px] text-muted-foreground block">{row.email}</span>}
            </div>
          </div>
        );
      case 'account': {
        const isOnline = currentUser?.id === row.id;
        const isRevealed = !!showPassMap[row.id];
        const username = row.username || row.code.toLowerCase().replace('-', '');
        const password = row.password || '123456';
        return (
          <div className="flex flex-col gap-1 py-0.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-foreground bg-muted/70 px-1.5 py-0.5 rounded border border-border/60">
                {username}
              </span>
              {row.role === 'admin' ? (
                <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400 px-1.5 py-0.2 rounded border border-indigo-200 dark:border-indigo-800">
                  Admin
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                  NV
                </span>
              )}
              {isOnline && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                  Online
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded border border-border">
                <KeyRound size={11} className="text-muted-foreground/70" />
                <span className="font-semibold text-foreground tracking-wider">{isRevealed ? password : '••••••'}</span>
                <button
                  type="button"
                  onClick={(e) => toggleShowPass(row.id, e)}
                  className="p-0.5 hover:text-foreground text-muted-foreground/70 transition-colors ml-0.5"
                  title={isRevealed ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                </button>
              </div>
              {!isOnline && (
                <button
                  type="button"
                  onClick={(e) => handleQuickLogin(row, e)}
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded text-primary hover:bg-primary/10 border border-primary/20 transition-colors"
                  title="Đăng nhập tài khoản này"
                >
                  <LogIn size={11} />
                  <span>Đăng nhập</span>
                </button>
              )}
            </div>
          </div>
        );
      }
      case 'phone':
        return (
          <a href={`tel:${row.phone}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono">
            <Phone size={12} className="text-muted-foreground" />
            {row.phone}
          </a>
        );
      case 'department':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Briefcase size={12} />
            {row.department}
          </span>
        );
      case 'position':
        return <span className="text-xs font-medium text-foreground">{row.position}</span>;
      case 'salary':
        return <span className="text-xs font-semibold text-foreground font-mono">{formatNumber(row.salary)}</span>;
      case 'joinDate':
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Calendar size={12} />
            {formatDate(row.joinDate)}
          </span>
        );
      case 'status': {
        const badges: Record<string, { label: string; class: string }> = {
          active: { label: 'Chính thức', class: 'bg-emerald-500/10 text-emerald-600 border-emerald-200 dark:border-emerald-800' },
          probation: { label: 'Thử việc', class: 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800' },
          leave: { label: 'Nghỉ phép', class: 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-800' },
          resigned: { label: 'Đã thôi việc', class: 'bg-muted text-muted-foreground border-border' },
        };
        const badge = badges[row.status] || { label: row.status, class: 'bg-muted text-muted-foreground border-border' };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${badge.class}`}>
            {badge.label}
          </span>
        );
      }
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

  const renderMobileCard = (row: Employee, selected: boolean) => {
    const isOnline = currentUser?.id === row.id;
    const isRevealed = !!showPassMap[row.id];
    const username = row.username || row.code.toLowerCase().replace('-', '');
    const password = row.password || '123456';

    return (
      <div
        onClick={() => handleView(row)}
        className={`p-3.5 rounded-xl border space-y-2.5 transition-all cursor-pointer ${
          selected ? 'bg-primary/5 border-primary/40' : 'bg-card border-border hover:shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-muted/60 border border-border">
              {row.code}
            </span>
            {isOnline && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200">
                Online
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-emerald-600 font-mono">{formatNumber(row.salary)}</span>
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{row.fullName}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{row.position} • {row.department}</div>
        </div>

        {/* Account credential info */}
        <div className="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono font-semibold text-foreground">{username}</span>
            <span className="text-muted-foreground/60">•</span>
            <span className="font-mono text-muted-foreground">{isRevealed ? password : '••••••'}</span>
            <button
              type="button"
              onClick={(e) => toggleShowPass(row.id, e)}
              className="p-0.5 text-muted-foreground hover:text-foreground"
            >
              {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>
          </div>
          {!isOnline && (
            <button
              type="button"
              onClick={(e) => handleQuickLogin(row, e)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 transition-all"
            >
              <LogIn size={11} />
              <span>Đăng nhập</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <span>{row.phone}</span>
          <span className="font-mono">{formatDate(row.joinDate)}</span>
        </div>
      </div>
    );
  };

  const activeFilterCount = (selectedDepts.length > 0 ? 1 : 0) + (selectedStatuses.length > 0 ? 1 : 0);

  const handleClearAllFilters = () => {
    setSelectedDepts([]);
    setSelectedStatuses([]);
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
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'danhsach' ? (
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
              <Button
                size="sm"
                onClick={handleAddNew}
                className="h-8 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus size={14} className="stroke-[2.5px]" />
                <span>Thêm mới</span>
              </Button>
            }
            filters={
              <>
                <MultiSelectFilter
                  icon={Briefcase}
                  placeholder="Phòng ban"
                  options={deptOptions}
                  value={selectedDepts}
                  onChange={setSelectedDepts}
                />
                <MultiSelectFilter
                  icon={Users}
                  placeholder="Trạng thái"
                  options={statusOptions}
                  value={selectedStatuses}
                  onChange={setSelectedStatuses}
                />
              </>
            }
          />

          <div className="flex-1 min-h-0">
            <DataTable<Employee>
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
          <NhanVienStats />
        </div>
      )}

      {/* Drawer */}
      <NhanVienDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        employee={selectedEmployee}
        mode={drawerMode}
      />
    </div>
  );
}
