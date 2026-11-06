import { History } from 'lucide-react';
import { ModuleHistory } from '@/components/data/ModuleHistory';
import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Download,
  Layers,
  Package,
  Plus,
  Receipt,
  RotateCcw,
  SquarePen,
  Store,
  Trash2,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import type { ColumnDef } from '@/stores/createListStore';
import {
  clearAllDebtAndOrderData,
  useDebtStore,
  useDistributorStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import type { DebtDailyRecord } from '@/types/hoaKhangThanh';
import { formatDate, todayISODate } from '@/lib/format';
import { CongNoDrawer } from './CongNoDrawer';
import { CongNoStats } from './CongNoStats';

type Tab = 'npp' | 'ncc' | 'tonghop' | 'thongke' | 'lichsu';

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
};

const NPP_COLUMNS: ColumnDef[] = [
  { id: 'date', label: 'Ngày ghi nhận', visible: true, minWidth: 105, width: 115, order: 0 },
  { id: 'entryType', label: 'Hình thức ghi', visible: true, minWidth: 115, width: 125, order: 1 },
  { id: 'partnerCode', label: 'Mã NPP', visible: true, minWidth: 95, width: 105, order: 2 },
  { id: 'partnerName', label: 'Tên Nhà Phân Phối', visible: true, minWidth: 190, width: 220, order: 3 },
  { id: 'referenceCode', label: 'Chứng từ / ĐH', visible: true, minWidth: 110, width: 125, order: 4 },
  { id: 'type', label: 'Thu / Chi', visible: true, minWidth: 95, width: 105, order: 5 },
  { id: 'amount', label: 'Số tiền', visible: true, minWidth: 125, width: 135, order: 6 },
  { id: 'remainingDebt', label: 'Công nợ còn', visible: true, minWidth: 125, width: 135, order: 7 },
  { id: 'creator', label: 'Người lập', visible: true, minWidth: 110, width: 125, order: 8 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 80, width: 85, order: 9 },
  { id: 'phone', label: 'Số điện thoại', visible: false, minWidth: 110, width: 120, order: 10 },
  { id: 'notes', label: 'Ghi chú', visible: false, minWidth: 180, width: 220, order: 11 },
];

const NCC_COLUMNS: ColumnDef[] = [
  { id: 'date', label: 'Ngày ghi nhận', visible: true, minWidth: 105, width: 115, order: 0 },
  { id: 'entryType', label: 'Hình thức ghi', visible: true, minWidth: 115, width: 125, order: 1 },
  { id: 'partnerCode', label: 'Mã NCC', visible: true, minWidth: 95, width: 105, order: 2 },
  { id: 'partnerName', label: 'Tên Nhà Cung Cấp', visible: true, minWidth: 190, width: 220, order: 3 },
  { id: 'referenceCode', label: 'Lô nhập / CT', visible: true, minWidth: 110, width: 125, order: 4 },
  { id: 'type', label: 'Thu / Chi', visible: true, minWidth: 95, width: 105, order: 5 },
  { id: 'amount', label: 'Số tiền', visible: true, minWidth: 125, width: 135, order: 6 },
  { id: 'remainingDebt', label: 'Công nợ còn', visible: true, minWidth: 125, width: 135, order: 7 },
  { id: 'creator', label: 'Người lập', visible: true, minWidth: 110, width: 125, order: 8 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 80, width: 85, order: 9 },
  { id: 'phone', label: 'Số điện thoại', visible: false, minWidth: 110, width: 120, order: 10 },
  { id: 'notes', label: 'Ghi chú', visible: false, minWidth: 180, width: 220, order: 11 },
];

export default function CongNoPage() {
  const { records, deleteRecord } = useDebtStore();
  const { distributors } = useDistributorStore();
  const { suppliers } = useSupplierStore();

  const [activeTab, setActiveTab] = useState<Tab>('npp');
  const [searchTerm, setSearchTerm] = useState('');

  // Date Filter State
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Partner Filter
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('all');

  // Entry Type Filter: 'daily' (default) | 'order' | 'all'
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'daily' | 'order'>('daily');

  // Transaction Type Filter: 'all' | 'thu' | 'chi' (Thu/Chi riêng)
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'thu' | 'chi'>('all');

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columns, setColumns] = useState<ColumnDef[]>(NPP_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRecord, setSelectedRecord] = useState<DebtDailyRecord | null>(null);

  // Switch columns when tab changes
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setPage(1);
    setSelectedIds(new Set());
    if (tab === 'npp') {
      setColumns(NPP_COLUMNS);
      setSelectedPartnerId('all');
    } else if (tab === 'ncc') {
      setColumns(NCC_COLUMNS);
      setSelectedPartnerId('all');
    }
  };

  // Quick date presets
  const handleQuickDateFilter = (mode: 'all' | 'today' | 'yesterday' | 'week' | 'month') => {
    setDateFilterMode(mode);
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (mode === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (mode === 'today') {
      const s = toISO(today);
      setStartDate(s);
      setEndDate(s);
    } else if (mode === 'yesterday') {
      const y = new Date(today);
      y.setDate(today.getDate() - 1);
      const s = toISO(y);
      setStartDate(s);
      setEndDate(s);
    } else if (mode === 'week') {
      const past7 = new Date(today);
      past7.setDate(today.getDate() - 7);
      setStartDate(toISO(past7));
      setEndDate(toISO(today));
    } else if (mode === 'month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(toISO(startOfMonth));
      setEndDate(toISO(today));
    }
  };

  // Partner list for dropdown filter
  const filterPartners = useMemo(() => {
    if (activeTab === 'npp') {
      return distributors.map((d) => ({ id: d.id, name: `${d.code} - ${d.name}` }));
    }
    if (activeTab === 'ncc') {
      return suppliers.map((s) => ({ id: s.id, name: `${s.code} - ${s.name}` }));
    }
    return [];
  }, [activeTab, distributors, suppliers]);

  // Filtered records
  const filteredData = useMemo(() => {
    // 1. Base filter by tab, partner, date range, search query
    const baseRecords = records.filter((r) => {
      // Filter by partnerType tab
      if (activeTab === 'npp' && r.partnerType !== 'npp') return false;
      if (activeTab === 'ncc' && r.partnerType !== 'ncc') return false;

      // Filter by partnerId
      if (selectedPartnerId !== 'all' && r.partnerId !== selectedPartnerId) return false;

      // Filter by date range
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      // Filter by search query
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchCode = r.partnerCode.toLowerCase().includes(q);
        const matchName = r.partnerName.toLowerCase().includes(q);
        const matchRef = (r.referenceCode || '').toLowerCase().includes(q);
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        const matchCreator = (r.creator || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchRef && !matchNotes && !matchCreator) {
          return false;
        }
      }

      return true;
    });

    // 4. Lấy danh sách thô theo chế độ lọc
    let rawList: DebtDailyRecord[] = [];
    if (entryTypeFilter === 'order') {
      rawList = baseRecords.filter(
        (r) =>
          r.entryType === 'order' ||
          Boolean(r.referenceCode && (r.referenceCode.startsWith('DH-') || r.referenceCode.startsWith('PO-'))),
      );
    } else if (entryTypeFilter === 'daily') {
      const groups = new Map<string, DebtDailyRecord[]>();
      baseRecords.forEach((r) => {
        const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
        const itemType = isThu ? 'thu' : 'chi';
        // Nhóm theo (Ngày + Đối tác + Loại Thu/Chi) để Thu và Chi luôn tách biệt
        const key = `${r.date}__${r.partnerId || r.partnerCode}__${itemType}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(r);
      });

      const aggregatedList: DebtDailyRecord[] = [];
      groups.forEach((items, key) => {
        const first = items[0];
        const isThu = first.type === 'thu' || ((first.decreaseAmount || 0) > 0 && (first.increaseAmount || 0) === 0);
        const groupType: 'thu' | 'chi' = isThu ? 'thu' : 'chi';

        let totalGroupAmount = 0;
        const refCodes: string[] = [];

        items.forEach((item) => {
          const amt =
            item.amount !== undefined
              ? item.amount
              : isThu
              ? item.decreaseAmount || 0
              : item.increaseAmount || 0;
          totalGroupAmount += amt;
          if (item.referenceCode && !refCodes.includes(item.referenceCode)) {
            refCodes.push(item.referenceCode);
          }
        });

        // Friendly reference summary
        let refSummary = '';
        if (refCodes.length === 1) {
          refSummary = refCodes[0];
        } else if (refCodes.length > 1) {
          refSummary = `${refCodes.length} ${groupType === 'chi' ? 'đơn' : 'phiếu'} (${refCodes.slice(0, 2).join(', ')}${refCodes.length > 2 ? '...' : ''})`;
        } else {
          refSummary = groupType === 'thu' ? 'Thu nợ đối tác' : 'Bán hoa trong ngày';
        }

        aggregatedList.push({
          id: items.length === 1 ? first.id : `daily-agg-${key}`,
          date: first.date,
          partnerType: first.partnerType,
          partnerId: first.partnerId,
          partnerCode: first.partnerCode,
          partnerName: first.partnerName,
          phone: first.phone,
          entryType: 'daily',
          type: groupType,
          amount: totalGroupAmount,
          remainingDebt: 0, // Sẽ được tính lũy kế tự động ở bước 5 (Cột ảo)
          referenceCode: refSummary,
          notes:
            items.map((i) => i.notes).filter(Boolean).join('; ') ||
            (groupType === 'thu'
              ? `Tổng hợp ${items.length} lần thu tiền trong ngày`
              : `Tổng hợp ${items.length} đơn xuất bán trong ngày`),
          creator:
            Array.from(new Set(items.map((i) => i.creator).filter(Boolean))).join(', ') || first.creator,
          isAggregated: items.length > 1,
          childRecords: items,
        });
      });

      rawList = aggregatedList;
    } else {
      // Mode 'all': Toàn bộ các bản ghi
      rawList = [...baseRecords];
    }

    // Lọc theo Phân loại Thu/Chi nếu có chọn
    if (txnTypeFilter !== 'all') {
      rawList = rawList.filter((r) => {
        const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
        return txnTypeFilter === 'thu' ? isThu : !isThu;
      });
    }

    // 5. TÍNH CỘT ẢO CÔNG NỢ CÒN (Running Balance Lũy Kế Theo Dòng Thời Gian Cho Từng Đối Tác)
    const partnerGroups = new Map<string, DebtDailyRecord[]>();
    rawList.forEach((r) => {
      const pKey = r.partnerId || r.partnerCode;
      if (!partnerGroups.has(pKey)) {
        partnerGroups.set(pKey, []);
      }
      partnerGroups.get(pKey)!.push(r);
    });

    const finalRowsWithVirtualDebt: DebtDailyRecord[] = [];

    partnerGroups.forEach((pRows, pKey) => {
      // Lấy công nợ gốc ban đầu của đối tác
      let baseDebt = 0;
      if (activeTab === 'npp') {
        const d = distributors.find((x) => x.id === pKey || x.code === pKey);
        baseDebt = d?.oldDebt || 0;
      } else {
        const s = suppliers.find((x) => x.id === pKey || x.code === pKey);
        baseDebt = s?.oldDebt || 0;
      }

      // Sắp xếp theo trình tự thời gian từ CŨ NHẤT đến MỚI NHẤT để tính lũy kế
      const chronological = [...pRows].sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        if (dc !== 0) return dc;
        // Cùng ngày: Chi (bán hàng nợ) trước, Thu (trả nợ) sau
        const aIsThu = a.type === 'thu' || ((a.decreaseAmount || 0) > 0 && (a.increaseAmount || 0) === 0);
        const bIsThu = b.type === 'thu' || ((b.decreaseAmount || 0) > 0 && (b.increaseAmount || 0) === 0);
        if (!aIsThu && bIsThu) return -1;
        if (aIsThu && !bIsThu) return 1;
        return a.id.localeCompare(b.id);
      });

      // Lũy kế số dư nợ qua từng ngày / từng giao dịch (Cột ảo)
      let running = baseDebt;
      chronological.forEach((row) => {
        const isThu = row.type === 'thu' || ((row.decreaseAmount || 0) > 0 && (row.increaseAmount || 0) === 0);
        const amt = row.amount !== undefined ? row.amount : (isThu ? (row.decreaseAmount || 0) : (row.increaseAmount || 0));
        if (isThu) {
          running -= amt;
        } else {
          running += amt;
        }
        row.remainingDebt = running;
      });

      finalRowsWithVirtualDebt.push(...chronological);
    });

    // Sắp xếp lại để hiển thị giao diện: Ngày mới nhất ở TRÊN ĐẦU
    return finalRowsWithVirtualDebt.sort((a, b) => {
      const dc = b.date.localeCompare(a.date);
      if (dc !== 0) return dc;
      // Cùng ngày: Dòng Thu (sau khi trả) hiển thị trên, dòng Chi ở dưới
      const aIsThu = a.type === 'thu' || ((a.decreaseAmount || 0) > 0 && (a.increaseAmount || 0) === 0);
      const bIsThu = b.type === 'thu' || ((b.decreaseAmount || 0) > 0 && (b.increaseAmount || 0) === 0);
      if (aIsThu && !bIsThu) return -1;
      if (!aIsThu && bIsThu) return 1;
      return b.id.localeCompare(a.id);
    });
  }, [records, activeTab, selectedPartnerId, entryTypeFilter, txnTypeFilter, startDate, endDate, searchTerm, distributors, suppliers]);

  // Dynamic KPI stats based on filtered data
  const summaryStats = useMemo(() => {
    let totalThu = 0;
    let totalChi = 0;
    let totalAmount = 0;

    filteredData.forEach((r) => {
      const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
      const amt = r.amount !== undefined ? r.amount : (isThu ? (r.decreaseAmount || 0) : (r.increaseAmount || 0));

      if (isThu) {
        totalThu += amt;
      } else {
        totalChi += amt;
      }
      totalAmount += amt;
    });

    // Cột ảo: Tổng nợ còn của từng đối tác = Nợ đầu kỳ + Tổng Chi - Tổng Thu
    const partnersInView = Array.from(new Set(filteredData.map((r) => r.partnerId || r.partnerCode)));
    let totalRemainingDebt = 0;

    partnersInView.forEach((pId) => {
      let baseDebt = 0;
      if (activeTab === 'npp') {
        const d = distributors.find((x) => x.id === pId || x.code === pId);
        baseDebt = d?.oldDebt || 0;
      } else {
        const s = suppliers.find((x) => x.id === pId || x.code === pId);
        baseDebt = s?.oldDebt || 0;
      }

      const pRows = filteredData.filter((r) => (r.partnerId === pId || r.partnerCode === pId));
      let pChi = 0;
      let pThu = 0;
      pRows.forEach((r) => {
        const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
        const amt = r.amount !== undefined ? r.amount : (isThu ? (r.decreaseAmount || 0) : (r.increaseAmount || 0));
        if (isThu) pThu += amt;
        else pChi += amt;
      });

      totalRemainingDebt += (baseDebt + pChi - pThu);
    });

    return {
      totalThu,
      totalChi,
      totalAmount,
      totalRemainingDebt,
      count: filteredData.length,
    };
  }, [filteredData, activeTab, distributors, suppliers]);

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
    setSelectedIds((prev) => (prev.size === ids.length ? new Set() : new Set(ids)));
  };

  const handleDeleteMany = () => {
    if (confirm(`Bạn có chắc muốn xóa ${selectedIds.size} bản ghi công nợ đã chọn?`)) {
      selectedIds.forEach((id) => deleteRecord(id));
      setSelectedIds(new Set());
      toast.success('Đã xóa các bản ghi công nợ đã chọn');
    }
  };

  const handleToggleColumn = (id: string) => {
    setColumns((cols) => cols.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)));
  };

  const handleUpdateColumn = (id: string, updates: Partial<ColumnDef>) => {
    setColumns((cols) => cols.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const handleReorderColumns = (from: number, to: number) => {
    setColumns((prev) => {
      const sorted = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const [moved] = sorted.splice(from, 1);
      sorted.splice(to, 0, moved);
      return sorted.map((c, i) => ({ ...c, order: i }));
    });
  };

  const handleResetColumns = () => {
    setColumns(activeTab === 'npp' ? NPP_COLUMNS : NCC_COLUMNS);
  };

  const handleAddNew = () => {
    setSelectedRecord(null);
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleEdit = (r: DebtDailyRecord) => {
    if (r.childRecords && r.childRecords.length === 1) {
      setSelectedRecord(r.childRecords[0]);
    } else {
      setSelectedRecord(r);
    }
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleView = (r: DebtDailyRecord) => {
    setSelectedRecord(r);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleDelete = (r: DebtDailyRecord) => {
    if (r.childRecords && r.childRecords.length > 1) {
      if (
        confirm(
          `Xác nhận xóa toàn bộ ${r.childRecords.length} phát sinh công nợ ngày ${formatDate(r.date)} của ${r.partnerName}?`,
        )
      ) {
        r.childRecords.forEach((c) => deleteRecord(c.id));
        toast.success(`Đã xóa các phát sinh công nợ ngày ${formatDate(r.date)}`);
      }
      return;
    }
    const targetId = r.childRecords && r.childRecords[0] ? r.childRecords[0].id : r.id;
    if (
      confirm(
        `Xác nhận xóa bản ghi công nợ ngày ${formatDate(r.date)} của ${r.partnerName}?`,
      )
    ) {
      deleteRecord(targetId);
      toast.success('Đã xóa bản ghi công nợ');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Không có dữ liệu công nợ để xuất Excel');
      return;
    }

    const isNPP = activeTab === 'npp';
    const exportRows = filteredData.map((r, i) => {
      const isOrder =
        r.entryType === 'order' ||
        Boolean(r.referenceCode && (r.referenceCode.startsWith('DH-') || r.referenceCode.startsWith('PO-')));
      const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
      const amt = r.amount !== undefined ? r.amount : (isThu ? (r.decreaseAmount || 0) : (r.increaseAmount || 0));
      const remDebt =
        r.remainingDebt !== undefined
          ? r.remainingDebt
          : r.finalDebt !== undefined
          ? r.finalDebt
          : (r.oldDebt || 0) + (r.increaseAmount || 0) - (r.decreaseAmount || 0);

      return {
        'STT': i + 1,
        'Ngày ghi nhận': formatDate(r.date),
        'Hình thức ghi': isOrder ? 'Ghi theo đơn' : 'Ghi theo ngày',
        'Đối tượng': r.partnerType === 'npp' ? 'Nhà Phân Phối' : 'Nhà Cung Cấp',
        'Mã đối tác': r.partnerCode,
        'Tên đối tác': r.partnerName,
        'Số điện thoại': r.phone || '',
        'Chứng từ / Đơn hàng': r.referenceCode || '',
        'Thu / Chi': isThu ? 'Thu' : 'Chi',
        'Số tiền': amt || 0,
        'Công nợ còn': remDebt || 0,
        'Người lập': r.creator || '',
        'Ghi chú': r.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    const sheetName = isNPP ? 'CongNo_NPP' : 'CongNo_NCC';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `Bang_Ke_Cong_No_${activeTab.toUpperCase()}_${todayISODate()}.xlsx`);
    toast.success('Đã xuất file Excel bảng kê công nợ thành công');
  };

  // Cell renderer for DataTable
  const renderCell = (colId: string, row: DebtDailyRecord) => {
    const isOrder =
      row.entryType === 'order' ||
      Boolean(row.referenceCode && (row.referenceCode.startsWith('DH-') || row.referenceCode.startsWith('PO-')));
    const isThu = row.type === 'thu' || ((row.decreaseAmount || 0) > 0 && (row.increaseAmount || 0) === 0);
    const amt = row.amount !== undefined ? row.amount : (isThu ? (row.decreaseAmount || 0) : (row.increaseAmount || 0));
    const remDebt =
      row.remainingDebt !== undefined
        ? row.remainingDebt
        : row.finalDebt !== undefined
        ? row.finalDebt
        : (row.oldDebt || 0) + (row.increaseAmount || 0) - (row.decreaseAmount || 0);

    switch (colId) {
      case 'date':
        return (
          <span className="text-xs font-mono font-bold text-foreground">
            {formatDate(row.date)}
          </span>
        );
      case 'entryType':
        return isOrder ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            📦 Ghi theo đơn
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            📅 Ghi theo ngày
          </span>
        );
      case 'partnerCode':
        return (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted/60 border border-border">
            {row.partnerCode}
          </span>
        );
      case 'partnerName':
        return (
          <button
            type="button"
            onClick={() => handleView(row)}
            className="text-xs font-bold text-primary hover:underline text-left"
          >
            {row.partnerName}
          </button>
        );
      case 'referenceCode':
        return row.referenceCode ? (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground">
            {row.referenceCode}
          </span>
        ) : (
          <span className="text-xs font-mono text-muted-foreground">—</span>
        );
      case 'type':
        return isThu ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            ↓ Thu
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            ↑ Chi
          </span>
        );
      case 'amount':
        return (
          <span className={`text-xs font-mono font-bold ${isThu ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-400'}`}>
            {isThu ? '↓ ' : '↑ '}
            {formatNumber(amt)}
          </span>
        );
      case 'remainingDebt':
        return (
          <span
            className={`text-xs font-mono font-extrabold ${
              remDebt > 0
                ? 'text-rose-600'
                : remDebt === 0
                ? 'text-emerald-600'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {remDebt < 0 ? `Dư: ${formatNumber(Math.abs(remDebt))}` : formatNumber(remDebt)}
          </span>
        );
      case 'creator':
        return <span className="text-xs text-muted-foreground">{row.creator || '—'}</span>;
      case 'phone':
        return <span className="text-xs font-mono text-muted-foreground">{row.phone || '—'}</span>;
      case 'notes':
        return <span className="text-xs text-muted-foreground truncate max-w-[200px]">{row.notes || '—'}</span>;
      case 'actions':
        return (
          <div className="flex items-center gap-1.5">
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

  // Footer summary row in DataTable
  const renderSummaryRow = (colId: string) => {
    switch (colId) {
      case 'date':
        return <span className="text-xs font-bold text-foreground">Tổng cộng:</span>;
      case 'amount':
        return (
          <span className="text-xs font-mono font-bold text-foreground">
            {formatNumber(summaryStats.totalAmount)}
          </span>
        );
      case 'remainingDebt':
        return (
          <span className="text-xs font-mono font-extrabold text-rose-600">
            {formatNumber(summaryStats.totalRemainingDebt)}
          </span>
        );
      default:
        return null;
    }
  };

  // Mobile card renderer
  const renderMobileCard = (row: DebtDailyRecord, selected: boolean) => {
    const isOrder =
      row.entryType === 'order' ||
      Boolean(row.referenceCode && (row.referenceCode.startsWith('DH-') || row.referenceCode.startsWith('PO-')));
    const isThu = row.type === 'thu' || ((row.decreaseAmount || 0) > 0 && (row.increaseAmount || 0) === 0);
    const amt = row.amount !== undefined ? row.amount : (isThu ? (row.decreaseAmount || 0) : (row.increaseAmount || 0));
    const remDebt =
      row.remainingDebt !== undefined
        ? row.remainingDebt
        : row.finalDebt !== undefined
        ? row.finalDebt
        : (row.oldDebt || 0) + (row.increaseAmount || 0) - (row.decreaseAmount || 0);

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
              {row.partnerCode}
            </span>
            <span className="text-xs font-mono font-bold text-foreground">
              {formatDate(row.date)}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {isOrder ? '📦 Theo đơn' : '📅 Theo ngày'}
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isThu
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200'
            }`}
          >
            {isThu ? 'Thu tiền' : 'Chi tiền'}
          </span>
        </div>

        <div>
          <h4 className="text-xs font-bold text-foreground truncate">{row.partnerName}</h4>
          {row.referenceCode && (
            <p className="text-[11px] font-mono text-muted-foreground">Chứng từ / ĐH: {row.referenceCode}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
          <div>
            <span className="text-muted-foreground block">Thu / Chi:</span>
            <span className={`font-bold ${isThu ? 'text-emerald-600' : 'text-blue-600'}`}>
              {isThu ? 'Thu' : 'Chi'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block">Số tiền:</span>
            <span className="font-mono font-bold text-foreground">{formatNumber(amt)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-rose-600 font-bold block">Công nợ còn:</span>
            <span className={`font-mono font-extrabold text-xs ${remDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatNumber(remDebt)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Daily consolidated table data for Tab 3 (Tổng hợp)
  const consolidatedDailyData = useMemo(() => {
    const dates = Array.from(new Set(records.map((r) => r.date))).sort().reverse();
    return dates.map((d) => {
      const recs = records.filter((r) => r.date === d);
      const nppSales = recs.filter((r) => r.partnerType === 'npp').reduce((s, r) => s + (r.increaseAmount || 0), 0);
      const nppCollected = recs.filter((r) => r.partnerType === 'npp').reduce((s, r) => s + (r.decreaseAmount || 0), 0);
      const nppDebt = recs.filter((r) => r.partnerType === 'npp').reduce((s, r) => s + (r.finalDebt || 0), 0);

      const nccImport = recs.filter((r) => r.partnerType === 'ncc').reduce((s, r) => s + (r.increaseAmount || 0), 0);
      const nccPaid = recs.filter((r) => r.partnerType === 'ncc').reduce((s, r) => s + (r.decreaseAmount || 0), 0);
      const nccDebt = recs.filter((r) => r.partnerType === 'ncc').reduce((s, r) => s + (r.finalDebt || 0), 0);

      const cashDiff = nppCollected - nccPaid;

      return {
        date: d,
        formattedDate: formatDate(d),
        nppSales,
        nppCollected,
        nppDebt,
        nccImport,
        nccPaid,
        nccDebt,
        cashDiff,
        count: recs.length,
      };
    });
  }, [records]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background">
      {/* Header Tabs */}
      <div className="border-b border-border bg-card/60 px-4 pt-3 pb-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Receipt className="text-primary" size={20} />
              Quản lý Công nợ theo ngày
            </h1>
            <p className="text-xs text-muted-foreground">
              Theo dõi chi tiết phát sinh công nợ cũ, bán/nhập hoa, thu/trả tiền và công nợ cuối theo ngày cho NPP & NCC
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (
                  window.confirm(
                    'Bạn có chắc chắn muốn xóa toàn bộ bản ghi công nợ và đưa số liệu công nợ về 0 để nhập lại từ đầu không?'
                  )
                ) {
                  clearAllDebtAndOrderData();
                  toast.success('Đã xóa sạch công nợ và đưa toàn bộ số liệu về 0 để bạn điền lại từ đầu!');
                }
              }}
              className="gap-1.5 text-xs h-8 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Xóa sạch toàn bộ công nợ và đưa tất cả số liệu về 0"
            >
              <Trash2 size={14} /> Xóa sạch công nợ (Về 0)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-1.5 text-xs h-8"
            >
              <Download size={14} /> Xuất Excel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAddNew}
              className="gap-1.5 text-xs h-8"
            >
              <Plus size={14} /> Thêm phát sinh công nợ
            </Button>
          </div>
        </div>

        {/* 4 Tabs */}
        <Tabs
          tabs={[
            {
              id: 'npp',
              label: `Công nợ Nhà Phân Phối (NPP) [${records.filter((r) => r.partnerType === 'npp').length}]`,
              icon: Store,
            },
            {
              id: 'ncc',
              label: `Công nợ Nhà Cung Cấp (NCC) [${records.filter((r) => r.partnerType === 'ncc').length}]`,
              icon: Truck,
            },
            {
              id: 'tonghop',
              label: 'Tổng hợp công nợ theo ngày',
              icon: Layers,
            },
            {
              id: 'thongke',
              label: 'Thống kê & Báo cáo',
              icon: BarChart3,
            },
            { id: 'lichsu', label: 'Lịch sử thao tác', icon: History },
          ]}
          activeTab={activeTab}
          onChange={(tab) => handleTabChange(tab as Tab)}
        />
      </div>

      {activeTab === 'lichsu' ? (<ModuleHistory module="cong-no" />) : activeTab === 'thongke' ? (
        <CongNoStats />
      ) : activeTab === 'tonghop' ? (
        /* Tab 3: Bảng Tổng hợp dòng công nợ phát sinh theo từng ngày */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-7xl mx-auto w-full">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">
                  Bảng tổng hợp đối soát công nợ phát sinh theo từng ngày
                </h3>
                <p className="text-xs text-muted-foreground">
                  So sánh dòng tiền bán hoa, thu nợ từ đại lý với tiền nhập hoa và thanh toán cho nhà vườn
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="gap-1.5 text-xs h-8"
              >
                <Download size={13} /> Tải bảng tổng hợp
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3">Ngày (dd/mm/yyyy)</th>
                    <th className="py-2.5 px-3 text-purple-700 dark:text-purple-300">NPP: Tiền bán hoa</th>
                    <th className="py-2.5 px-3 text-emerald-600">NPP: Tiền thu nợ</th>
                    <th className="py-2.5 px-3 text-purple-700 dark:text-purple-300">NPP: Dư nợ cuối</th>
                    <th className="py-2.5 px-3 text-orange-600">NCC: Tiền nhập hoa</th>
                    <th className="py-2.5 px-3 text-emerald-600">NCC: Tiền trả NCC</th>
                    <th className="py-2.5 px-3 text-rose-600">NCC: Dư nợ cuối</th>
                    <th className="py-2.5 px-3 text-right">Chênh lệch thu - chi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {consolidatedDailyData.map((d) => (
                    <tr key={d.date} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {d.formattedDate}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {formatNumber(d.nppSales)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                        {formatNumber(d.nppCollected)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-600">
                        {formatNumber(d.nppDebt)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                        {formatNumber(d.nccImport)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">
                        {formatNumber(d.nccPaid)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-rose-600">
                        {formatNumber(d.nccDebt)}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-right">
                        <span className={d.cashDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {d.cashDiff > 0 ? '+' : ''}{formatNumber(d.cashDiff)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 1 & Tab 2: Danh sách chi tiết công nợ NPP / NCC */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Date Filter & Partner Filter Toolbar */}
          <div className="px-4 py-2.5 bg-card/40 border-b border-border/60 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                  <Calendar size={13} className="text-primary" /> Lọc ngày:
                </span>
                <button
                  type="button"
                  onClick={() => handleQuickDateFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    dateFilterMode === 'all'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateFilter('today')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    dateFilterMode === 'today'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateFilter('yesterday')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    dateFilterMode === 'yesterday'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Hôm qua
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateFilter('week')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    dateFilterMode === 'week'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  7 ngày qua
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDateFilter('month')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    dateFilterMode === 'month'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  Tháng này
                </button>
              </div>

              {/* Filter Hình thức ghi: Ghi theo ngày | Ghi theo đơn */}
              <div className="flex items-center gap-1 p-0.5 bg-muted/70 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setEntryTypeFilter('daily')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    entryTypeFilter === 'daily'
                      ? 'bg-background text-purple-700 dark:text-purple-300 shadow-xs font-bold border border-purple-200 dark:border-purple-800'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Tổng hợp toàn bộ đơn hàng và phát sinh của từng đối tác theo từng ngày"
                >
                  <Layers size={13} className="text-purple-600" />
                  <span>📅 Ghi theo ngày (Tổng hợp {activeTab === 'npp' ? 'NPP' : 'NCC'})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryTypeFilter('order')}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    entryTypeFilter === 'order'
                      ? 'bg-background text-blue-700 dark:text-blue-300 shadow-xs font-bold border border-blue-200 dark:border-blue-800'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Chi tiết từng đơn hàng phát sinh"
                >
                  <Package size={13} className="text-blue-600" />
                  <span>📦 Ghi theo đơn</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    entryTypeFilter === 'all'
                      ? 'bg-background text-foreground shadow-xs font-bold border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả
                </button>
              </div>

              {/* Filter Phân loại: Tất cả | Thu tiền | Chi tiền (Thu Chi riêng) */}
              <div className="flex items-center gap-1 p-0.5 bg-muted/70 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('all')}
                  className={`px-2 py-1 rounded-md text-xs font-semibold transition-all ${
                    txnTypeFilter === 'all'
                      ? 'bg-background text-foreground shadow-xs font-bold border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Tất cả Thu/Chi
                </button>
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('thu')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                    txnTypeFilter === 'thu'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 shadow-xs font-bold border border-emerald-300 dark:border-emerald-700'
                      : 'text-muted-foreground hover:text-emerald-600'
                  }`}
                  title="Chỉ lọc các dòng Thu tiền (Thu nợ)"
                >
                  <ArrowDownLeft size={13} className="text-emerald-600" />
                  <span>↓ Thu tiền</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxnTypeFilter('chi')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1 ${
                    txnTypeFilter === 'chi'
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-xs font-bold border border-blue-300 dark:border-blue-700'
                      : 'text-muted-foreground hover:text-blue-600'
                  }`}
                  title="Chỉ lọc các dòng Chi tiền / Bán hàng nợ"
                >
                  <ArrowUpRight size={13} className="text-blue-600" />
                  <span>↑ Chi tiền</span>
                </button>
              </div>

              {/* Custom Date Pickers & Partner Dropdown */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Từ:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setDateFilterMode('custom');
                    }}
                    className="h-7 px-2 text-xs rounded border border-input bg-card font-mono"
                  />
                  <span>Đến:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setDateFilterMode('custom');
                    }}
                    className="h-7 px-2 text-xs rounded border border-input bg-card font-mono"
                  />
                </div>

                {/* Partner selector */}
                <div className="flex items-center gap-1">
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => setSelectedPartnerId(e.target.value)}
                    className="h-7 px-2.5 text-xs rounded border border-input bg-card text-foreground font-medium max-w-[200px]"
                  >
                    <option value="all">-- Tất cả đối tác --</option>
                    {filterPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {(dateFilterMode !== 'all' || selectedPartnerId !== 'all' || entryTypeFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickDateFilter('all');
                      setSelectedPartnerId('all');
                      setEntryTypeFilter('all');
                    }}
                    className="h-7 px-2 text-xs rounded border border-border text-muted-foreground hover:text-foreground flex items-center gap-1"
                    title="Đặt lại bộ lọc"
                  >
                    <RotateCcw size={12} /> Xóa lọc
                  </button>
                )}
              </div>
            </div>

            {/* 4 Summary Cards (Thu, Chi, Số tiền, Công nợ còn) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="bg-card/80 rounded-lg border border-border p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <ArrowDownLeft size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                    1. Tổng Thu (-)
                  </p>
                  <p className="text-sm font-bold text-emerald-600 font-mono truncate">
                    {formatNumber(summaryStats.totalThu)}
                  </p>
                </div>
              </div>

              <div className="bg-card/80 rounded-lg border border-border p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                  <ArrowUpRight size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                    2. Tổng Chi (+)
                  </p>
                  <p className="text-sm font-bold text-foreground font-mono truncate">
                    {formatNumber(summaryStats.totalChi)}
                  </p>
                </div>
              </div>

              <div className="bg-card/80 rounded-lg border border-border p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                  <Layers size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground truncate uppercase font-semibold">
                    3. Số tiền phát sinh
                  </p>
                  <p className="text-sm font-bold text-foreground font-mono truncate">
                    {formatNumber(summaryStats.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="bg-card/80 rounded-lg border border-rose-300/40 bg-rose-50/20 dark:bg-rose-950/20 p-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                  <Receipt size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-rose-600 truncate uppercase font-bold">
                    4. Công nợ còn
                  </p>
                  <p className="text-sm font-extrabold text-rose-600 font-mono truncate">
                    {formatNumber(summaryStats.totalRemainingDebt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* List Toolbar */}
          <ListToolbar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder={
              activeTab === 'npp'
                ? 'Tìm theo mã NPP, tên đại lý, số điện thoại, đơn hàng...'
                : 'Tìm theo mã NCC, tên nhà vườn, số điện thoại, lô nhập...'
            }
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            onDeleteMany={handleDeleteMany}
            columns={columns}
            onToggleColumn={handleToggleColumn}
            onUpdateColumn={handleUpdateColumn}
            onReorderColumns={handleReorderColumns}
            onResetColumns={handleResetColumns}
            onAdd={handleAddNew}
          />

          {/* Main DataTable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <DataTable<DebtDailyRecord>
              data={filteredData}
              columns={columns}
              isLoading={false}
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
              renderSummaryRow={renderSummaryRow}
              emptyTitle={`Chưa có bản ghi công nợ nào ${dateFilterMode !== 'all' ? 'trong khoảng thời gian này' : ''}`}
              emptyDescription="Bấm 'Thêm phát sinh công nợ' để ghi nhận tiền bán/nhập hoa và thu/trả nợ theo ngày"
              emptyAction={
                <Button size="sm" onClick={handleAddNew} className="gap-1.5 mt-2">
                  <Plus size={14} /> Thêm phát sinh công nợ
                </Button>
              }
            />
          </div>
        </div>
      )}

      {/* Drawer */}
      <CongNoDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        record={selectedRecord}
        mode={drawerMode}
        defaultPartnerType={activeTab === 'ncc' ? 'ncc' : 'npp'}
      />
    </div>
  );
}
