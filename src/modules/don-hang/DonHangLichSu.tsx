import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';
import {
  ArrowRight,
  Calendar,
  Eye,
  FileSpreadsheet,
  History,
  Package,
  PlusCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingCart,
  SquarePen,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useConfirm } from '@/stores/confirm';
import { useEmployeeStore } from '@/stores/hoaKhangThanhStore';
import { useOrderLogStore } from '@/stores/orderLogStore';
import type { OrderAuditAction, OrderAuditLog } from '@/types/hoaKhangThanh';
import { exportToExcel } from '@/lib/export';

dayjs.extend(relativeTime);
dayjs.locale('vi');

function formatNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString('vi-VN');
}

export function DonHangLichSu() {
  const { logs, clearLogs, resetLogs } = useOrderLogStore();
  const employees = useEmployeeStore((s) => s.employees);
  const confirm = useConfirm();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState<OrderAuditLog | null>(null);

  // Distinct performers list for filter
  const performerOptions = useMemo(() => {
    const names = new Set<string>();
    logs.forEach((l) => {
      if (l.performerName) names.add(l.performerName);
    });
    employees.forEach((e) => {
      if (e.fullName) names.add(e.fullName);
    });
    return Array.from(names).sort();
  }, [logs, employees]);

  // KPIs
  const kpis = useMemo(() => {
    let creates = 0;
    let updates = 0;
    let deletes = 0;
    let statusChanges = 0;

    logs.forEach((l) => {
      if (l.action === 'create') creates++;
      else if (l.action === 'update') updates++;
      else if (l.action === 'delete') deletes++;
      else if (l.action === 'status_change') statusChanges++;
    });

    return {
      total: logs.length,
      creates,
      updates,
      deletes,
      statusChanges,
    };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const now = dayjs();

    return logs.filter((log) => {
      // Search
      if (q) {
        const matchCode = log.orderCode?.toLowerCase().includes(q);
        const matchCustomer = log.distributorName?.toLowerCase().includes(q);
        const matchPerformer = log.performerName?.toLowerCase().includes(q);
        const matchPerformerCode = log.performerCode?.toLowerCase().includes(q);
        const matchSummary = log.summary?.toLowerCase().includes(q);
        const matchDetails = log.details?.toLowerCase().includes(q);
        if (!matchCode && !matchCustomer && !matchPerformer && !matchPerformerCode && !matchSummary && !matchDetails) {
          return false;
        }
      }

      // Action type
      if (selectedAction !== 'all' && log.action !== selectedAction) {
        return false;
      }

      // Employee
      if (selectedEmployee !== 'all' && log.performerName !== selectedEmployee) {
        return false;
      }

      // Date range
      if (selectedDateRange !== 'all') {
        const logDate = dayjs(log.timestamp);
        if (selectedDateRange === 'today') {
          if (!logDate.isSame(now, 'day')) return false;
        } else if (selectedDateRange === 'yesterday') {
          if (!logDate.isSame(now.subtract(1, 'day'), 'day')) return false;
        } else if (selectedDateRange === '7days') {
          if (logDate.isBefore(now.subtract(7, 'day'), 'day')) return false;
        } else if (selectedDateRange === '30days') {
          if (logDate.isBefore(now.subtract(30, 'day'), 'day')) return false;
        }
      }

      return true;
    });
  }, [logs, searchTerm, selectedAction, selectedEmployee, selectedDateRange]);

  // Paginated data
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, currentPage, pageSize]);

  // Export to Excel
  const handleExportExcel = async () => {
    if (filteredLogs.length === 0) {
      toast.error('Không có dữ liệu lịch sử để xuất file');
      return;
    }

    const exportData = filteredLogs.map((l, index) => ({
      STT: index + 1,
      'Thời gian': dayjs(l.timestamp).format('HH:mm:ss DD/MM/YYYY'),
      'Mã log': l.id,
      'Thao tác': l.actionLabel,
      'Nhân viên thực hiện': l.performerName,
      'Mã nhân viên': l.performerCode || '',
      'Chức vụ': l.performerRole || '',
      'Mã đơn hàng': l.orderCode,
      'NPP / Khách hàng': l.distributorName,
      'Tóm tắt thao tác': l.summary,
      'Nội dung chi tiết': l.details,
      'Số lượng hoa': l.totalQuantity ?? '',
      'Tổng tiền đơn': l.totalAmount ?? '',
      'Công nợ cũ': l.oldDebt ?? '',
      'Thanh toán': l.totalPayment ?? '',
    }));

    await exportToExcel(exportData, 'Lich_su_thao_tac_don_hang');
    toast.success(`Đã xuất ${exportData.length} bản ghi lịch sử ra Excel!`);
  };

  // Clear all logs with confirmation
  const handleClearAllLogs = () => {
    confirm({
      title: 'Xóa toàn bộ lịch sử thao tác?',
      message: 'Hành động này sẽ làm sạch toàn bộ nhật ký thao tác đơn hàng hiện tại. Bạn có chắc chắn muốn tiếp tục?',
      variant: 'danger',
      confirmText: 'Xóa tất cả',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        clearLogs();
        toast.success('Đã xóa sạch toàn bộ lịch sử thao tác!');
      },
    });
  };

  // Reset to seed logs
  const handleResetLogs = () => {
    resetLogs();
    toast.success('Đã khôi phục dữ liệu mẫu lịch sử thao tác!');
  };

  // Helper render Action Badge
  const renderActionBadge = (action: OrderAuditAction, label: string) => {
    switch (action) {
      case 'create':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <PlusCircle size={12} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
            {label}
          </span>
        );
      case 'update':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
            <SquarePen size={12} className="shrink-0 text-sky-600 dark:text-sky-400" />
            {label}
          </span>
        );
      case 'status_change':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
            <RefreshCw size={12} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
            {label}
          </span>
        );
      case 'delete':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <Trash2 size={12} className="shrink-0 text-rose-600 dark:text-rose-400" />
            {label}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
            {label}
          </span>
        );
    }
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedAction !== 'all' ||
    selectedEmployee !== 'all' ||
    selectedDateRange !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedAction('all');
    setSelectedEmployee('all');
    setSelectedDateRange('all');
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background overflow-hidden">
      {/* Top Summary KPI Cards */}
      <div className="p-3 sm:p-4 border-b border-border/60 bg-muted/20 shrink-0">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
          {/* Card: Tổng thao tác */}
          <div className="bg-card border border-border/70 rounded-lg p-2.5 sm:p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Tổng thao tác</span>
              <History size={15} className="text-primary" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-foreground">
              {kpis.total}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Nhật ký đã lưu</div>
          </div>

          {/* Card: Thêm mới */}
          <div className="bg-card border border-border/70 rounded-lg p-2.5 sm:p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Thêm mới đơn</span>
              <PlusCircle size={15} className="text-emerald-600" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-emerald-600">
              {kpis.creates}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Tạo đơn thành công</div>
          </div>

          {/* Card: Chỉnh sửa */}
          <div className="bg-card border border-border/70 rounded-lg p-2.5 sm:p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Chỉnh sửa đơn</span>
              <SquarePen size={15} className="text-sky-600" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-sky-600">
              {kpis.updates}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Cập nhật đơn hàng</div>
          </div>

          {/* Card: Đổi trạng thái */}
          <div className="bg-card border border-border/70 rounded-lg p-2.5 sm:p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Đổi trạng thái</span>
              <RefreshCw size={15} className="text-indigo-600" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-indigo-600">
              {kpis.statusChanges}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Chuyển luồng đơn</div>
          </div>

          {/* Card: Xóa đơn */}
          <div className="bg-card border border-border/70 rounded-lg p-2.5 sm:p-3 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
              <span>Xóa đơn hàng</span>
              <Trash2 size={15} className="text-rose-600" />
            </div>
            <div className="mt-1 text-xl sm:text-2xl font-bold font-mono text-rose-600">
              {kpis.deletes}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Đơn đã bị gỡ bỏ</div>
          </div>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="p-3 sm:p-4 border-b border-border/60 bg-background shrink-0 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left: Search & Filter selects */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
              <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm mã đơn, nhân viên, mã NV, khách hàng, nội dung..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full h-8 pl-8 pr-7 text-xs bg-muted/40 hover:bg-muted/60 focus:bg-background border border-border rounded-md outline-hidden focus:ring-1 focus:ring-primary/40 transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Thao tác filter */}
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 text-xs bg-muted/40 border border-border rounded-md text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">Tất cả thao tác</option>
              <option value="create">Thêm mới đơn</option>
              <option value="update">Chỉnh sửa đơn</option>
              <option value="status_change">Đổi trạng thái</option>
              <option value="delete">Xóa đơn hàng</option>
            </select>

            {/* Nhân viên filter */}
            <select
              value={selectedEmployee}
              onChange={(e) => {
                setSelectedEmployee(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 text-xs bg-muted/40 border border-border rounded-md text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 cursor-pointer max-w-[180px] truncate"
            >
              <option value="all">Tất cả nhân viên</option>
              {performerOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            {/* Thời gian filter */}
            <select
              value={selectedDateRange}
              onChange={(e) => {
                setSelectedDateRange(e.target.value);
                setPage(1);
              }}
              className="h-8 px-2.5 text-xs bg-muted/40 border border-border rounded-md text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary/40 cursor-pointer"
            >
              <option value="all">Mọi mốc thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
            </select>

            {/* Clear filters pill */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="h-8 px-2 inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-md border border-rose-200 dark:border-rose-800 transition-colors"
                title="Xóa bộ lọc"
              >
                <X size={12} />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleExportExcel}
              className="h-8 gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
              title="Xuất danh sách ra file Excel"
            >
              <FileSpreadsheet size={14} />
              <span>Xuất Excel</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleResetLogs}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              title="Tải lại dữ liệu mẫu"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Dữ liệu mẫu</span>
            </Button>

            {logs.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClearAllLogs}
                className="h-8 gap-1.5 text-xs text-rose-600 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                title="Xóa toàn bộ lịch sử thao tác"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">Xóa nhật ký</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0 overflow-auto">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <History size={48} className="text-muted-foreground/40 mb-3 stroke-[1.5]" />
            <div className="text-sm font-semibold text-foreground">Không có lịch sử thao tác nào</div>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {hasActiveFilters
                ? 'Không tìm thấy bản ghi phù hợp với bộ lọc hiện tại. Vui lòng thử xóa bớt tiêu chí lọc.'
                : 'Mọi thao tác thêm mới, sửa, xóa hoặc đổi trạng thái đơn hàng của nhân viên sẽ tự động ghi lại tại đây.'}
            </p>
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={clearAllFilters} className="mt-4 text-xs">
                Xóa tất cả bộ lọc
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handleResetLogs} className="mt-4 text-xs gap-1">
                <RotateCcw size={13} />
                Nạp lại dữ liệu mẫu
              </Button>
            )}
          </div>
        ) : (
          <div className="min-w-[950px]">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs border-b border-border/80 z-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3 w-44">Thời gian</th>
                  <th className="py-2.5 px-3 w-36">Thao tác</th>
                  <th className="py-2.5 px-3 w-52">Nhân viên thực hiện</th>
                  <th className="py-2.5 px-3 w-32">Mã đơn</th>
                  <th className="py-2.5 px-3 w-52">NPP / Khách hàng</th>
                  <th className="py-2.5 px-3">Chi tiết thay đổi</th>
                  <th className="py-2.5 px-3 w-20 text-center">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {paginatedLogs.map((log) => {
                  const logDate = dayjs(log.timestamp);
                  return (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    >
                      {/* Thời gian */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-foreground">
                          {logDate.format('HH:mm:ss')}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar size={11} className="shrink-0" />
                          <span>{logDate.format('DD/MM/YYYY')}</span>
                          <span className="text-[10px] text-muted-foreground/75">({logDate.fromNow()})</span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        {renderActionBadge(log.action, log.actionLabel)}
                      </td>

                      {/* Nhân viên thực hiện */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                            {log.performerName
                              ? log.performerName
                                  .split(' ')
                                  .filter(Boolean)
                                  .slice(-1)[0]
                                  ?.charAt(0)
                                  ?.toUpperCase()
                              : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground text-xs truncate max-w-[170px]">
                              {log.performerName}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                              {log.performerCode && (
                                <span className="font-mono bg-muted px-1 rounded text-foreground font-medium">
                                  {log.performerCode}
                                </span>
                              )}
                              {log.performerRole && (
                                <span className="truncate max-w-[100px]">{log.performerRole}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mã đơn hàng */}
                      <td className="py-2.5 px-3 align-top whitespace-nowrap">
                        <div className="font-mono font-bold text-xs text-primary">
                          {log.orderCode}
                        </div>
                        {log.action === 'delete' && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            Đã xóa
                          </span>
                        )}
                      </td>

                      {/* NPP / Khách hàng */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="font-medium text-xs text-foreground truncate max-w-[190px]" title={log.distributorName}>
                          {log.distributorName || '(Không xác định)'}
                        </div>
                        {log.totalAmount !== undefined && (
                          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                            Tổng: <span className="font-semibold text-foreground">{formatNumber(log.totalAmount)}</span>
                          </div>
                        )}
                      </td>

                      {/* Chi tiết thay đổi */}
                      <td className="py-2.5 px-3 align-top">
                        <div className="text-xs text-foreground font-medium mb-1 line-clamp-1">
                          {log.summary}
                        </div>

                        {/* Diff tags */}
                        {log.diff && log.diff.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {log.diff.map((d, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] bg-muted/80 text-foreground border border-border/80"
                              >
                                <span className="font-medium text-muted-foreground">{d.label}:</span>
                                <span className="text-rose-600 line-through max-w-[120px] truncate">{d.oldValue}</span>
                                <ArrowRight size={10} className="shrink-0 text-muted-foreground" />
                                <span className="text-emerald-600 font-semibold max-w-[120px] truncate">{d.newValue}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground line-clamp-2">
                            {log.details}
                          </div>
                        )}
                      </td>

                      {/* Nút Chi tiết */}
                      <td className="py-2.5 px-3 align-top text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Xem chi tiết thao tác"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {filteredLogs.length > 0 && (
        <div className="px-3 sm:px-4 py-2.5 border-t border-border/60 bg-muted/20 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-7 px-2 bg-background border border-border rounded text-xs text-foreground cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>trên tổng số <strong className="text-foreground font-mono">{filteredLogs.length}</strong> bản ghi</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2.5 text-xs"
            >
              Trang trước
            </Button>
            <span className="px-2 font-mono text-xs text-foreground font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2.5 text-xs"
            >
              Trang sau
            </Button>
          </div>
        </div>
      )}

      {/* Audit Detail Drawer / Modal */}
      {selectedLog && (
        <Drawer
          title={
            <div className="flex items-center gap-2">
              <span>Chi tiết lịch sử thao tác</span>
              {renderActionBadge(selectedLog.action, selectedLog.actionLabel)}
            </div>
          }
          subtitle={`Ghi nhận lúc ${dayjs(selectedLog.timestamp).format('HH:mm:ss - DD/MM/YYYY')} • Mã đơn: ${selectedLog.orderCode}`}
          icon={<History size={18} className="text-primary" />}
          onClose={() => setSelectedLog(null)}
          size="md"
        >
          <div className="p-4 sm:p-5 space-y-5 text-xs">
            {/* Box 1: Thông tin nhân viên thực hiện */}
            <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-primary" />
                <span>Nhân viên thực hiện</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base border border-primary/20 shrink-0">
                  {selectedLog.performerName
                    ? selectedLog.performerName
                        .split(' ')
                        .filter(Boolean)
                        .slice(-1)[0]
                        ?.charAt(0)
                        ?.toUpperCase()
                    : 'U'}
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">
                    {selectedLog.performerName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>Mã NV: <strong className="text-foreground">{selectedLog.performerCode || 'N/A'}</strong></span>
                    <span>•</span>
                    <span>Chức vụ: <strong className="text-foreground">{selectedLog.performerRole || 'Nhân viên'}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Thông tin đối tượng đơn hàng */}
            <div className="bg-card border border-border rounded-lg p-3.5 space-y-3">
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart size={13} className="text-primary" />
                <span>Thông tin đơn hàng liên quan</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Mã đơn:</span>
                  <span className="font-mono font-bold text-primary text-sm">{selectedLog.orderCode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">NPP / Khách hàng:</span>
                  <span className="font-semibold text-foreground text-sm">{selectedLog.distributorName}</span>
                </div>
                {selectedLog.totalQuantity !== undefined && (
                  <div>
                    <span className="text-muted-foreground block">Tổng số lượng hoa:</span>
                    <span className="font-mono font-bold text-foreground">
                      {formatNumber(selectedLog.totalQuantity)} hoa
                    </span>
                  </div>
                )}
                {selectedLog.totalAmount !== undefined && (
                  <div>
                    <span className="text-muted-foreground block">Tổng tiền đơn:</span>
                    <span className="font-mono font-bold text-primary">
                      {formatNumber(selectedLog.totalAmount)}
                    </span>
                  </div>
                )}
                {selectedLog.oldDebt !== undefined && (
                  <div>
                    <span className="text-muted-foreground block">Công nợ cũ:</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatNumber(selectedLog.oldDebt)}
                    </span>
                  </div>
                )}
                {selectedLog.totalPayment !== undefined && (
                  <div>
                    <span className="text-muted-foreground block">Tổng thanh toán:</span>
                    <span className="font-mono font-bold text-primary">
                      {formatNumber(selectedLog.totalPayment)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 3: Bảng đối chiếu thay đổi (Diff Table) */}
            {selectedLog.diff && selectedLog.diff.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw size={13} className="text-sky-600" />
                  <span>Đối chiếu các trường dữ liệu thay đổi</span>
                </div>
                <div className="border border-border/80 rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-[11px] font-semibold text-muted-foreground uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Trường thông tin</th>
                        <th className="py-2 px-3 text-left w-2/5">Giá trị trước</th>
                        <th className="py-2 px-3 text-left w-2/5">Giá trị sau khi sửa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedLog.diff.map((d, i) => (
                        <tr key={i} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-semibold text-foreground align-top">
                            {d.label}
                          </td>
                          <td className="py-2 px-3 align-top font-mono text-rose-600 bg-rose-50/50 dark:bg-rose-950/20">
                            {d.oldValue}
                          </td>
                          <td className="py-2 px-3 align-top font-mono text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold">
                            {d.newValue}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Box 4: Danh sách sản phẩm hoa từ Snapshot (nếu có) */}
            {selectedLog.snapshot?.items && selectedLog.snapshot.items.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={13} className="text-emerald-600" />
                  <span>Danh sách mặt hàng hoa trong đơn ({selectedLog.snapshot.items.length} loại)</span>
                </div>
                <div className="border border-border/80 rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-[11px] font-semibold text-muted-foreground uppercase">
                      <tr>
                        <th className="py-2 px-3 text-left">Tên hoa</th>
                        <th className="py-2 px-3 text-right">Số lượng</th>
                        <th className="py-2 px-3 text-right">Đơn giá</th>
                        <th className="py-2 px-3 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {selectedLog.snapshot.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-medium text-foreground">
                            <div>{item.flowerName}</div>
                            {item.flowerCode && (
                              <span className="text-[10px] text-muted-foreground font-mono">{item.flowerCode}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold">
                            {formatNumber(item.quantity)} {item.unit || 'cành'}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-muted-foreground">
                            {formatNumber(item.unitPrice)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-primary">
                            {formatNumber(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Box 5: Chi tiết chuỗi tóm tắt / nhật ký */}
            <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase block">
                Nội dung sự kiện đầy đủ:
              </span>
              <p className="text-xs text-foreground leading-relaxed font-mono whitespace-pre-wrap">
                {selectedLog.details || selectedLog.summary}
              </p>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
}
