import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  Download,
  ExternalLink,
  History,
  Layers,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  SquarePen,
  Trash2,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { ListToolbar } from '@/components/data/ListToolbar';
import { DataTable } from '@/components/data/DataTable';
import { ModuleHistory } from '@/components/data/ModuleHistory';
import type { ColumnDef } from '@/stores/createListStore';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import {
  calculateSupplierFinancials,
  syncAllOrdersToDebtRecords,
  useDebtStore,
  useSupplierOrderStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import type { DebtDailyRecord } from '@/types/hoaKhangThanh';
import { formatDate, todayISODate } from '@/lib/format';
import { CongNoDrawer } from '../cong-no/CongNoDrawer';
import { getRecordReferenceCode, useAllDebtRecords } from '@/lib/virtualDebt';
import { CongNoNCCStats } from './CongNoNCCStats';

type Tab = 'soghi' | 'tonghop' | 'thongke' | 'lichsu';

const formatNumber = (num?: number) => {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('vi-VN');
};

const NCC_COLUMNS: ColumnDef[] = [
  { id: 'date', label: 'Ngày ghi nhận', visible: true, minWidth: 105, width: 115, order: 0 },
  { id: 'entryType', label: 'Hình thức ghi', visible: true, minWidth: 115, width: 125, order: 1 },
  { id: 'partnerName', label: 'Nhà Cung Cấp (NCC)', visible: true, minWidth: 190, width: 230, order: 2 },
  { id: 'referenceCode', label: 'Lô nhập / CT', visible: true, minWidth: 110, width: 125, order: 3 },
  { id: 'type', label: 'Phát sinh', visible: true, minWidth: 100, width: 110, order: 4 },
  { id: 'amount', label: 'Số tiền', visible: true, minWidth: 125, width: 135, order: 5 },
  { id: 'remainingDebt', label: 'Công nợ còn', visible: true, minWidth: 125, width: 135, order: 6 },
  { id: 'creator', label: 'Người lập', visible: true, minWidth: 110, width: 125, order: 7 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 80, width: 85, order: 8 },
  { id: 'id', label: 'Mã công nợ (ID)', visible: false, minWidth: 120, width: 135, order: 9 },
  { id: 'partnerCode', label: 'Mã NCC', visible: false, minWidth: 95, width: 105, order: 10 },
  { id: 'phone', label: 'Số điện thoại', visible: false, minWidth: 110, width: 120, order: 11 },
  { id: 'notes', label: 'Ghi chú', visible: false, minWidth: 180, width: 220, order: 12 },
];

export default function CongNoNCCPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Dữ liệu từ store
  const records = useAllDebtRecords();
  const { records: manualRecords, deleteRecord } = useDebtStore();
  const { suppliers } = useSupplierStore();
  const { orders: supplierOrders } = useSupplierOrderStore();

  // Tab State
  const initialTab = (searchParams.get('tab') as Tab) || 'soghi';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Partner Filter: Đọc từ query param nccId nếu có
  const nccParam = searchParams.get('nccId');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(nccParam || 'all');

  // Entry Type & Txn Type Filter
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'daily' | 'order'>('daily');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'chi' | 'thu'>('all');

  // Selection & Columns
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const {
    columns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  } = useColumnSettings('cong-no-ncc', NCC_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedRecord, setSelectedRecord] = useState<DebtDailyRecord | null>(null);
  const [drawerDefaultPartnerId, setDrawerDefaultPartnerId] = useState<string | undefined>(undefined);

  // State cho Tab Tổng hợp
  const [tongHopSearch, setTongHopSearch] = useState('');
  const [tongHopDebtFilter, setTongHopDebtFilter] = useState<'all' | 'has_debt' | 'zero_debt'>('all');

  // Tự động đồng bộ đơn nhập sang sổ công nợ khi mở trang
  useEffect(() => {
    syncAllOrdersToDebtRecords();
  }, []);

  // Khi param url thay đổi nccId
  useEffect(() => {
    if (nccParam) {
      setSelectedPartnerId(nccParam);
    }
  }, [nccParam]);

  const handleSyncFromOrders = () => {
    const res = syncAllOrdersToDebtRecords();
    toast.success(
      `Công nợ đã khớp với ${res.syncedNCC} đơn nhập nhà vườn (tự tính từ đơn đặt hoa NCC)` +
        (res.removed > 0 ? ` • đã bỏ ${res.removed} dòng công nợ cũ trùng với đơn` : ''),
    );
  };

  // Dòng lấy từ đơn hàng (cột ảo) → không sửa / xóa ở Công nợ
  const isLocked = (r: DebtDailyRecord) => Boolean(r.isVirtual || r.childRecords?.some((c) => c.isVirtual));
  const lockedMessage = (r: DebtDailyRecord) => {
    const codes = (r.childRecords?.length ? r.childRecords : [r])
      .filter((c) => c.isVirtual)
      .map((c) => c.referenceCode)
      .filter(Boolean);
    const list = Array.from(new Set(codes)).slice(0, 3).join(', ');
    return `Công nợ của lô nhập ${list} tự lấy từ Đơn đặt hoa NCC. Muốn đổi thì sửa trong Đơn hàng NCC.`;
  };

  // Preset lọc ngày
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

  // Danh sách NCC chuẩn có tính toán tài chính
  const enrichedSuppliers = useMemo(() => {
    return suppliers.map((s) => {
      const fin = calculateSupplierFinancials(s, manualRecords, supplierOrders);
      return {
        ...s,
        oldDebt: fin.oldDebt,
        importAmount: fin.importAmount,
        paidAmount: fin.paidAmount,
        finalDebt: fin.finalDebt,
        totalDebt: fin.totalDebt,
      };
    });
  }, [suppliers, manualRecords, supplierOrders]);

  // Danh sách NCC cho bộ lọc dropdown kèm số dư nợ
  const filterPartners = useMemo(() => {
    return enrichedSuppliers.map((s) => ({
      id: s.id,
      name: `${s.code} - ${s.name}`,
      finalDebt: s.finalDebt || 0,
    }));
  }, [enrichedSuppliers]);

  // Lọc dữ liệu Sổ ghi công nợ NCC
  const filteredData = useMemo(() => {
    // 1. Chỉ lấy đối tượng NCC
    const baseRecords = records.filter((r) => {
      if (r.partnerType !== 'ncc') return false;

      // Filter theo NCC được chọn
      if (selectedPartnerId !== 'all' && r.partnerId !== selectedPartnerId) return false;

      // Filter date range
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      // Filter search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchCode = (r.partnerCode || '').toLowerCase().includes(q);
        const matchName = (r.partnerName || '').toLowerCase().includes(q);
        const refDisplay = getRecordReferenceCode(r).toLowerCase();
        const matchRef = (r.referenceCode || '').toLowerCase().includes(q) || refDisplay.includes(q);
        const matchNotes = (r.notes || '').toLowerCase().includes(q);
        const matchCreator = (r.creator || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchRef && !matchNotes && !matchCreator) {
          return false;
        }
      }

      return true;
    });

    // 2. Chế độ lọc Ghi theo đơn / Ghi theo ngày (gộp)
    let rawList: DebtDailyRecord[] = [];
    if (entryTypeFilter === 'order') {
      rawList = baseRecords.filter(
        (r) =>
          r.entryType === 'order' ||
          Boolean(r.referenceCode && (r.referenceCode.startsWith('PO-') || r.referenceCode.startsWith('DH-'))),
      );
    } else if (entryTypeFilter === 'daily') {
      const groups = new Map<string, DebtDailyRecord[]>();
      baseRecords.forEach((r) => {
        const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
        const itemType = isThu ? 'thu' : 'chi';
        const key = `${r.date}__${r.partnerId || r.partnerCode}__${itemType}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(r);
      });

      rawList = Array.from(groups.values()).map((items) => {
        if (items.length === 1) {
          return { ...items[0], entryType: 'daily' as const };
        }
        const first = items[0];
        const isThu = first.type === 'thu' || ((first.decreaseAmount || 0) > 0 && (first.increaseAmount || 0) === 0);
        const totalAmount = items.reduce(
          (sum, it) =>
            sum +
            (it.amount !== undefined
              ? it.amount
              : isThu
              ? it.decreaseAmount || 0
              : it.increaseAmount || 0),
          0,
        );

        return {
          ...first,
          id: `merged-ncc-${first.date}-${first.partnerId || first.partnerCode}-${isThu ? 'thu' : 'chi'}`,
          entryType: 'daily' as const,
          type: isThu ? ('thu' as const) : ('chi' as const),
          amount: totalAmount,
          increaseAmount: isThu ? 0 : totalAmount,
          decreaseAmount: isThu ? totalAmount : 0,
          referenceCode: `${items.length} giao dịch gộp`,
          notes: items.map((it) => it.notes || it.referenceCode).filter(Boolean).join('; '),
          childRecords: items,
        };
      });
    } else {
      rawList = baseRecords;
    }

    // 3. Lọc theo loại phát sinh (Chi trả tiền / Nhập hoa)
    let filteredByTxn = rawList;
    if (txnTypeFilter === 'chi') {
      filteredByTxn = rawList.filter(
        (r) => r.type === 'chi' || ((r.increaseAmount || 0) > 0 && (r.decreaseAmount || 0) === 0),
      );
    } else if (txnTypeFilter === 'thu') {
      filteredByTxn = rawList.filter(
        (r) => r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0),
      );
    }

    // 4. Tính toán số dư công nợ lũy kế (Cột ảo) cho từng NCC
    const finalRowsWithVirtualDebt: DebtDailyRecord[] = [];
    const uniquePartnerIds = Array.from(
      new Set(filteredByTxn.map((r) => r.partnerId || r.partnerCode)),
    );

    uniquePartnerIds.forEach((pId) => {
      const pSupplier = suppliers.find((s) => s.id === pId || s.code === pId);
      const baseDebt = pSupplier?.oldDebt || 0;

      const pRows = filteredByTxn.filter((r) => (r.partnerId === pId || r.partnerCode === pId));
      const chronological = [...pRows].sort((a, b) => {
        const dc = a.date.localeCompare(b.date);
        if (dc !== 0) return dc;
        const aIsThu = a.type === 'thu' || ((a.decreaseAmount || 0) > 0 && (a.increaseAmount || 0) === 0);
        const bIsThu = b.type === 'thu' || ((b.decreaseAmount || 0) > 0 && (b.increaseAmount || 0) === 0);
        if (!aIsThu && bIsThu) return -1;
        if (aIsThu && !bIsThu) return 1;
        return a.id.localeCompare(b.id);
      });

      let running = baseDebt;
      chronological.forEach((row) => {
        const isThu = row.type === 'thu' || ((row.decreaseAmount || 0) > 0 && (row.increaseAmount || 0) === 0);
        const amt =
          row.amount !== undefined
            ? row.amount
            : isThu
            ? row.decreaseAmount || 0
            : row.increaseAmount || 0;
        // Chi trả tiền NCC làm GIẢM nợ, Nhập hoa làm TĂNG nợ
        if (isThu) {
          running -= amt;
        } else {
          running += amt;
        }
        row.remainingDebt = running;
      });

      finalRowsWithVirtualDebt.push(...chronological);
    });

    // Sắp xếp ngày mới nhất lên đầu
    return finalRowsWithVirtualDebt.sort((a, b) => {
      const dc = b.date.localeCompare(a.date);
      if (dc !== 0) return dc;
      const aIsThu = a.type === 'thu' || ((a.decreaseAmount || 0) > 0 && (a.increaseAmount || 0) === 0);
      const bIsThu = b.type === 'thu' || ((b.decreaseAmount || 0) > 0 && (b.increaseAmount || 0) === 0);
      if (aIsThu && !bIsThu) return -1;
      if (!aIsThu && bIsThu) return 1;
      return b.id.localeCompare(a.id);
    });
  }, [
    records,
    selectedPartnerId,
    entryTypeFilter,
    txnTypeFilter,
    startDate,
    endDate,
    searchTerm,
    suppliers,
  ]);

  // Thống kê nhanh tóm tắt
  const summaryStats = useMemo(() => {
    let totalImport = 0; // Chi: phát sinh nhập hoa nợ vườn
    let totalPaid = 0; // Thu: chi trả tiền cho vườn
    let totalAmount = 0;

    filteredData.forEach((r) => {
      const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
      const amt =
        r.amount !== undefined ? r.amount : isThu ? r.decreaseAmount || 0 : r.increaseAmount || 0;

      if (isThu) {
        totalPaid += amt;
      } else {
        totalImport += amt;
      }
      totalAmount += amt;
    });

    const partnersInView = Array.from(new Set(filteredData.map((r) => r.partnerId || r.partnerCode)));
    let totalRemainingDebt = 0;

    partnersInView.forEach((pId) => {
      const s = suppliers.find((x) => x.id === pId || x.code === pId);
      const baseDebt = s?.oldDebt || 0;
      const pRows = filteredData.filter((r) => r.partnerId === pId || r.partnerCode === pId);
      let pImport = 0;
      let pPaid = 0;
      pRows.forEach((r) => {
        const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
        const amt =
          r.amount !== undefined ? r.amount : isThu ? r.decreaseAmount || 0 : r.increaseAmount || 0;
        if (isThu) pPaid += amt;
        else pImport += amt;
      });
      totalRemainingDebt += baseDebt + pImport - pPaid;
    });

    return {
      totalImport,
      totalPaid,
      totalAmount,
      totalRemainingDebt,
      count: filteredData.length,
    };
  }, [filteredData, suppliers]);

  // Dữ liệu cho Tab Tổng hợp NCC
  const filteredTongHopSuppliers = useMemo(() => {
    return enrichedSuppliers.filter((s) => {
      if (tongHopDebtFilter === 'has_debt' && (s.finalDebt || 0) <= 0) return false;
      if (tongHopDebtFilter === 'zero_debt' && (s.finalDebt || 0) > 0) return false;

      if (tongHopSearch) {
        const q = tongHopSearch.toLowerCase();
        const matchCode = s.code.toLowerCase().includes(q);
        const matchName = s.name.toLowerCase().includes(q);
        const matchContact = (s.contactPerson || '').toLowerCase().includes(q);
        const matchPhone = (s.phone || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchContact && !matchPhone) return false;
      }

      return true;
    });
  }, [enrichedSuppliers, tongHopDebtFilter, tongHopSearch]);

  // Chọn dòng
  const handleToggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((r) => r.id)));
    }
  };

  // Mở Drawer thêm mới / trả tiền NCC
  const handleAddNewDebt = (targetNccId?: string) => {
    setSelectedRecord(null);
    setDrawerDefaultPartnerId(targetNccId || (selectedPartnerId !== 'all' ? selectedPartnerId : undefined));
    setDrawerMode('create');
    setIsDrawerOpen(true);
  };

  const handleEdit = (r: DebtDailyRecord) => {
    if (isLocked(r)) {
      toast.info(lockedMessage(r));
      return;
    }
    if (r.childRecords && r.childRecords.length === 1) {
      setSelectedRecord(r.childRecords[0]);
    } else {
      setSelectedRecord(r);
    }
    setDrawerDefaultPartnerId(r.partnerId);
    setDrawerMode('edit');
    setIsDrawerOpen(true);
  };

  const handleView = (r: DebtDailyRecord) => {
    setSelectedRecord(r);
    setDrawerDefaultPartnerId(r.partnerId);
    setDrawerMode('view');
    setIsDrawerOpen(true);
  };

  const handleDelete = (r: DebtDailyRecord) => {
    if (isLocked(r)) {
      toast.info(lockedMessage(r));
      return;
    }
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
    if (confirm(`Xác nhận xóa bản ghi công nợ ngày ${formatDate(r.date)} của ${r.partnerName}?`)) {
      deleteRecord(targetId);
      toast.success('Đã xóa bản ghi công nợ NCC');
    }
  };

  // Chuyển sang Tab Sổ ghi từ Tab Tổng hợp
  const handleViewNCCLedger = (nccId: string) => {
    setSelectedPartnerId(nccId);
    setActiveTab('soghi');
    setSearchParams({ nccId, tab: 'soghi' });
  };

  // Xuất Excel sổ công nợ NCC
  const handleExportExcelLedger = () => {
    if (filteredData.length === 0) {
      toast.error('Không có dữ liệu công nợ NCC để xuất Excel');
      return;
    }

    const exportRows = filteredData.map((r, i) => {
      const isOrder =
        r.entryType === 'order' ||
        Boolean(r.referenceCode && (r.referenceCode.startsWith('PO-') || r.referenceCode.startsWith('DH-')));
      const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
      const amt =
        r.amount !== undefined ? r.amount : isThu ? r.decreaseAmount || 0 : r.increaseAmount || 0;
      const remDebt =
        r.remainingDebt !== undefined
          ? r.remainingDebt
          : r.finalDebt !== undefined
          ? r.finalDebt
          : (r.oldDebt || 0) + (r.increaseAmount || 0) - (r.decreaseAmount || 0);

      return {
        STT: i + 1,
        'Mã công nợ (ID)': r.id || '—',
        'Ngày ghi nhận': formatDate(r.date),
        'Hình thức ghi': isOrder ? 'Ghi theo đơn' : 'Ghi theo ngày',
        'Mã NCC': r.partnerCode,
        'Tên Nhà Cung Cấp': r.partnerName,
        'Số điện thoại': r.phone || '',
        'Lô nhập / Chứng từ': getRecordReferenceCode(r),
        'Loại phát sinh': isThu ? 'Trả tiền NCC (-)' : 'Nhập hoa nợ (+)',
        'Số tiền': amt || 0,
        'Công nợ còn': remDebt || 0,
        'Người lập': r.creator || '',
        'Ghi chú': r.notes || '',
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'So_Cong_No_NCC');
    XLSX.writeFile(wb, `So_Cong_No_NCC_${todayISODate()}.xlsx`);
    toast.success('Đã xuất file Excel sổ công nợ NCC thành công');
  };

  // Xuất Excel bảng tổng hợp NCC
  const handleExportExcelTongHop = () => {
    if (filteredTongHopSuppliers.length === 0) {
      toast.error('Không có dữ liệu NCC để xuất Excel');
      return;
    }

    const exportRows = filteredTongHopSuppliers.map((s, i) => ({
      STT: i + 1,
      'Mã NCC': s.code,
      'Tên Nhà Cung Cấp': s.name,
      'Người liên hệ': s.contactPerson || '',
      'Số điện thoại': s.phone || '',
      'Công nợ cũ': s.oldDebt || 0,
      'Tiền nhập hoa': s.importAmount || 0,
      'Tiền đã trả NCC': s.paidAmount || 0,
      'Còn nợ cuối': s.finalDebt || 0,
      'Trạng thái': s.status === 'active' ? 'Đang hợp tác' : 'Tạm ngưng',
      'Địa chỉ': s.address || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tong_Hop_Cong_No_NCC');
    XLSX.writeFile(wb, `Tong_Hop_Cong_No_NCC_${todayISODate()}.xlsx`);
    toast.success('Đã xuất bảng tổng hợp công nợ NCC thành công');
  };

  // Cell Renderer cho DataTable Sổ ghi
  const renderCell = (colId: string, row: DebtDailyRecord) => {
    const isOrder =
      row.entryType === 'order' ||
      Boolean(row.referenceCode && (row.referenceCode.startsWith('PO-') || row.referenceCode.startsWith('DH-')));
    const isThu = row.type === 'thu' || ((row.decreaseAmount || 0) > 0 && (row.increaseAmount || 0) === 0);
    const amt =
      row.amount !== undefined ? row.amount : isThu ? row.decreaseAmount || 0 : row.increaseAmount || 0;
    const remDebt =
      row.remainingDebt !== undefined
        ? row.remainingDebt
        : row.finalDebt !== undefined
        ? row.finalDebt
        : (row.oldDebt || 0) + (row.increaseAmount || 0) - (row.decreaseAmount || 0);

    switch (colId) {
      case 'date':
        return <span className="text-xs font-mono font-bold text-foreground">{formatDate(row.date)}</span>;
      case 'entryType':
        return isOrder ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            📦 Ghi theo đơn
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
            📅 Ghi theo ngày
          </span>
        );
      case 'partnerCode': {
        const sup = suppliers.find((s) => s.id === row.partnerId || s.name?.trim().toLowerCase() === row.partnerName?.trim().toLowerCase());
        const code = row.partnerCode && row.partnerCode !== 'NCC-LE' ? row.partnerCode : sup?.code || '';
        return (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-muted/60 border border-border">
            {code || '—'}
          </span>
        );
      }
      case 'partnerName': {
        const sup = suppliers.find((s) => s.id === row.partnerId || s.name?.trim().toLowerCase() === row.partnerName?.trim().toLowerCase());
        const code = row.partnerCode && row.partnerCode !== 'NCC-LE' ? row.partnerCode : sup?.code || '';
        return (
          <div className="flex flex-col gap-0.5 items-start">
            <button
              type="button"
              onClick={() => handleView(row)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline text-left leading-snug"
            >
              {row.partnerName}
            </button>
            {code && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded border border-border/60">
                {code}
              </span>
            )}
          </div>
        );
      }
      case 'referenceCode': {
        const refDisplay = getRecordReferenceCode(row);
        return refDisplay ? (
          <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground">
            {refDisplay}
          </span>
        ) : (
          <span className="text-xs font-mono text-muted-foreground">—</span>
        );
      }
      case 'type':
        return isThu ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            ↓ Trả NCC
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            ↑ Nhập nợ
          </span>
        );
      case 'amount':
        return (
          <span className={`text-xs font-mono font-bold ${isThu ? 'text-emerald-600' : 'text-orange-600'}`}>
            {isThu ? '↓ ' : '↑ '}
            {formatNumber(amt)}
          </span>
        );
      case 'remainingDebt':
        return (
          <span
            className={`text-xs font-mono font-extrabold ${
              remDebt > 0 ? 'text-rose-600' : remDebt === 0 ? 'text-emerald-600' : 'text-emerald-600'
            }`}
          >
            {remDebt < 0 ? `Dư trả: ${formatNumber(Math.abs(remDebt))}` : formatNumber(remDebt)}
          </span>
        );
      case 'creator':
        return <span className="text-xs text-muted-foreground">{row.creator || '—'}</span>;
      case 'id':
        return (
          <span className="text-xs font-mono font-semibold text-muted-foreground px-2 py-0.5 rounded bg-muted/60 border border-border">
            {row.id || '—'}
          </span>
        );
      case 'phone':
        return <span className="text-xs font-mono text-muted-foreground">{row.phone || '—'}</span>;
      case 'notes':
        return <span className="text-xs text-muted-foreground truncate max-w-[200px]">{row.notes || '—'}</span>;
      case 'actions':
        if (isLocked(row)) {
          return (
            <button
              type="button"
              onClick={() => toast.info(lockedMessage(row))}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-muted-foreground bg-muted/70 border border-border"
              title={lockedMessage(row)}
            >
              🔒 Đơn nhập
            </button>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleEdit(row)}
              className="p-1 rounded text-primary hover:bg-primary/10 transition-colors"
              title="Chỉnh sửa phiếu ghi nợ"
            >
              <SquarePen size={14} />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Xóa phiếu ghi nợ"
            >
              <Trash2 size={14} />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMobileCard = (row: DebtDailyRecord, selected: boolean) => {
    const isThu = row.type === 'thu' || ((row.decreaseAmount || 0) > 0 && (row.increaseAmount || 0) === 0);
    const amt =
      row.amount !== undefined ? row.amount : isThu ? row.decreaseAmount || 0 : row.increaseAmount || 0;
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
            <span className="text-xs font-mono font-bold text-foreground">{formatDate(row.date)}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isThu ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'
              }`}
            >
              {isThu ? '↓ Trả NCC' : '↑ Nhập hoa'}
            </span>
          </div>
          <span className={`text-xs font-mono font-extrabold ${isThu ? 'text-emerald-600' : 'text-orange-600'}`}>
            {formatNumber(amt)}
          </span>
        </div>
        <div className="text-sm font-semibold text-foreground flex items-center justify-between">
          <span>{row.partnerName}</span>
          <span className="text-xs font-mono font-bold text-muted-foreground">{row.partnerCode}</span>
        </div>
        <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
          <span className="text-muted-foreground">Còn nợ lại:</span>
          <span className={`font-mono font-extrabold ${remDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatNumber(remDebt)} đ
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Tab Navigation */}
      <div className="px-3 sm:px-4 pt-3 pb-1 shrink-0 bg-background border-b border-border/50">
        <Tabs<Tab>
          tabs={[
            { id: 'soghi', label: 'Sổ ghi công nợ NCC', icon: Receipt },
            { id: 'tonghop', label: 'Tổng hợp theo NCC', icon: Layers },
            { id: 'thongke', label: 'Báo cáo & Thống kê', icon: BarChart3 },
            { id: 'lichsu', label: 'Lịch sử thao tác', icon: History },
          ]}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab);
            setSearchParams((prev) => {
              const p = new URLSearchParams(prev);
              p.set('tab', tab);
              return p;
            });
          }}
        />
      </div>

      {activeTab === 'lichsu' ? (
        <ModuleHistory module="cong-no" />
      ) : activeTab === 'thongke' ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <CongNoNCCStats />
        </div>
      ) : activeTab === 'tonghop' ? (
        /* Tab 2: Tổng hợp theo NCC */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Toolbar Tổng hợp */}
          <div className="p-3 sm:p-4 bg-card/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm theo mã NCC, tên nhà vườn, SĐT..."
                  value={tongHopSearch}
                  onChange={(e) => setTongHopSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Lọc trạng thái nợ */}
              <select
                value={tongHopDebtFilter}
                onChange={(e) => setTongHopDebtFilter(e.target.value as any)}
                className="h-8 px-2.5 text-xs bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Tất cả ({enrichedSuppliers.length} NCC)</option>
                <option value="has_debt">
                  Đang có nợ ({enrichedSuppliers.filter((s) => (s.finalDebt || 0) > 0).length} NCC)
                </option>
                <option value="zero_debt">
                  Hết nợ ({enrichedSuppliers.filter((s) => (s.finalDebt || 0) <= 0).length} NCC)
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/nha-cung-cap')}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <Truck size={13} />
                <span>Danh bạ NCC</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcelTongHop}
                className="h-8 gap-1.5 text-xs"
              >
                <Download size={13} />
                <span>Xuất Excel</span>
              </Button>
            </div>
          </div>

          {/* Bảng Tổng Hợp Công Nợ NCC */}
          <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4">
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted/60 text-foreground font-semibold border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Mã NCC</th>
                    <th className="py-2.5 px-3">Tên Nhà Cung Cấp</th>
                    <th className="py-2.5 px-3">Người liên hệ & SĐT</th>
                    <th className="py-2.5 px-3 text-right">Nợ cũ</th>
                    <th className="py-2.5 px-3 text-right text-orange-600">Tiền nhập hoa (+)</th>
                    <th className="py-2.5 px-3 text-right text-emerald-600">Đã trả NCC (-)</th>
                    <th className="py-2.5 px-3 text-right">Còn nợ cuối</th>
                    <th className="py-2.5 px-3 text-center">Trạng thái</th>
                    <th className="py-2.5 px-3 text-center w-36">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredTongHopSuppliers.map((s, idx) => {
                    const finalDebt = s.finalDebt || 0;
                    return (
                      <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 text-center text-muted-foreground">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                          <span className="px-1.5 py-0.5 rounded bg-muted border border-border text-[11px]">
                            {s.code}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          <button
                            type="button"
                            onClick={() => handleViewNCCLedger(s.id)}
                            className="text-left hover:text-emerald-600 hover:underline flex items-center gap-1.5"
                          >
                            <span>{s.name}</span>
                            <ExternalLink size={11} className="text-muted-foreground" />
                          </button>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground">
                          <div>{s.contactPerson || '—'}</div>
                          {s.phone && <div className="font-mono text-[11px] text-foreground">{s.phone}</div>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-muted-foreground">
                          {formatNumber(s.oldDebt || 0)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-orange-600">
                          {formatNumber(s.importAmount || 0)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-600">
                          {formatNumber(s.paidAmount || 0)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-extrabold text-right">
                          <span className={finalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                            {formatNumber(finalDebt)} đ
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              s.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {s.status === 'active' ? 'Đang hợp tác' : 'Tạm ngưng'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleViewNCCLedger(s.id)}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              title="Xem sổ chi tiết phát sinh công nợ của NCC này"
                            >
                              Sổ chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddNewDebt(s.id)}
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              title="Tạo phiếu thanh toán / trả tiền cho NCC này"
                            >
                              Trả tiền
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTongHopSuppliers.length === 0 && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy Nhà Cung Cấp nào phù hợp
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* Dòng tổng kết */}
                {filteredTongHopSuppliers.length > 0 && (
                  <tfoot className="bg-muted/80 font-bold border-t border-border">
                    <tr>
                      <td colSpan={4} className="py-2.5 px-3 text-right">
                        Tổng cộng ({filteredTongHopSuppliers.length} NCC):
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-muted-foreground">
                        {formatNumber(filteredTongHopSuppliers.reduce((s, x) => s + (x.oldDebt || 0), 0))}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-orange-600">
                        {formatNumber(filteredTongHopSuppliers.reduce((s, x) => s + (x.importAmount || 0), 0))}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-emerald-600">
                        {formatNumber(filteredTongHopSuppliers.reduce((s, x) => s + (x.paidAmount || 0), 0))}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-rose-600">
                        {formatNumber(filteredTongHopSuppliers.reduce((s, x) => s + (x.finalDebt || 0), 0))} đ
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 1: Sổ ghi chi tiết công nợ NCC */
        <div className="flex-1 flex flex-col min-h-0">
          {/* Thanh lọc ngày & Lọc đối tác */}
          <div className="px-4 py-2.5 bg-card/40 border-b border-border/60 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Preset lọc ngày */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                  <Calendar size={13} className="text-primary" /> Lọc ngày:
                </span>
                {(['all', 'today', 'yesterday', 'week', 'month'] as const).map((m) => {
                  const labels = {
                    all: 'Tất cả',
                    today: 'Hôm nay',
                    yesterday: 'Hôm qua',
                    week: '7 ngày qua',
                    month: 'Tháng này',
                  };
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleQuickDateFilter(m)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                        dateFilterMode === m
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                          : 'bg-muted/70 text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {labels[m]}
                    </button>
                  );
                })}
              </div>

              {/* Tùy chỉnh ngày */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateFilterMode('custom');
                  }}
                  className="h-7 px-2 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted-foreground">đến</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateFilterMode('custom');
                  }}
                  className="h-7 px-2 text-xs rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {(startDate || endDate) && (
                  <button
                    type="button"
                    onClick={() => handleQuickDateFilter('all')}
                    className="text-xs text-rose-500 hover:underline ml-1"
                  >
                    Xóa lọc
                  </button>
                )}
              </div>
            </div>

            {/* Dropdown bộ lọc NCC & Bộ lọc hình thức / loại phát sinh */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-border/40">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Chọn NCC */}
                <div className="flex items-center gap-1.5">
                  <Truck size={14} className="text-emerald-600 shrink-0" />
                  <select
                    value={selectedPartnerId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedPartnerId(val);
                      setSearchParams((prev) => {
                        const p = new URLSearchParams(prev);
                        if (val === 'all') p.delete('nccId');
                        else p.set('nccId', val);
                        return p;
                      });
                    }}
                    className="h-8 px-2.5 text-xs font-semibold rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-[280px]"
                  >
                    <option value="all">Tất cả Nhà Cung Cấp ({filterPartners.length} NCC)</option>
                    {filterPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.finalDebt > 0 ? `(Nợ: ${formatNumber(p.finalDebt)} đ)` : '(Hết nợ)'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lọc hình thức ghi */}
                <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setEntryTypeFilter('daily')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      entryTypeFilter === 'daily'
                        ? 'bg-card text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Theo ngày
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryTypeFilter('order')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      entryTypeFilter === 'order'
                        ? 'bg-card text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Theo đơn nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryTypeFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                      entryTypeFilter === 'all'
                        ? 'bg-card text-foreground font-bold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Tất cả
                  </button>
                </div>

                {/* Lọc loại phát sinh */}
                <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setTxnTypeFilter('all')}
                    className={`px-2 py-1 rounded-md font-medium ${
                      txnTypeFilter === 'all' ? 'bg-card text-foreground font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    Tất cả loại
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnTypeFilter('chi')}
                    className={`px-2 py-1 rounded-md font-medium ${
                      txnTypeFilter === 'chi' ? 'bg-card text-orange-600 font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    Nhập hoa (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxnTypeFilter('thu')}
                    className={`px-2 py-1 rounded-md font-medium ${
                      txnTypeFilter === 'thu' ? 'bg-card text-emerald-600 font-bold' : 'text-muted-foreground'
                    }`}
                  >
                    Trả NCC (-)
                  </button>
                </div>
              </div>

              {/* Tóm tắt chỉ số nhanh */}
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-orange-600 font-bold">
                  Nhập: +{formatNumber(summaryStats.totalImport)}
                </span>
                <span className="text-emerald-600 font-bold">
                  Đã trả: -{formatNumber(summaryStats.totalPaid)}
                </span>
                <span className="text-rose-600 font-extrabold bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded border border-rose-200">
                  Dư nợ: {formatNumber(summaryStats.totalRemainingDebt)} đ
                </span>
              </div>
            </div>
          </div>

          {/* ListToolbar */}
          <ListToolbar
            showBack={true}
            searchPlaceholder="Tìm theo mã NCC, tên nhà vườn, mã đơn PO, chứng từ, người lập..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCount={selectedIds.size}
            onClearSelection={() => setSelectedIds(new Set())}
            onDeleteMany={() => {
              if (confirm(`Xác nhận xóa ${selectedIds.size} bản ghi công nợ NCC đã chọn?`)) {
                selectedIds.forEach((id) => deleteRecord(id));
                setSelectedIds(new Set());
                toast.success('Đã xóa các bản ghi công nợ đã chọn');
              }
            }}
            columns={columns}
            onToggleColumn={handleToggleColumn}
            onUpdateColumn={handleUpdateColumn}
            onReorderColumns={handleReorderColumns}
            onResetColumns={handleResetColumns}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncFromOrders}
                  className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  title="Tự động đồng bộ số dư công nợ từ tất cả đơn đặt hoa NCC"
                >
                  <RefreshCw size={13} />
                  <span className="hidden sm:inline">Đồng bộ đơn nhập</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcelLedger}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Download size={13} />
                  <span className="hidden sm:inline">Xuất Excel</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAddNewDebt()}
                  className="h-8 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  <Plus size={14} className="stroke-[2.5px]" />
                  <span>Trả tiền / Ghi nợ NCC</span>
                </Button>
              </div>
            }
          />

          {/* Table */}
          <div className="flex-1 min-h-0">
            <DataTable<DebtDailyRecord>
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

      {/* Drawer Ghi nợ / Thanh toán NCC */}
      {isDrawerOpen && (
        <CongNoDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          record={selectedRecord}
          mode={drawerMode}
          defaultPartnerType="ncc"
          lockPartnerType={true}
          defaultPartnerId={drawerDefaultPartnerId}
        />
      )}
    </div>
  );
}
