import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Info,
  Package,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import {
  useFlowerStore,
  useOrderStore,
  useSupplierOrderStore,
} from '@/stores/hoaKhangThanhStore';
import {
  useDailyStockReconcileStore,
  getPreviousClosingStock,
  type DailyStockItem,
} from '@/stores/dailyStockReconcileStore';
import { todayISODate, formatDate } from '@/lib/format';

interface DisplayRow extends DailyStockItem {
  differenceWithNCC: number; // Thực nhập NCC - Nhập tính ra
}

export default function TonNgayPage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayISODate());
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddFlowerModalOpen, setIsAddFlowerModalOpen] = useState(false);
  const [customFlowerId, setCustomFlowerId] = useState('');

  // Modal điều chỉnh Tồn đầu thủ công (nếu ngày đầu tiên chưa có tồn cuối hôm trước)
  const [editingOpeningItem, setEditingOpeningItem] = useState<DisplayRow | null>(null);
  const [editingOpeningVal, setEditingOpeningVal] = useState<number>(0);

  const { flowers } = useFlowerStore();
  const { orders } = useOrderStore();
  const { orders: supplierOrders } = useSupplierOrderStore();
  const { records, setClosingStock, setOpeningStock } =
    useDailyStockReconcileStore();

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  // 1. Xuất ngày: Tính tổng số lượng bán từ các Đơn hàng trong ngày được chọn
  const dailyExportMap = useMemo(() => {
    const map = new Map<string, number>();
    orders
      .filter((o) => o.orderDate === selectedDate && o.status !== 'huy')
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 0;
          const codeKey = (item.flowerCode || '').trim().toLowerCase();
          const idKey = (item.flowerId || '').trim().toLowerCase();
          const nameKey = (item.flowerName || '').trim().toLowerCase();

          if (codeKey) map.set(codeKey, (map.get(codeKey) || 0) + qty);
          if (idKey && idKey !== codeKey) map.set(idKey, (map.get(idKey) || 0) + qty);
          if (nameKey && nameKey !== codeKey) map.set(nameKey, (map.get(nameKey) || 0) + qty);
        });
      });
    return map;
  }, [orders, selectedDate]);

  // Thực nhập NCC trong ngày: Tính từ Đơn nhập NCC của ngày được chọn
  const supplierImportMap = useMemo(() => {
    const map = new Map<string, number>();
    supplierOrders
      .filter((o) => o.orderDate === selectedDate && o.status !== 'huy')
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 0;
          const codeKey = (item.flowerCode || '').trim().toLowerCase();
          const idKey = (item.flowerId || '').trim().toLowerCase();
          const nameKey = (item.flowerName || '').trim().toLowerCase();

          if (codeKey) map.set(codeKey, (map.get(codeKey) || 0) + qty);
          if (idKey && idKey !== codeKey) map.set(idKey, (map.get(idKey) || 0) + qty);
          if (nameKey && nameKey !== codeKey) map.set(nameKey, (map.get(nameKey) || 0) + qty);
        });
      });
    return map;
  }, [supplierOrders, selectedDate]);

  // 2. Tính toán bảng dữ liệu Tồn Ngày theo công thức người dùng yêu cầu:
  // - Tồn đầu: Tồn cuối của ngày hôm trước
  // - Xuất ngày: Lấy ở đơn hàng theo ngày
  // - Tồn cuối: Người dùng nhập vào
  // - Nhập: Tồn cuối + Xuất ngày - Tồn đầu
  const displayRows = useMemo<DisplayRow[]>(() => {
    const savedDayItems = records[selectedDate] || [];
    const savedMap = new Map(savedDayItems.map((it) => [it.flowerId, it]));

    // Xác định danh sách các loại hoa phát sinh hoặc cần kiểm tồn
    const activeFlowerKeys = new Set<string>();

    flowers.forEach((fl) => {
      const codeKey = (fl.code || '').trim().toLowerCase();
      const idKey = (fl.id || '').trim().toLowerCase();
      const nameKey = (fl.name || '').trim().toLowerCase();

      const hasExport =
        (dailyExportMap.get(codeKey) || 0) > 0 ||
        (dailyExportMap.get(idKey) || 0) > 0 ||
        (dailyExportMap.get(nameKey) || 0) > 0;

      const hasNCCImport =
        (supplierImportMap.get(codeKey) || 0) > 0 ||
        (supplierImportMap.get(idKey) || 0) > 0 ||
        (supplierImportMap.get(nameKey) || 0) > 0;

      const hasSaved = savedMap.has(fl.id) || (codeKey && savedDayItems.some((s) => s.flowerCode?.toLowerCase() === codeKey));

      // Kiểm tra xem hôm trước có tồn cuối > 0 không
      const prevClosing = getPreviousClosingStock(records, selectedDate, fl.id);
      const hasPrevClosing = prevClosing !== undefined && prevClosing > 0;

      if (hasExport || hasNCCImport || hasSaved || hasPrevClosing) {
        activeFlowerKeys.add(fl.id);
      }
    });

    // Nếu ngày hôm nay chưa có đơn nào, hiển thị danh mục hoa ban đầu
    const targetFlowers =
      activeFlowerKeys.size > 0
        ? flowers.filter((f) => activeFlowerKeys.has(f.id))
        : flowers.slice(0, 25);

    return targetFlowers.map((fl) => {
      const codeKey = (fl.code || '').trim().toLowerCase();
      const idKey = (fl.id || '').trim().toLowerCase();
      const nameKey = (fl.name || '').trim().toLowerCase();

      // Xuất ngày từ đơn hàng
      const exportQty =
        (codeKey ? dailyExportMap.get(codeKey) : 0) ||
        (idKey ? dailyExportMap.get(idKey) : 0) ||
        (nameKey ? dailyExportMap.get(nameKey) : 0) ||
        0;

      // Thực nhập từ NCC
      const nccImport =
        (codeKey ? supplierImportMap.get(codeKey) : 0) ||
        (idKey ? supplierImportMap.get(idKey) : 0) ||
        (nameKey ? supplierImportMap.get(nameKey) : 0) ||
        0;

      const saved = savedMap.get(fl.id);

      // Tồn đầu: Ưu tiên tồn cuối hôm trước, nếu người dùng đã tự sửa thì dùng số đã sửa
      let openingStock = 0;
      if (saved && saved.isOpeningCustom) {
        openingStock = saved.openingStock;
      } else {
        const prevClosing = getPreviousClosingStock(records, selectedDate, fl.id);
        openingStock = prevClosing ?? saved?.openingStock ?? 0;
      }

      // Tồn cuối: Số lượng người dùng nhập vào
      const closingStock = saved ? (saved.closingStock ?? 0) : 0;

      // Nhập (Tìm ra nhập): Nhập = Tồn cuối + Xuất ngày - Tồn đầu
      const calculatedImport = Math.max(0, closingStock + exportQty - openingStock);

      // Chênh lệch so với NCC (nếu có đơn nhập)
      const differenceWithNCC = nccImport > 0 ? nccImport - calculatedImport : 0;

      return {
        id: `${selectedDate}_${fl.id}`,
        date: selectedDate,
        flowerId: fl.id,
        flowerCode: fl.code,
        flowerName: fl.name,
        unit: fl.unit || 'cành',
        openingStock,
        dailyExport: exportQty,
        closingStock,
        calculatedImport,
        actualImportFromNCC: nccImport,
        differenceWithNCC,
        notes: saved?.notes || '',
      };
    });
  }, [flowers, dailyExportMap, supplierImportMap, records, selectedDate]);

  // Bộ lọc tìm kiếm
  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return displayRows;
    return displayRows.filter(
      (r) =>
        r.flowerCode.toLowerCase().includes(q) ||
        r.flowerName.toLowerCase().includes(q),
    );
  }, [displayRows, searchTerm]);

  // Tổng hợp số liệu chân bảng & KPI
  const summary = useMemo(() => {
    let sumOpening = 0;
    let sumExport = 0;
    let sumClosing = 0;
    let sumCalculatedImport = 0;
    let sumActualNCC = 0;

    filteredRows.forEach((r) => {
      sumOpening += r.openingStock;
      sumExport += r.dailyExport;
      sumClosing += r.closingStock;
      sumCalculatedImport += r.calculatedImport;
      sumActualNCC += r.actualImportFromNCC;
    });

    return {
      count: filteredRows.length,
      opening: sumOpening,
      export: sumExport,
      closing: sumClosing,
      calculatedImport: sumCalculatedImport,
      actualNCC: sumActualNCC,
      diffNCC: sumActualNCC - sumCalculatedImport,
    };
  }, [filteredRows]);

  // Người dùng nhập Tồn cuối
  const handleClosingStockChange = (item: DisplayRow, value: number) => {
    const val = Math.max(0, value || 0);
    setClosingStock(selectedDate, item.flowerId, val, {
      flowerCode: item.flowerCode,
      flowerName: item.flowerName,
      unit: item.unit,
      dailyExport: item.dailyExport,
      openingStock: item.openingStock,
      actualImportFromNCC: item.actualImportFromNCC,
    });
  };

  // Điều chỉnh tồn đầu thủ công
  const handleOpenEditOpening = (item: DisplayRow) => {
    setEditingOpeningItem(item);
    setEditingOpeningVal(item.openingStock);
  };

  const handleSaveOpeningStock = () => {
    if (!editingOpeningItem) return;
    setOpeningStock(selectedDate, editingOpeningItem.flowerId, editingOpeningVal);
    toast.success(`Đã cập nhật tồn đầu cho hoa "${editingOpeningItem.flowerName}": ${formatNumber(editingOpeningVal)}`);
    setEditingOpeningItem(null);
  };

  // Đổi ngày tới / lùi
  const handleShiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Thêm hoa ngoài danh mục vào kiểm tồn
  const handleAddCustomFlower = () => {
    if (!customFlowerId) return;
    const fl = flowers.find((f) => f.id === customFlowerId);
    if (!fl) return;

    setClosingStock(selectedDate, fl.id, 0, {
      flowerCode: fl.code,
      flowerName: fl.name,
      unit: fl.unit || 'cành',
      dailyExport: 0,
      openingStock: 0,
      actualImportFromNCC: 0,
    });

    toast.success(`Đã thêm hoa "${fl.name}" vào bảng tồn ngày ${formatDate(selectedDate)}`);
    setIsAddFlowerModalOpen(false);
    setCustomFlowerId('');
  };

  // Xuất file Excel (.xlsx) bảng Tồn ngày
  const handleExportExcel = () => {
    if (filteredRows.length === 0) {
      toast.error('Không có dữ liệu để xuất Excel');
      return;
    }

    const exportData = filteredRows.map((r, idx) => ({
      STT: idx + 1,
      'Mã hoa': r.flowerCode,
      'Tên hoa': r.flowerName,
      'ĐVT': r.unit,
      'Tồn đầu (Hôm trước)': r.openingStock,
      'Xuất ngày (Đơn hàng)': r.dailyExport,
      'Tồn cuối (Kiểm đếm)': r.closingStock,
      'Nhập (Tính ra)': r.calculatedImport,
      'Thực nhập NCC': r.actualImportFromNCC > 0 ? r.actualImportFromNCC : '',
      'Đối soát với NCC':
        r.actualImportFromNCC === 0
          ? ''
          : r.differenceWithNCC === 0
            ? 'Khớp 100%'
            : r.differenceWithNCC > 0
              ? `Thừa nhập +${r.differenceWithNCC}`
              : `Thiếu nhập ${r.differenceWithNCC}`,
      'Ghi chú': r.notes || '',
    }));

    exportData.push({
      STT: 'TỔNG CỘNG',
      'Mã hoa': `${filteredRows.length} loại hoa`,
      'Tên hoa': '',
      'ĐVT': '',
      'Tồn đầu (Hôm trước)': summary.opening,
      'Xuất ngày (Đơn hàng)': summary.export,
      'Tồn cuối (Kiểm đếm)': summary.closing,
      'Nhập (Tính ra)': summary.calculatedImport,
      'Thực nhập NCC': summary.actualNCC > 0 ? summary.actualNCC : '',
      'Đối soát với NCC':
        summary.actualNCC === 0
          ? ''
          : summary.diffNCC === 0
            ? 'Khớp hoàn toàn'
            : summary.diffNCC > 0
              ? `Tổng thừa +${summary.diffNCC}`
              : `Tổng thiếu ${summary.diffNCC}`,
      'Ghi chú': '',
    } as any);

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ton_Ngay');
    XLSX.writeFile(wb, `Bang_Ton_Ngay_${selectedDate}.xlsx`);
    toast.success('Đã xuất file Excel bảng tồn ngày thành công');
  };

  // In phiếu kiểm tồn ngày (PDF)
  const handlePrintPdf = () => {
    if (filteredRows.length === 0) {
      toast.error('Không có dữ liệu để in');
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

    const rowsHtml = filteredRows
      .map(
        (r, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">${r.flowerCode}</td>
          <td style="font-weight: 500;">${r.flowerName}</td>
          <td style="text-align: right; color: #4b5563;">${formatNumber(r.openingStock)}</td>
          <td style="text-align: right; color: #be123c; font-weight: 600;">${formatNumber(r.dailyExport)}</td>
          <td style="text-align: right; font-weight: bold; background: #fefce8;">${formatNumber(r.closingStock)}</td>
          <td style="text-align: right; font-weight: bold; color: #1d4ed8; font-size: 13px;">${formatNumber(r.calculatedImport)}</td>
        </tr>`,
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>BÁO CÁO TỒN NGÀY VÀ TÍNH SỐ LƯỢNG NHẬP</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; padding: 15px; margin: 0; font-size: 12px; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0284c7; padding-bottom: 10px; }
          .header h1 { margin: 0 0 5px; font-size: 18px; text-transform: uppercase; color: #0369a1; }
          .header .subtitle { font-size: 12px; color: #4b5563; }
          .formula { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 8px 12px; border-radius: 6px; font-size: 11px; margin-bottom: 12px; color: #166534; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f3f4f6; color: #1f2937; border: 1px solid #d1d5db; padding: 7px 6px; font-size: 11px; text-transform: uppercase; }
          td { border: 1px solid #e5e7eb; padding: 6px 7px; font-size: 12px; }
          tr:nth-child(even) { background-color: #fafafa; }
          .total-row { background: #e2e8f0 !important; font-weight: bold; }
          .total-row td { border-top: 2px solid #64748b; font-size: 13px; }
          .footer { margin-top: 35px; display: flex; justify-content: space-between; text-align: center; }
          .sign-col { width: 180px; }
          .sign-title { font-weight: bold; margin-bottom: 45px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BÁO CÁO TỒN NGÀY & TÍNH SỐ LƯỢNG NHẬP</h1>
          <div class="subtitle">HOA KHANG THÀNH • Ngày kiểm tra: <strong>${formatDate(selectedDate)}</strong></div>
        </div>

        <div class="formula">
          <strong>Công thức tính:</strong> Nhập = Tồn cuối (kiểm đếm) + Xuất ngày (đơn hàng) - Tồn đầu (tồn cuối hôm trước).
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">STT</th>
              <th style="width: 110px; text-align: left;">Mã hoa</th>
              <th style="text-align: left;">Tên hoa</th>
              <th style="width: 100px; text-align: right;">Tồn đầu<br><small style="text-transform: none; color: #6b7280;">(Tồn cuối hôm trước)</small></th>
              <th style="width: 100px; text-align: right;">Xuất ngày<br><small style="text-transform: none; color: #6b7280;">(Đơn hàng)</small></th>
              <th style="width: 100px; text-align: right;">Tồn cuối<br><small style="text-transform: none; color: #6b7280;">(Kiểm đếm)</small></th>
              <th style="width: 110px; text-align: right;">Nhập<br><small style="text-transform: none; color: #1d4ed8;">(Tìm ra nhập)</small></th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 10px;">TỔNG CỘNG (${filteredRows.length} LOẠI HOA):</td>
              <td style="text-align: right;">${formatNumber(summary.opening)}</td>
              <td style="text-align: right; color: #be123c;">${formatNumber(summary.export)}</td>
              <td style="text-align: right;">${formatNumber(summary.closing)}</td>
              <td style="text-align: right; color: #1d4ed8; font-weight: bold;">${formatNumber(summary.calculatedImport)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div class="sign-col">
            <div class="sign-title">Người kiểm tồn</div>
            <div>(Ký & ghi rõ họ tên)</div>
          </div>
          <div class="sign-col">
            <div class="sign-title">Thủ kho</div>
            <div>(Ký & ghi rõ họ tên)</div>
          </div>
          <div class="sign-col">
            <div class="sign-title">Kế toán / Chủ shop</div>
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

  return (
    <div className="flex flex-col h-full min-h-0 bg-background p-3 sm:p-4 space-y-3">
      {/* Thanh tiêu đề & chọn ngày kiểm tồn */}
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">
              Báo Cáo Tồn Ngày & Tính Số Lượng Nhập
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tồn đầu lấy từ Tồn cuối hôm trước • Xuất ngày lấy từ Đơn hàng • Nhập số Tồn cuối để tìm ra số lượng Nhập
            </p>
          </div>
        </div>

        {/* Bộ chọn ngày kiểm tồn */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShiftDay(-1)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Lùi 1 ngày"
          >
            <ChevronLeft size={16} />
          </Button>

          <Button
            size="sm"
            variant={selectedDate === todayISODate() ? 'default' : 'ghost'}
            onClick={() => setSelectedDate(todayISODate())}
            className="h-8 text-xs font-semibold px-2.5"
          >
            Hôm nay
          </Button>

          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background border border-border shadow-xs text-xs font-semibold">
            <Calendar size={13} className="text-cyan-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
            />
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleShiftDay(1)}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Tới 1 ngày"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Thẻ thống kê KPI tổng quan */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 shrink-0">
        {/* Tổng loại hoa */}
        <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Mặt hàng kiểm tra</div>
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {filteredRows.length} loại
            </div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Package size={18} />
          </div>
        </div>

        {/* Tổng Tồn đầu */}
        <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Tồn đầu (Hôm trước)</div>
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {formatNumber(summary.opening)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <RotateCcw size={18} />
          </div>
        </div>

        {/* Tổng Xuất ngày */}
        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-800 dark:text-rose-300 font-medium">Xuất ngày (Đơn bán)</div>
            <div className="text-lg font-extrabold text-rose-700 dark:text-rose-300 mt-0.5 tabular-nums">
              {formatNumber(summary.export)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <ShoppingCart size={18} />
          </div>
        </div>

        {/* Tổng Tồn cuối */}
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">Tồn cuối (Đã đếm)</div>
            <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 tabular-nums">
              {formatNumber(summary.closing)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <ClipboardCheck size={18} />
          </div>
        </div>

        {/* Tổng Nhập tìm ra */}
        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-800 dark:text-blue-300 font-semibold">Nhập (Tìm ra)</div>
            <div className="text-lg font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 tabular-nums">
              {formatNumber(summary.calculatedImport)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* Dòng hướng dẫn công thức */}
      <div className="px-3.5 py-2 rounded-lg bg-cyan-50/60 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 flex items-center justify-between text-xs text-cyan-900 dark:text-cyan-200 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-cyan-600 shrink-0" />
          <span>
            <strong>Quy tắc tính toán:</strong> Nhập = Tồn cuối + Xuất ngày - Tồn đầu.
            (Tồn đầu hôm nay tự động nhận từ Tồn cuối hôm qua).
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Bấm vào ô <strong>Tồn cuối</strong> để nhập số lượng hoa kiểm đếm thực tế
        </div>
      </div>

      {/* Thanh công cụ: Tìm kiếm & Nút thao tác */}
      <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
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

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddFlowerModalOpen(true)}
            className="h-8 gap-1 text-xs text-foreground border-border hover:bg-muted"
          >
            <Plus size={13} />
            <span>+ Thêm hoa</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handlePrintPdf}
            className="h-8 gap-1 text-xs text-foreground border-border hover:bg-muted"
          >
            <Printer size={13} />
            <span>In PDF</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportExcel}
            className="h-8 gap-1 text-xs text-foreground border-border hover:bg-muted"
          >
            <Download size={13} />
            <span>Xuất Excel</span>
          </Button>
        </div>
      </div>

      {/* Bảng dữ liệu: Mã hoa, Tên hoa, Tồn đầu, Xuất ngày, Tồn cuối, Nhập */}
      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-muted border-b border-border text-foreground/80 font-semibold select-none">
              <tr>
                <th className="px-3 py-2.5 text-center border-b border-r border-border w-12 bg-muted">STT</th>
                <th className="px-3 py-2.5 border-b border-r border-border w-28 bg-muted">Mã hoa</th>
                <th className="px-3 py-2.5 border-b border-r border-border min-w-[200px] bg-muted">Tên hoa</th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-32 bg-muted">
                  Tồn đầu
                  <div className="text-[10px] font-normal text-muted-foreground">(Tồn cuối hôm trước)</div>
                </th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-32 text-rose-700 dark:text-rose-400 bg-muted">
                  Xuất ngày
                  <div className="text-[10px] font-normal text-muted-foreground">(Từ đơn hàng)</div>
                </th>
                <th className="px-3 py-2.5 text-center border-b border-r border-border w-36 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
                  Tồn cuối
                  <div className="text-[10px] font-normal text-amber-700 dark:text-amber-300">(Tôi nhập vào ô này)</div>
                </th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-32 text-blue-700 dark:text-blue-400 bg-muted font-bold">
                  Nhập
                  <div className="text-[10px] font-normal text-blue-600 dark:text-blue-400">(Tìm ra nhập)</div>
                </th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-28 bg-muted">
                  Thực nhập NCC
                </th>
                <th className="px-3 py-2.5 text-center border-b border-border w-36 bg-muted">
                  Đối soát NCC
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-muted-foreground bg-card">
                    Không có mặt hàng hoa nào phát sinh trong ngày {formatDate(selectedDate)}
                  </td>
                </tr>
              ) : (
                filteredRows.map((item, index) => {
                  const hasNCC = item.actualImportFromNCC > 0;
                  const isNCCMatched = item.differenceWithNCC === 0;
                  const isNCCShortage = item.differenceWithNCC < 0;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/40 transition-colors [&>td]:border-b [&>td]:border-border"
                    >
                      {/* STT */}
                      <td className="px-3 py-2 text-center text-muted-foreground tabular-nums border-r border-border/60">
                        {index + 1}
                      </td>

                      {/* Mã hoa */}
                      <td className="px-3 py-2 border-r border-border/60">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground">
                          {item.flowerCode}
                        </span>
                      </td>

                      {/* Tên hoa */}
                      <td className="px-3 py-2 font-medium text-foreground border-r border-border/60">
                        <div>{item.flowerName}</div>
                      </td>

                      {/* Tồn đầu (Tồn cuối hôm trước) */}
                      <td className="px-3 py-2 text-right tabular-nums border-r border-border/60">
                        <button
                          type="button"
                          onClick={() => handleOpenEditOpening(item)}
                          title="Bấm để chỉnh sửa nếu chưa có tồn cuối hôm trước"
                          className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                        >
                          {formatNumber(item.openingStock)}
                        </button>
                      </td>

                      {/* Xuất ngày (Từ đơn hàng) */}
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400 border-r border-border/60">
                        {item.dailyExport > 0 ? `-${formatNumber(item.dailyExport)}` : '0'}
                      </td>

                      {/* Tồn cuối (Tôi nhập tồn cuối) - Ô nhập liệu trực tiếp */}
                      <td className="px-2 py-1.5 border-r border-border/60 bg-amber-50/30 dark:bg-amber-950/20 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleClosingStockChange(item, item.closingStock - 5)}
                            className="w-5 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-xs flex items-center justify-center font-bold"
                            title="-5"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.closingStock === 0 ? '' : item.closingStock}
                            placeholder="0"
                            onChange={(e) =>
                              handleClosingStockChange(item, Number(e.target.value) || 0)
                            }
                            className="w-20 h-7 text-center font-bold text-xs rounded border border-amber-300 dark:border-amber-700 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                          />
                          <button
                            type="button"
                            onClick={() => handleClosingStockChange(item, item.closingStock + 5)}
                            className="w-5 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-xs flex items-center justify-center font-bold"
                            title="+5"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Nhập (Tìm ra nhập = Tồn cuối + Xuất ngày - Tồn đầu) */}
                      <td className="px-3 py-2 text-right tabular-nums font-extrabold text-blue-600 dark:text-blue-400 border-r border-border/60 bg-blue-50/20 dark:bg-blue-950/10">
                        {formatNumber(item.calculatedImport)}
                      </td>

                      {/* Thực nhập NCC */}
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground border-r border-border/60">
                        {hasNCC ? formatNumber(item.actualImportFromNCC) : <span className="text-muted-foreground">—</span>}
                      </td>

                      {/* Đối soát với NCC */}
                      <td className="px-3 py-2 text-center">
                        {!hasNCC ? (
                          <span className="text-muted-foreground text-[11px]">Chưa nhập NCC</span>
                        ) : isNCCMatched ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                            <CheckCircle2 size={12} /> Khớp đơn
                          </span>
                        ) : isNCCShortage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                            <TrendingDown size={12} /> Thiếu {formatNumber(Math.abs(item.differenceWithNCC))}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                            <TrendingUp size={12} /> Thừa +{formatNumber(item.differenceWithNCC)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Dòng TỔNG CỘNG */}
            {filteredRows.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-muted/95 border-t-2 border-border shadow-xs font-bold text-xs">
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-right uppercase border-r border-border">
                    TỔNG CỘNG ({filteredRows.length} LOẠI HOA):
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground border-r border-border font-bold">
                    {formatNumber(summary.opening)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-rose-700 dark:text-rose-400 border-r border-border font-bold">
                    {formatNumber(summary.export)}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-amber-800 dark:text-amber-200 border-r border-border font-extrabold bg-amber-100/60 dark:bg-amber-950/60">
                    {formatNumber(summary.closing)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-700 dark:text-blue-300 border-r border-border font-extrabold bg-blue-50/40 dark:bg-blue-950/30">
                    {formatNumber(summary.calculatedImport)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground border-r border-border font-bold">
                    {summary.actualNCC > 0 ? formatNumber(summary.actualNCC) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center text-muted-foreground text-[11px] font-normal">
                    {summary.actualNCC > 0 ? (
                      summary.diffNCC === 0 ? (
                        <span className="text-emerald-600 font-bold">✔ Khớp hoàn toàn</span>
                      ) : summary.diffNCC > 0 ? (
                        <span className="text-blue-600 font-bold">Thừa +{formatNumber(summary.diffNCC)}</span>
                      ) : (
                        <span className="text-rose-600 font-bold">Thiếu {formatNumber(Math.abs(summary.diffNCC))}</span>
                      )
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Modal điều chỉnh Tồn đầu thủ công */}
      {editingOpeningItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Điều chỉnh Tồn đầu ngày</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editingOpeningItem.flowerCode} • {editingOpeningItem.flowerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOpeningItem(null)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Số lượng Tồn đầu ({editingOpeningItem.unit}):
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingOpeningVal}
                  onChange={(e) => setEditingOpeningVal(Number(e.target.value) || 0)}
                  className="w-full h-9 px-3 text-sm font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  (Thông thường hệ thống tự động lấy từ Tồn cuối hôm trước. Bạn chỉ chỉnh khi ngày đầu tiên chưa có số liệu).
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditingOpeningItem(null)}>
                Hủy
              </Button>
              <Button type="button" size="sm" onClick={handleSaveOpeningStock} className="bg-primary text-primary-foreground font-semibold">
                Lưu tồn đầu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm hoa vào bảng kiểm tồn */}
      {isAddFlowerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-foreground">Thêm hoa vào bảng kiểm tồn ngày</h3>
              <button
                type="button"
                onClick={() => setIsAddFlowerModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  Chọn mặt hàng hoa tươi:
                </label>
                <select
                  value={customFlowerId}
                  onChange={(e) => setCustomFlowerId(e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Chọn hoa từ danh mục --</option>
                  {flowers.map((fl) => (
                    <option key={fl.id} value={fl.id}>
                      {fl.code} - {fl.name} ({fl.unit || 'cành'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddFlowerModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!customFlowerId}
                onClick={handleAddCustomFlower}
                className="bg-primary text-primary-foreground font-semibold"
              >
                Thêm vào bảng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
