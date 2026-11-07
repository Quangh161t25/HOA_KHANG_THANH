import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Boxes,
  ClipboardCheck,
  ChartColumn,
  Download,
  History,
  Plus,
  Printer,
  RotateCcw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { DataTable } from '@/components/data/DataTable';
import { ModuleHistory } from '@/components/data/ModuleHistory';
import type { ColumnDef } from '@/stores/createListStore';
import { useColumnSettings } from '@/hooks/useColumnSettings';
import {
  useFlowerStore,
  useInventoryStore,
  useOrderStore,
  useSupplierOrderStore,
} from '@/stores/hoaKhangThanhStore';
import type { InventoryItem } from '@/types/hoaKhangThanh';
import { todayISODate } from '@/lib/format';
import { TonKhoDrawer } from './TonKhoDrawer';
import { TonKhoStats } from './TonKhoStats';

type Tab = 'danhsach' | 'thongke' | 'lichsu';
type StockStatusFilter = 'all' | 'in_stock' | 'out_of_stock' | 'has_activity';

interface InventoryReportRow extends InventoryItem {
  openingStock: number;
  importStock: number;
  exportStock: number;
  closingStock: number;
}

// 6 cột chuẩn theo đúng yêu cầu: Mã hoa, Tên hoa, Tồn đầu, Nhập, Xuất, Tồn cuối (không cột nào khác)
const INITIAL_COLUMNS: ColumnDef[] = [
  { id: 'flowerCode', label: 'Mã hoa', visible: true, minWidth: 120, width: 140, pinned: true, order: 0 },
  { id: 'flowerName', label: 'Tên hoa', visible: true, minWidth: 200, width: 260, order: 1 },
  { id: 'openingStock', label: 'Tồn đầu', visible: true, minWidth: 110, width: 130, align: 'right', order: 2 },
  { id: 'importStock', label: 'Nhập', visible: true, minWidth: 110, width: 130, align: 'right', order: 3 },
  { id: 'exportStock', label: 'Xuất', visible: true, minWidth: 110, width: 130, align: 'right', order: 4 },
  { id: 'closingStock', label: 'Tồn cuối', visible: true, minWidth: 120, width: 140, align: 'right', order: 5 },
];

export default function TonKhoPage() {
  const { inventory, updateInventoryItem } = useInventoryStore();
  const { flowers, updateStock } = useFlowerStore();
  const { orders } = useOrderStore();
  const { orders: supplierOrders } = useSupplierOrderStore();

  const [activeTab, setActiveTab] = useState<Tab>('danhsach');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('all');

  // Columns & Column Settings
  const {
    columns,
    handleUpdateColumn,
  } = useColumnSettings('ton_kho_v2', INITIAL_COLUMNS);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Drawer Nhập / Xuất kho
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'import' | 'export' | 'view'>('import');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Modal điều chỉnh Tồn đầu kỳ
  const [editingItem, setEditingItem] = useState<InventoryReportRow | null>(null);
  const [editingOpeningValue, setEditingOpeningValue] = useState<number>(0);

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  // Tính toán số liệu Tồn đầu, Nhập, Xuất, Tồn cuối cho từng loại hoa
  const inventoryReportData = useMemo<InventoryReportRow[]>(() => {
    // 1. Tạo danh sách tổng hợp tất cả mặt hàng hoa từ FlowerStore & InventoryStore
    const itemMap = new Map<string, InventoryItem>();

    flowers.forEach((fl) => {
      const key = (fl.code || fl.id).trim().toLowerCase();
      itemMap.set(key, {
        flowerId: fl.id,
        flowerCode: fl.code,
        flowerName: fl.name,
        category: fl.category || 'Hoa tươi',
        unit: fl.unit || 'cành',
        warehouse: 'Kho mát',
        currentStock: fl.stock ?? 0,
        minStock: 50,
        maxStock: 500,
        costPrice: fl.costPrice || 0,
        lastImportDate: '',
        shelfLifeDays: 7,
        freshness: 'Tươi mới',
        status: (fl.stock <= 0 ? 'out' : 'normal') as InventoryItem['status'],
        openingStock: undefined,
        importStock: 0,
        exportStock: 0,
      });
    });

    inventory.forEach((inv) => {
      const key = (inv.flowerCode || inv.flowerId).trim().toLowerCase();
      const existing = itemMap.get(key);
      if (existing) {
        itemMap.set(key, {
          ...existing,
          ...inv,
          currentStock: inv.currentStock ?? existing.currentStock,
        });
      } else {
        itemMap.set(key, inv);
      }
    });

    // 2. Tính số lượng Nhập từ Đơn nhập NCC (Supplier Orders) + Nhập thủ công
    const importQtyMap = new Map<string, number>();
    supplierOrders
      .filter((o) => o.status !== 'huy')
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 0;
          const codeKey = (item.flowerCode || '').trim().toLowerCase();
          const idKey = (item.flowerId || '').trim().toLowerCase();
          const nameKey = (item.flowerName || '').trim().toLowerCase();
          if (codeKey) importQtyMap.set(codeKey, (importQtyMap.get(codeKey) || 0) + qty);
          if (idKey && idKey !== codeKey) importQtyMap.set(idKey, (importQtyMap.get(idKey) || 0) + qty);
          if (nameKey && nameKey !== codeKey) importQtyMap.set(nameKey, (importQtyMap.get(nameKey) || 0) + qty);
        });
      });

    // 3. Tính số lượng Xuất từ Đơn hàng bán (Customer Orders) + Xuất thủ công
    const exportQtyMap = new Map<string, number>();
    orders
      .filter((o) => o.status !== 'huy')
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 0;
          const codeKey = (item.flowerCode || '').trim().toLowerCase();
          const idKey = (item.flowerId || '').trim().toLowerCase();
          const nameKey = (item.flowerName || '').trim().toLowerCase();
          if (codeKey) exportQtyMap.set(codeKey, (exportQtyMap.get(codeKey) || 0) + qty);
          if (idKey && idKey !== codeKey) exportQtyMap.set(idKey, (exportQtyMap.get(idKey) || 0) + qty);
          if (nameKey && nameKey !== codeKey) exportQtyMap.set(nameKey, (exportQtyMap.get(nameKey) || 0) + qty);
        });
      });

    // 4. Áp dụng công thức kế toán kho chuẩn:
    // Tồn cuối = Tồn đầu + Nhập - Xuất
    // => Tồn đầu = Tồn cuối - Nhập + Xuất
    return Array.from(itemMap.values()).map((item) => {
      const codeKey = (item.flowerCode || '').trim().toLowerCase();
      const idKey = (item.flowerId || '').trim().toLowerCase();
      const nameKey = (item.flowerName || '').trim().toLowerCase();

      const importFromOrders =
        (codeKey ? importQtyMap.get(codeKey) : 0) ||
        (idKey ? importQtyMap.get(idKey) : 0) ||
        (nameKey ? importQtyMap.get(nameKey) : 0) ||
        0;
      const totalImport = importFromOrders + (item.importStock || 0);

      const exportFromOrders =
        (codeKey ? exportQtyMap.get(codeKey) : 0) ||
        (idKey ? exportQtyMap.get(idKey) : 0) ||
        (nameKey ? exportQtyMap.get(nameKey) : 0) ||
        0;
      const totalExport = exportFromOrders + (item.exportStock || 0);

      let openingStock = item.openingStock;
      let closingStock = item.currentStock;

      if (openingStock !== undefined && openingStock !== null) {
        closingStock = openingStock + totalImport - totalExport;
      } else {
        openingStock = Math.max(0, closingStock + totalExport - totalImport);
        closingStock = openingStock + totalImport - totalExport;
      }

      return {
        ...item,
        openingStock,
        importStock: totalImport,
        exportStock: totalExport,
        closingStock,
        currentStock: closingStock,
      };
    });
  }, [flowers, inventory, orders, supplierOrders]);

  // Bộ lọc tìm kiếm & trạng thái
  const filteredData = useMemo(() => {
    return inventoryReportData.filter((item) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        (item.flowerName && item.flowerName.toLowerCase().includes(q)) ||
        (item.flowerCode && item.flowerCode.toLowerCase().includes(q));

      let matchStatus = true;
      if (statusFilter === 'in_stock') {
        matchStatus = item.closingStock > 0;
      } else if (statusFilter === 'out_of_stock') {
        matchStatus = item.closingStock <= 0;
      } else if (statusFilter === 'has_activity') {
        matchStatus = item.importStock > 0 || item.exportStock > 0;
      }

      return matchSearch && matchStatus;
    });
  }, [inventoryReportData, searchTerm, statusFilter]);

  // Tổng hợp số liệu toàn bộ dòng hiện tại
  const summaryTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        opening: acc.opening + (item.openingStock || 0),
        import: acc.import + (item.importStock || 0),
        export: acc.export + (item.exportStock || 0),
        closing: acc.closing + (item.closingStock || 0),
      }),
      { opening: 0, import: 0, export: 0, closing: 0 },
    );
  }, [filteredData]);

  // Mở drawer nhập kho
  const handleOpenImport = (item?: InventoryReportRow) => {
    setSelectedItem(item || null);
    setDrawerMode('import');
    setIsDrawerOpen(true);
  };

  // Mở drawer xuất kho
  const handleOpenExport = (item?: InventoryReportRow) => {
    setSelectedItem(item || null);
    setDrawerMode('export');
    setIsDrawerOpen(true);
  };

  // Mở modal điều chỉnh Tồn đầu kỳ
  const handleEditOpeningStock = (item: InventoryReportRow) => {
    setEditingItem(item);
    setEditingOpeningValue(item.openingStock || 0);
  };

  // Lưu điều chỉnh Tồn đầu kỳ
  const handleSaveOpeningStock = () => {
    if (!editingItem) return;
    const newOpening = Number(editingOpeningValue) || 0;
    const newClosing = newOpening + editingItem.importStock - editingItem.exportStock;

    updateInventoryItem(editingItem.flowerId, {
      openingStock: newOpening,
      currentStock: newClosing,
    });
    updateStock(editingItem.flowerId, newClosing);

    toast.success(`Đã cập nhật tồn đầu kỳ cho hoa "${editingItem.flowerName}": ${formatNumber(newOpening)}`);
    setEditingItem(null);
  };

  // Xuất file Excel (.xlsx) với đúng 6 cột: Mã hoa, Tên hoa, Tồn đầu, Nhập, Xuất, Tồn cuối + Dòng tổng cộng
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('Không có dữ liệu tồn kho để xuất Excel');
      return;
    }

    const exportRows = filteredData.map((r, index) => ({
      STT: index + 1,
      'Mã hoa': r.flowerCode,
      'Tên hoa': r.flowerName,
      'Tồn đầu': r.openingStock,
      'Nhập': r.importStock,
      'Xuất': r.exportStock,
      'Tồn cuối': r.closingStock,
    }));

    // Thêm dòng tổng cộng
    exportRows.push({
      STT: 'TỔNG CỘNG',
      'Mã hoa': `${filteredData.length} loại hoa`,
      'Tên hoa': '',
      'Tồn đầu': summaryTotals.opening,
      'Nhập': summaryTotals.import,
      'Xuất': summaryTotals.export,
      'Tồn cuối': summaryTotals.closing,
    } as any);

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ton_Kho');
    XLSX.writeFile(wb, `Bao_Cao_Ton_Kho_${todayISODate()}.xlsx`);
    toast.success('Đã xuất file Excel Báo cáo tồn kho thành công');
  };

  // In PDF báo cáo tồn kho
  const handlePrintPdf = () => {
    if (filteredData.length === 0) {
      toast.error('Không có dữ liệu tồn kho để in');
      return;
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;

    const rowsHtml = filteredData
      .map(
        (r, index) => `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">${r.flowerCode}</td>
          <td style="font-weight: 500;">${r.flowerName}</td>
          <td style="text-align: right; font-weight: 600;">${formatNumber(r.openingStock)}</td>
          <td style="text-align: right; color: #1d4ed8; font-weight: 600;">+${formatNumber(r.importStock)}</td>
          <td style="text-align: right; color: #be123c; font-weight: 600;">-${formatNumber(r.exportStock)}</td>
          <td style="text-align: right; font-weight: bold; font-size: 13px;">${formatNumber(r.closingStock)}</td>
        </tr>`,
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>BÁO CÁO TỒN KHO HOA TƯƠI</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; color: #111827; padding: 15px; margin: 0; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #2563eb; padding-bottom: 12px; }
          .header h1 { margin: 0 0 5px; font-size: 18px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e3a8a; }
          .header .subtitle { font-size: 12px; color: #4b5563; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; padding: 7px 8px; font-size: 11px; text-transform: uppercase; }
          td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .total-row { background: #e5e7eb !important; font-weight: bold; }
          .total-row td { border-top: 2px solid #9ca3af; font-size: 13px; }
          .footer { margin-top: 35px; display: flex; justify-content: space-between; text-align: center; }
          .sign-col { width: 200px; }
          .sign-title { font-weight: bold; margin-bottom: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BÁO CÁO TỒN KHO HOA TƯƠI</h1>
          <div class="subtitle">HOA KHANG THÀNH • Ngày in: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 45px; text-align: center;">STT</th>
              <th style="width: 120px; text-align: left;">Mã hoa</th>
              <th style="text-align: left;">Tên hoa</th>
              <th style="width: 90px; text-align: right;">Tồn đầu</th>
              <th style="width: 90px; text-align: right;">Nhập</th>
              <th style="width: 90px; text-align: right;">Xuất</th>
              <th style="width: 100px; text-align: right;">Tồn cuối</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 12px;">TỔNG CỘNG (${filteredData.length} LOẠI HOA):</td>
              <td style="text-align: right;">${formatNumber(summaryTotals.opening)}</td>
              <td style="text-align: right; color: #1d4ed8;">+${formatNumber(summaryTotals.import)}</td>
              <td style="text-align: right; color: #be123c;">-${formatNumber(summaryTotals.export)}</td>
              <td style="text-align: right; font-weight: bold; color: #1e3a8a;">${formatNumber(summaryTotals.closing)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div class="sign-col">
            <div class="sign-title">Thủ kho</div>
            <div>(Ký & ghi rõ họ tên)</div>
          </div>
          <div class="sign-col">
            <div class="sign-title">Kế toán kho</div>
            <div>(Ký & ghi rõ họ tên)</div>
          </div>
          <div class="sign-col">
            <div class="sign-title">Ban Giám Đốc</div>
            <div>(Ký & ghi rõ họ tên)</div>
          </div>
        </div>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 300);
  };

  // Render các ô trong bảng DataTable - đúng 6 cột duy nhất: Mã hoa, Tên hoa, Tồn đầu, Nhập, Xuất, Tồn cuối
  const renderCell = (columnId: string, row: InventoryReportRow) => {
    switch (columnId) {
      case 'flowerCode':
        return (
          <span className="px-2 py-0.5 rounded text-xs font-mono font-bold border border-border bg-muted/60 text-foreground">
            {row.flowerCode}
          </span>
        );
      case 'flowerName':
        return (
          <div className="text-xs font-semibold text-foreground py-0.5">
            {row.flowerName}
          </div>
        );
      case 'openingStock':
        return (
          <button
            type="button"
            onClick={() => handleEditOpeningStock(row)}
            title="Bấm để điều chỉnh tồn đầu kỳ"
            className="text-xs font-semibold text-foreground tabular-nums hover:text-primary hover:underline px-1 py-0.5 rounded transition-colors text-right w-full"
          >
            {formatNumber(row.openingStock)}
          </button>
        );
      case 'importStock':
        return (
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
            {row.importStock > 0 ? `+${formatNumber(row.importStock)}` : '0'}
          </span>
        );
      case 'exportStock':
        return (
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
            {row.exportStock > 0 ? `-${formatNumber(row.exportStock)}` : '0'}
          </span>
        );
      case 'closingStock': {
        const isOut = row.closingStock <= 0;
        const isLow = row.closingStock <= row.minStock && !isOut;
        return (
          <span
            className={`inline-flex items-center justify-end font-bold text-xs tabular-nums px-2 py-0.5 rounded ${
              isOut
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold'
                : isLow
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            {formatNumber(row.closingStock)}
          </span>
        );
      }
      default:
        return null;
    }
  };

  // Render dòng tổng cộng (Summary Row)
  const renderSummaryRow = (columnId: string, data: InventoryReportRow[]) => {
    switch (columnId) {
      case 'flowerCode':
        return <span className="text-xs font-bold uppercase text-foreground">TỔNG CỘNG:</span>;
      case 'flowerName':
        return <span className="text-xs font-semibold text-muted-foreground">{data.length} loại hoa</span>;
      case 'openingStock':
        return <span className="text-xs font-bold text-foreground tabular-nums">{formatNumber(summaryTotals.opening)}</span>;
      case 'importStock':
        return <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">+{formatNumber(summaryTotals.import)}</span>;
      case 'exportStock':
        return <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">-{formatNumber(summaryTotals.export)}</span>;
      case 'closingStock':
        return <span className="text-xs font-extrabold text-foreground tabular-nums">{formatNumber(summaryTotals.closing)}</span>;
      default:
        return null;
    }
  };

  // Render thẻ hiển thị trên Mobile
  const renderMobileCard = (row: InventoryReportRow) => (
    <div className="p-3.5 rounded-xl border border-border bg-card space-y-2.5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-muted/60 border border-border text-foreground">
          {row.flowerCode}
        </span>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${
            row.closingStock <= 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          Tồn cuối: {formatNumber(row.closingStock)}
        </span>
      </div>
      <div className="text-sm font-semibold text-foreground">{row.flowerName}</div>
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50 text-xs">
        <div>
          <div className="text-muted-foreground text-[11px]">Tồn đầu</div>
          <div className="font-semibold text-foreground tabular-nums">{formatNumber(row.openingStock)}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-[11px]">Nhập</div>
          <div className="font-semibold text-blue-600 tabular-nums">+{formatNumber(row.importStock)}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-[11px]">Xuất</div>
          <div className="font-semibold text-rose-600 tabular-nums">-{formatNumber(row.exportStock)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">
      {/* Thanh tab điều hướng */}
      <div className="px-3 sm:px-4 pt-3 pb-1 shrink-0 bg-background">
        <Tabs<Tab>
          tabs={[
            { id: 'danhsach', label: 'Báo cáo tồn kho', icon: Boxes },
            { id: 'thongke', label: 'Biểu đồ thống kê', icon: ChartColumn },
            { id: 'lichsu', label: 'Lịch sử thao tác', icon: History },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'lichsu' ? (
        <ModuleHistory module="ton-kho" />
      ) : activeTab === 'danhsach' ? (
        <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 space-y-3">
          {/* Thanh thẻ tổng quan số liệu KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Tổng loại hoa</div>
                <div className="text-lg font-bold text-foreground mt-0.5">{filteredData.length} loại</div>
              </div>
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Boxes size={18} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Tổng tồn đầu</div>
                <div className="text-lg font-bold text-foreground mt-0.5">{formatNumber(summaryTotals.opening)}</div>
              </div>
              <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                <RotateCcw size={18} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Tổng nhập / xuất</div>
                <div className="text-xs font-semibold mt-0.5 flex items-center gap-1.5">
                  <span className="text-blue-600 font-bold">+{formatNumber(summaryTotals.import)}</span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-rose-600 font-bold">-{formatNumber(summaryTotals.export)}</span>
                </div>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60">
                <TrendingUp size={18} />
              </div>
            </div>

            <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Tổng tồn cuối</div>
                <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {formatNumber(summaryTotals.closing)}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                <TrendingDown size={18} />
              </div>
            </div>
          </div>

          {/* Thanh công cụ: Tìm kiếm, lọc nhanh & các nút hành động */}
          <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex flex-wrap items-center justify-between gap-2.5 shrink-0">
            {/* Tìm kiếm */}
            <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
              <div className="relative w-full">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm theo mã hoa, tên hoa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
                />
              </div>
            </div>

            {/* Bộ lọc nhanh trạng thái */}
            <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  statusFilter === 'all'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tất cả ({inventoryReportData.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('in_stock')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  statusFilter === 'in_stock'
                    ? 'bg-background text-emerald-600 shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Còn hàng
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('out_of_stock')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  statusFilter === 'out_of_stock'
                    ? 'bg-background text-rose-600 shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Hết hàng
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('has_activity')}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                  statusFilter === 'has_activity'
                    ? 'bg-background text-blue-600 shadow-sm font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Có phát sinh
              </button>
            </div>

            {/* Các nút hành động: Nhập kho, Xuất kho, Xuất Excel, In PDF */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Link to="/ton-ngay">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs text-cyan-700 dark:text-cyan-400 border-cyan-300 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100"
                >
                  <ClipboardCheck size={13} />
                  <span>Kiểm tồn ngày</span>
                </Button>
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrintPdf}
                className="h-8 gap-1.5 text-xs text-foreground border-border hover:bg-muted"
              >
                <Printer size={13} />
                <span>In PDF</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                className="h-8 gap-1.5 text-xs text-foreground border-border hover:bg-muted"
              >
                <Download size={13} />
                <span>Xuất Excel</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenExport()}
                className="h-8 gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <span>- Xuất kho</span>
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenImport()}
                className="h-8 gap-1 text-xs font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                <Plus size={14} className="stroke-[2.5px]" />
                <span>+ Nhập kho</span>
              </Button>
            </div>
          </div>

          {/* Bảng dữ liệu tồn kho - CHỈ 6 CỘT DUY NHẤT: Mã hoa, Tên hoa, Tồn đầu, Nhập, Xuất, Tồn cuối */}
          <div className="flex-1 min-h-0 bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            <DataTable<InventoryReportRow>
              data={filteredData}
              columns={columns}
              showIndex={true}
              hideActions={true}
              selectedIds={new Set()}
              onToggleSelection={() => {}}
              onToggleAll={() => {}}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onResizeColumn={(id, width) => handleUpdateColumn(id, { width })}
              renderCell={renderCell}
              renderSummaryRow={renderSummaryRow}
              renderMobileCard={renderMobileCard}
              keyExtractor={(r) => r.flowerId || r.flowerCode}
              emptyTitle="Chưa có dữ liệu tồn kho"
              emptyDescription="Không tìm thấy mặt hàng hoa nào phù hợp với bộ lọc."
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <TonKhoStats />
        </div>
      )}

      {/* Drawer Nhập / Xuất kho */}
      {isDrawerOpen && (
        <TonKhoDrawer
          isOpen
          onClose={() => setIsDrawerOpen(false)}
          inventoryItem={selectedItem}
          defaultType={drawerMode}
        />
      )}

      {/* Modal điều chỉnh Tồn đầu kỳ */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Điều chỉnh Tồn đầu kỳ</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingItem.flowerCode} • {editingItem.flowerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Số lượng Tồn đầu kỳ ({editingItem.unit || 'cành/bó'}):
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingOpeningValue}
                  onChange={(e) => setEditingOpeningValue(Number(e.target.value) || 0)}
                  className="w-full h-9 px-3 text-sm font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
              </div>

              <div className="p-2.5 rounded-lg bg-muted/60 space-y-1 text-muted-foreground">
                <div className="flex justify-between">
                  <span>+ Nhập trong kỳ:</span>
                  <span className="font-semibold text-blue-600">+{formatNumber(editingItem.importStock)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Xuất trong kỳ:</span>
                  <span className="font-semibold text-rose-600">-{formatNumber(editingItem.exportStock)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/60 text-foreground font-bold">
                  <span>= Tồn cuối mới dự kiến:</span>
                  <span className="text-emerald-600">
                    {formatNumber(editingOpeningValue + editingItem.importStock - editingItem.exportStock)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingItem(null)}>
                Hủy
              </Button>
              <Button type="button" size="sm" onClick={handleSaveOpeningStock} className="bg-primary text-primary-foreground font-semibold">
                Lưu tồn đầu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
