import { useMemo, useState } from 'react';
import {
  AlertTriangle,
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
  Truck,
  Wand2,
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
  computeReconcileStatus,
  type DailyReconcileItem,
} from '@/stores/dailyStockReconcileStore';
import { todayISODate, formatDate } from '@/lib/format';

type FilterStatus = 'all' | 'matched' | 'mismatched' | 'shortage' | 'excess';

export default function TonNgayPage() {
  const [selectedDate, setSelectedDate] = useState<string>(todayISODate());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isAddFlowerModalOpen, setIsAddFlowerModalOpen] = useState(false);
  const [customFlowerId, setCustomFlowerId] = useState('');

  const { flowers } = useFlowerStore();
  const { orders } = useOrderStore();
  const { orders: supplierOrders } = useSupplierOrderStore();
  const { records, setRemainingQuantity, setNotes, saveDailyItems } =
    useDailyStockReconcileStore();

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  // Tính số lượng khách đặt trong ngày được chọn từ tất cả Đơn hàng
  const dayOrdersMap = useMemo(() => {
    const map = new Map<string, { qty: number; orderCount: number }>();
    orders
      .filter((o) => o.orderDate === selectedDate && o.status !== 'huy')
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 0;
          const codeKey = (item.flowerCode || '').trim().toLowerCase();
          const idKey = (item.flowerId || '').trim().toLowerCase();
          const nameKey = (item.flowerName || '').trim().toLowerCase();

          [codeKey, idKey, nameKey].forEach((key) => {
            if (key) {
              const prev = map.get(key) || { qty: 0, orderCount: 0 };
              map.set(key, { qty: prev.qty + qty, orderCount: prev.orderCount + 1 });
            }
          });
        });
      });
    return map;
  }, [orders, selectedDate]);

  // Tính số lượng thực tế nhập từ NCC trong ngày được chọn từ Đơn nhập NCC
  const daySupplierImportsMap = useMemo(() => {
    const map = new Map<string, { qty: number; poCount: number }>();
    supplierOrders
      .filter((o) => o.orderDate === selectedDate && o.status !== 'huy')
      .forEach((o) => {
        (o.items || []).forEach((item) => {
          const qty = Number(item.quantity) || 0;
          const codeKey = (item.flowerCode || '').trim().toLowerCase();
          const idKey = (item.flowerId || '').trim().toLowerCase();
          const nameKey = (item.flowerName || '').trim().toLowerCase();

          [codeKey, idKey, nameKey].forEach((key) => {
            if (key) {
              const prev = map.get(key) || { qty: 0, poCount: 0 };
              map.set(key, { qty: prev.qty + qty, poCount: prev.poCount + 1 });
            }
          });
        });
      });
    return map;
  }, [supplierOrders, selectedDate]);

  // Hợp nhất dữ liệu kiểm tồn ngày:
  // Bao gồm tất cả hoa phát sinh đơn hàng, đơn nhập trong ngày, hoặc đã được lưu trước đó
  const reconcileItems = useMemo<DailyReconcileItem[]>(() => {
    const savedDayItems = records[selectedDate] || [];
    const savedMap = new Map(savedDayItems.map((it) => [it.flowerId, it]));

    // Tạo danh sách hoa có phát sinh trong ngày
    const activeFlowerKeys = new Set<string>();

    flowers.forEach((fl) => {
      const codeKey = (fl.code || '').trim().toLowerCase();
      const idKey = (fl.id || '').trim().toLowerCase();
      const nameKey = (fl.name || '').trim().toLowerCase();

      const hasOrder = (dayOrdersMap.get(codeKey)?.qty || 0) > 0 || (dayOrdersMap.get(idKey)?.qty || 0) > 0 || (dayOrdersMap.get(nameKey)?.qty || 0) > 0;
      const hasImport = (daySupplierImportsMap.get(codeKey)?.qty || 0) > 0 || (daySupplierImportsMap.get(idKey)?.qty || 0) > 0 || (daySupplierImportsMap.get(nameKey)?.qty || 0) > 0;
      const hasSaved = savedMap.has(fl.id) || (codeKey && savedDayItems.some((s) => s.flowerCode?.toLowerCase() === codeKey));

      if (hasOrder || hasImport || hasSaved) {
        activeFlowerKeys.add(fl.id);
      }
    });

    // Nếu ngày hôm nay chưa có đơn nào, hiển thị danh mục hoa để người dùng kiểm đếm
    const baseFlowers =
      activeFlowerKeys.size > 0
        ? flowers.filter((f) => activeFlowerKeys.has(f.id))
        : flowers.slice(0, 30);

    return baseFlowers.map((fl) => {
      const codeKey = (fl.code || '').trim().toLowerCase();
      const idKey = (fl.id || '').trim().toLowerCase();
      const nameKey = (fl.name || '').trim().toLowerCase();

      const orderQty =
        (codeKey ? dayOrdersMap.get(codeKey)?.qty : 0) ||
        (idKey ? dayOrdersMap.get(idKey)?.qty : 0) ||
        (nameKey ? dayOrdersMap.get(nameKey)?.qty : 0) ||
        0;

      const importQty =
        (codeKey ? daySupplierImportsMap.get(codeKey)?.qty : 0) ||
        (idKey ? daySupplierImportsMap.get(idKey)?.qty : 0) ||
        (nameKey ? daySupplierImportsMap.get(nameKey)?.qty : 0) ||
        0;

      const saved = savedMap.get(fl.id);
      const remainingQty = saved ? saved.remainingQuantity : 0;
      const openingStock = saved ? (saved.openingStock || 0) : 0;

      const { difference, status } = computeReconcileStatus(openingStock, importQty, orderQty, remainingQty);

      return {
        id: `${selectedDate}_${fl.id}`,
        date: selectedDate,
        flowerId: fl.id,
        flowerCode: fl.code,
        flowerName: fl.name,
        unit: fl.unit || 'cành',
        openingStock,
        orderQuantity: orderQty,
        importQuantity: importQty,
        remainingQuantity: remainingQty,
        difference,
        status,
        notes: saved?.notes || '',
      };
    });
  }, [flowers, dayOrdersMap, daySupplierImportsMap, records, selectedDate]);

  // Bộ lọc tìm kiếm & trạng thái
  const filteredItems = useMemo(() => {
    return reconcileItems.filter((it) => {
      const q = searchTerm.trim().toLowerCase();
      const matchSearch =
        !q ||
        it.flowerCode.toLowerCase().includes(q) ||
        it.flowerName.toLowerCase().includes(q);

      let matchFilter = true;
      if (filterStatus === 'matched') {
        matchFilter = it.status === 'matched';
      } else if (filterStatus === 'mismatched') {
        matchFilter = it.status !== 'matched';
      } else if (filterStatus === 'shortage') {
        matchFilter = it.status === 'shortage';
      } else if (filterStatus === 'excess') {
        matchFilter = it.status === 'excess';
      }

      return matchSearch && matchFilter;
    });
  }, [reconcileItems, searchTerm, filterStatus]);

  // Thống kê tổng số lượng toàn ngày
  const summary = useMemo(() => {
    let totalOrders = 0;
    let totalImports = 0;
    let totalRemaining = 0;
    let totalRequired = 0;
    let matchedCount = 0;
    let shortageCount = 0;
    let excessCount = 0;

    filteredItems.forEach((it) => {
      totalOrders += it.orderQuantity;
      totalImports += it.importQuantity;
      totalRemaining += it.remainingQuantity;
      totalRequired += it.orderQuantity + it.remainingQuantity - it.openingStock;

      if (it.status === 'matched') matchedCount++;
      else if (it.status === 'shortage') shortageCount++;
      else if (it.status === 'excess') excessCount++;
    });

    const netDifference = totalImports - totalRequired;

    return {
      totalItems: filteredItems.length,
      totalOrders,
      totalImports,
      totalRemaining,
      totalRequired,
      netDifference,
      matchedCount,
      shortageCount,
      excessCount,
    };
  }, [filteredItems]);

  // Thay đổi số lượng hoa còn lại (kiểm đếm)
  const handleRemainingChange = (item: DailyReconcileItem, newQty: number) => {
    const qty = Math.max(0, newQty || 0);
    setRemainingQuantity(selectedDate, item.flowerId, qty, {
      flowerCode: item.flowerCode,
      flowerName: item.flowerName,
      unit: item.unit,
      orderQuantity: item.orderQuantity,
      importQuantity: item.importQuantity,
      openingStock: item.openingStock,
    });
  };

  // Tự động điền giá trị hoa còn lại theo lý thuyết = max(0, Nhập - Đơn)
  const handleAutoFillTheoretical = () => {
    const updated = reconcileItems.map((it) => {
      const theoretical = Math.max(0, it.openingStock + it.importQuantity - it.orderQuantity);
      const { difference, status } = computeReconcileStatus(it.openingStock, it.importQuantity, it.orderQuantity, theoretical);
      return {
        ...it,
        remainingQuantity: theoretical,
        difference,
        status,
      };
    });
    saveDailyItems(selectedDate, updated);
    toast.success('Đã tự động tính và điền số lượng hoa còn lại theo công thức lý thuyết');
  };

  // Đặt lại toàn bộ hoa còn lại về 0 để bắt đầu kiểm đếm
  const handleResetToZero = () => {
    const updated = reconcileItems.map((it) => {
      const { difference, status } = computeReconcileStatus(it.openingStock, it.importQuantity, it.orderQuantity, 0);
      return {
        ...it,
        remainingQuantity: 0,
        difference,
        status,
      };
    });
    saveDailyItems(selectedDate, updated);
    toast.success('Đã đặt lại số lượng hoa còn lại về 0');
  };

  // Đổi ngày tới / lùi 1 ngày
  const handleShiftDay = (delta: number) => {
    const curr = new Date(selectedDate);
    curr.setDate(curr.getDate() + delta);
    setSelectedDate(curr.toISOString().split('T')[0]);
  };

  // Thêm một hoa ngoài danh sách vào bảng kiểm tồn ngày
  const handleAddCustomFlower = () => {
    if (!customFlowerId) return;
    const fl = flowers.find((f) => f.id === customFlowerId);
    if (!fl) return;

    setRemainingQuantity(selectedDate, fl.id, 0, {
      flowerCode: fl.code,
      flowerName: fl.name,
      unit: fl.unit || 'cành',
      orderQuantity: 0,
      importQuantity: 0,
      openingStock: 0,
    });

    toast.success(`Đã thêm hoa "${fl.name}" vào bảng kiểm tồn ngày ${formatDate(selectedDate)}`);
    setIsAddFlowerModalOpen(false);
    setCustomFlowerId('');
  };

  // Xuất file Excel (.xlsx) bảng đối soát tồn ngày
  const handleExportExcel = () => {
    if (filteredItems.length === 0) {
      toast.error('Không có dữ liệu đối soát để xuất Excel');
      return;
    }

    const exportRows = filteredItems.map((it, idx) => ({
      STT: idx + 1,
      'Mã hoa': it.flowerCode,
      'Tên hoa': it.flowerName,
      'ĐVT': it.unit,
      'Đơn khách đặt (A)': it.orderQuantity,
      'Thực nhập NCC (B)': it.importQuantity,
      'Hoa còn lại kiểm đếm (C)': it.remainingQuantity,
      'Cần nhập theo đơn (A + C)': it.orderQuantity + it.remainingQuantity,
      'Chênh lệch [B - (A + C)]': it.difference,
      'Kết quả đối soát':
        it.status === 'matched'
          ? 'Khớp đơn hàng (100%)'
          : it.status === 'excess'
            ? `Thừa nhập (+${it.difference})`
            : `Thiếu nhập (${it.difference})`,
      'Ghi chú': it.notes || '',
    }));

    exportRows.push({
      STT: 'TỔNG CỘNG',
      'Mã hoa': `${filteredItems.length} loại hoa`,
      'Tên hoa': '',
      'ĐVT': '',
      'Đơn khách đặt (A)': summary.totalOrders,
      'Thực nhập NCC (B)': summary.totalImports,
      'Hoa còn lại kiểm đếm (C)': summary.totalRemaining,
      'Cần nhập theo đơn (A + C)': summary.totalRequired,
      'Chênh lệch [B - (A + C)]': summary.netDifference,
      'Kết quả đối soát':
        summary.netDifference === 0
          ? 'Tổng thể khớp đơn'
          : summary.netDifference > 0
            ? `Tổng thừa +${summary.netDifference}`
            : `Tổng thiếu ${summary.netDifference}`,
      'Ghi chú': '',
    } as any);

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Doi_Soat_Ton_Ngay');
    XLSX.writeFile(wb, `Bang_Doi_Soat_Ton_Ngay_${selectedDate}.xlsx`);
    toast.success('Đã xuất file Excel bảng đối soát tồn ngày thành công');
  };

  // In phiếu đối soát tồn ngày (PDF)
  const handlePrintPdf = () => {
    if (filteredItems.length === 0) {
      toast.error('Không có dữ liệu đối soát để in');
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

    const rowsHtml = filteredItems
      .map((it, idx) => {
        const isMatched = it.status === 'matched';
        const isShortage = it.status === 'shortage';
        const statusLabel = isMatched
          ? '<span style="color: #15803d; font-weight: bold;">✔ Khớp đơn</span>'
          : isShortage
            ? `<span style="color: #b91c1c; font-weight: bold;">✖ Thiếu nhập (${it.difference})</span>`
            : `<span style="color: #1d4ed8; font-weight: bold;">▲ Thừa nhập (+${it.difference})</span>`;

        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td style="font-family: monospace; font-weight: bold;">${it.flowerCode}</td>
            <td style="font-weight: 500;">${it.flowerName}</td>
            <td style="text-align: right; font-weight: 600;">${formatNumber(it.orderQuantity)}</td>
            <td style="text-align: right; color: #1d4ed8; font-weight: 600;">${formatNumber(it.importQuantity)}</td>
            <td style="text-align: right; font-weight: bold; background: #fefce8;">${formatNumber(it.remainingQuantity)}</td>
            <td style="text-align: right; font-weight: bold; color: ${it.difference === 0 ? '#15803d' : it.difference < 0 ? '#b91c1c' : '#1d4ed8'};">
              ${it.difference > 0 ? `+${formatNumber(it.difference)}` : formatNumber(it.difference)}
            </td>
            <td style="text-align: center;">${statusLabel}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>PHIẾU ĐỐI SOÁT TỒN NGÀY VÀ ĐƠN HÀNG</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; padding: 15px; margin: 0; font-size: 12px; }
          .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #0284c7; padding-bottom: 10px; }
          .header h1 { margin: 0 0 5px; font-size: 18px; text-transform: uppercase; color: #0369a1; }
          .header .subtitle { font-size: 12px; color: #4b5563; }
          .meta-box { display: flex; justify-content: space-between; margin-bottom: 15px; background: #f0f9ff; padding: 10px 14px; border-radius: 6px; border: 1px solid #bae6fd; font-size: 12px; }
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
          <h1>PHIẾU ĐỐI SOÁT TỒN NGÀY & ĐƠN HÀNG</h1>
          <div class="subtitle">HOA KHANG THÀNH • Ngày kiểm tồn: <strong>${formatDate(selectedDate)}</strong></div>
        </div>

        <div class="meta-box">
          <div><strong>Tổng đơn khách đặt:</strong> ${formatNumber(summary.totalOrders)} cành/bó</div>
          <div><strong>Tổng thực nhập NCC:</strong> ${formatNumber(summary.totalImports)} cành/bó</div>
          <div><strong>Tổng hoa còn lại:</strong> ${formatNumber(summary.totalRemaining)} cành/bó</div>
          <div><strong>Chênh lệch toàn ngày:</strong> <span style="font-weight: bold; color: ${summary.netDifference === 0 ? '#15803d' : summary.netDifference < 0 ? '#b91c1c' : '#1d4ed8'};">${summary.netDifference > 0 ? `+${formatNumber(summary.netDifference)}` : formatNumber(summary.netDifference)}</span></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">STT</th>
              <th style="width: 100px; text-align: left;">Mã hoa</th>
              <th style="text-align: left;">Tên hoa</th>
              <th style="width: 85px; text-align: right;">Khách đặt (A)</th>
              <th style="width: 85px; text-align: right;">Thực nhập (B)</th>
              <th style="width: 90px; text-align: right;">Còn lại (C)</th>
              <th style="width: 85px; text-align: right;">Lệch [B-(A+C)]</th>
              <th style="width: 110px; text-align: center;">Đối soát</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="total-row">
              <td colspan="3" style="text-align: right; padding-right: 10px;">TỔNG CỘNG (${filteredItems.length} LOẠI HOA):</td>
              <td style="text-align: right;">${formatNumber(summary.totalOrders)}</td>
              <td style="text-align: right; color: #1d4ed8;">${formatNumber(summary.totalImports)}</td>
              <td style="text-align: right;">${formatNumber(summary.totalRemaining)}</td>
              <td style="text-align: right; color: ${summary.netDifference === 0 ? '#15803d' : summary.netDifference < 0 ? '#b91c1c' : '#1d4ed8'};">
                ${summary.netDifference > 0 ? `+${formatNumber(summary.netDifference)}` : formatNumber(summary.netDifference)}
              </td>
              <td style="text-align: center; font-size: 11px;">
                ${summary.netDifference === 0 ? '✔ Khớp hoàn toàn' : summary.netDifference < 0 ? '✖ Thiếu nhập' : '▲ Thừa nhập'}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div class="sign-col">
            <div class="sign-title">Người kiểm tồn</div>
            <div>(Ký & ghi rõ họ tên)</div>
          </div>
          <div class="sign-col">
            <div class="sign-title">Thủ kho soạn đơn</div>
            <div>(Ký & ghi rõ họ tên)</div>
          </div>
          <div class="sign-col">
            <div class="sign-title">Chủ shop / Kế toán</div>
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
              Kiểm Tồn Ngày & Đối Soát Đơn Hàng
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Nhập số lượng hoa còn lại để hệ thống tự động kiểm tra số lượng thực nhập từ NCC có khớp với đơn hàng khách đặt hay không
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
        {/* Khách đặt */}
        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-800 dark:text-blue-300 font-medium flex items-center gap-1">
              <ShoppingCart size={13} /> Đơn khách đặt (A)
            </div>
            <div className="text-lg font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 tabular-nums">
              {formatNumber(summary.totalOrders)}
            </div>
          </div>
        </div>

        {/* Thực nhập NCC */}
        <div className="p-3 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-indigo-800 dark:text-indigo-300 font-medium flex items-center gap-1">
              <Truck size={13} /> Thực nhập NCC (B)
            </div>
            <div className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300 mt-0.5 tabular-nums">
              {formatNumber(summary.totalImports)}
            </div>
          </div>
        </div>

        {/* Hoa còn lại kiểm đếm */}
        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-center gap-1">
              <Package size={13} /> Hoa còn lại (C)
            </div>
            <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 tabular-nums">
              {formatNumber(summary.totalRemaining)}
            </div>
          </div>
        </div>

        {/* Cần nhập theo đơn */}
        <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <ClipboardCheck size={13} /> Cần nhập (A + C)
            </div>
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {formatNumber(summary.totalRequired)}
            </div>
          </div>
        </div>

        {/* Kết quả đối soát tổng */}
        <div
          className={`p-3 rounded-xl border shadow-sm flex items-center justify-between ${
            summary.netDifference === 0
              ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20'
              : summary.netDifference < 0
                ? 'border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/20'
                : 'border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/20'
          }`}
        >
          <div>
            <div
              className={`text-xs font-semibold ${
                summary.netDifference === 0
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : summary.netDifference < 0
                    ? 'text-rose-800 dark:text-rose-300'
                    : 'text-blue-800 dark:text-blue-300'
              }`}
            >
              {summary.netDifference === 0
                ? '✔ Khớp đơn 100%'
                : summary.netDifference < 0
                  ? '❌ Thiếu nhập'
                  : '▲ Thừa nhập'}
            </div>
            <div
              className={`text-lg font-extrabold mt-0.5 tabular-nums ${
                summary.netDifference === 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : summary.netDifference < 0
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-blue-700 dark:text-blue-300'
              }`}
            >
              {summary.netDifference > 0 ? `+${formatNumber(summary.netDifference)}` : formatNumber(summary.netDifference)}
            </div>
          </div>
          <div className="text-right text-[11px] text-muted-foreground space-y-0.5">
            <span className="text-emerald-600 font-bold">{summary.matchedCount} khớp</span> •{' '}
            <span className="text-rose-600 font-bold">{summary.shortageCount} thiếu</span> •{' '}
            <span className="text-blue-600 font-bold">{summary.excessCount} thừa</span>
          </div>
        </div>
      </div>

      {/* Hướng dẫn công thức ngắn gọn */}
      <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border/80 flex items-center justify-between text-xs text-muted-foreground shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5">
          <Info size={14} className="text-cyan-600 shrink-0" />
          <span>
            <strong>Công thức kiểm tra:</strong> Chênh lệch = Thực nhập NCC (B) - [Đơn khách đặt (A) + Hoa còn lại (C)].
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
            <CheckCircle2 size={12} /> Bằng 0: Nhập đúng theo đơn hàng
          </span>
          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
            <TrendingUp size={12} /> Dương (+): Thừa nhập / Dư hoa
          </span>
          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
            <TrendingDown size={12} /> Âm (-): Nhập thiếu so với đơn
          </span>
        </div>
      </div>

      {/* Thanh công cụ: Tìm kiếm, lọc trạng thái & các nút thao tác */}
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

        {/* Nút lọc trạng thái */}
        <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/60 text-xs">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterStatus === 'all'
                ? 'bg-background text-foreground shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tất cả ({reconcileItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('matched')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterStatus === 'matched'
                ? 'bg-background text-emerald-600 shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Khớp đơn
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('mismatched')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterStatus === 'mismatched'
                ? 'bg-background text-amber-600 shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Có lệch
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('shortage')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterStatus === 'shortage'
                ? 'bg-background text-rose-600 shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Thiếu nhập
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('excess')}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              filterStatus === 'excess'
                ? 'bg-background text-blue-600 shadow-xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Thừa nhập
          </button>
        </div>

        {/* Nút thao tác nhanh */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoFillTheoretical}
            className="h-8 gap-1 text-xs text-foreground border-border hover:bg-muted"
            title="Tự động tính hoa còn lại = max(0, Nhập - Đơn)"
          >
            <Wand2 size={13} className="text-cyan-600" />
            <span>Điền theo lý thuyết</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleResetToZero}
            className="h-8 gap-1 text-xs text-muted-foreground border-border hover:bg-muted"
            title="Đặt lại toàn bộ hoa còn lại về 0 để kiểm đếm lại từ đầu"
          >
            <RotateCcw size={13} />
            <span>Về 0</span>
          </Button>

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
            <span>In phiếu</span>
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

      {/* Bảng đối soát tồn ngày */}
      <div className="flex-1 min-h-0 bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-xs text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-muted border-b border-border text-foreground/80 font-semibold select-none">
              <tr>
                <th className="px-3 py-2.5 text-center border-b border-r border-border w-12 bg-muted">STT</th>
                <th className="px-3 py-2.5 border-b border-r border-border w-28 bg-muted">Mã hoa</th>
                <th className="px-3 py-2.5 border-b border-r border-border min-w-[180px] bg-muted">Tên hoa</th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-28 text-blue-700 dark:text-blue-400 bg-muted">
                  Khách đặt (A)
                </th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-28 text-indigo-700 dark:text-indigo-400 bg-muted">
                  Thực nhập (B)
                </th>
                <th className="px-3 py-2.5 text-center border-b border-r border-border w-36 bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
                  Hoa còn lại (C)
                </th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-28 bg-muted">
                  Cần nhập (A+C)
                </th>
                <th className="px-3 py-2.5 text-right border-b border-r border-border w-28 bg-muted">
                  Lệch [B-(A+C)]
                </th>
                <th className="px-3 py-2.5 text-center border-b border-r border-border w-36 bg-muted">
                  Kết quả đối soát
                </th>
                <th className="px-3 py-2.5 border-b border-border min-w-[140px] bg-muted">Ghi chú đối soát</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-muted-foreground bg-card">
                    Không có mặt hàng hoa nào phù hợp trong ngày {formatDate(selectedDate)}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => {
                  const isMatched = item.status === 'matched';
                  const isShortage = item.status === 'shortage';
                  const requiredQty = item.orderQuantity + item.remainingQuantity - item.openingStock;

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

                      {/* Đơn khách đặt (A) */}
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-blue-600 dark:text-blue-400 border-r border-border/60">
                        {formatNumber(item.orderQuantity)}
                      </td>

                      {/* Thực nhập NCC (B) */}
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-indigo-600 dark:text-indigo-400 border-r border-border/60">
                        {formatNumber(item.importQuantity)}
                      </td>

                      {/* Hoa còn lại (C) - Ô INPUT trực tiếp để người dùng nhập kiểm đếm */}
                      <td className="px-2 py-1.5 border-r border-border/60 bg-amber-50/30 dark:bg-amber-950/20 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemainingChange(item, item.remainingQuantity - 5)}
                            className="w-5 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-xs flex items-center justify-center font-bold"
                            title="-5 cành"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="0"
                            value={item.remainingQuantity === 0 ? '' : item.remainingQuantity}
                            placeholder="0"
                            onChange={(e) =>
                              handleRemainingChange(item, Number(e.target.value) || 0)
                            }
                            className="w-20 h-7 text-center font-bold text-xs rounded border border-amber-300 dark:border-amber-700 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemainingChange(item, item.remainingQuantity + 5)}
                            className="w-5 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-xs flex items-center justify-center font-bold"
                            title="+5 cành"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Cần nhập theo đơn (A + C) */}
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground border-r border-border/60">
                        {formatNumber(requiredQty)}
                      </td>

                      {/* Lệch [B - (A + C)] */}
                      <td className="px-3 py-2 text-right tabular-nums font-bold border-r border-border/60">
                        <span
                          className={
                            isMatched
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : isShortage
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-blue-600 dark:text-blue-400'
                          }
                        >
                          {item.difference > 0 ? `+${formatNumber(item.difference)}` : formatNumber(item.difference)}
                        </span>
                      </td>

                      {/* Kết quả đối soát */}
                      <td className="px-3 py-2 text-center border-r border-border/60">
                        {isMatched ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                            <CheckCircle2 size={12} /> Khớp đơn
                          </span>
                        ) : isShortage ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                            <AlertTriangle size={12} /> Thiếu {formatNumber(Math.abs(item.difference))}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                            <TrendingUp size={12} /> Thừa +{formatNumber(item.difference)}
                          </span>
                        )}
                      </td>

                      {/* Ghi chú đối soát */}
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          placeholder="Ghi chú đối soát..."
                          value={item.notes || ''}
                          onChange={(e) => setNotes(selectedDate, item.flowerId, e.target.value)}
                          className="w-full h-7 px-2 text-xs rounded border border-transparent hover:border-border focus:border-primary bg-transparent focus:bg-background focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Dòng TỔNG CỘNG ở chân bảng */}
            {filteredItems.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-muted/95 border-t-2 border-border shadow-xs font-bold text-xs">
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-right uppercase border-r border-border">
                    TỔNG CỘNG ({filteredItems.length} LOẠI HOA):
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-blue-700 dark:text-blue-300 border-r border-border font-extrabold">
                    {formatNumber(summary.totalOrders)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-indigo-700 dark:text-indigo-300 border-r border-border font-extrabold">
                    {formatNumber(summary.totalImports)}
                  </td>
                  <td className="px-3 py-2.5 text-center tabular-nums text-amber-800 dark:text-amber-200 border-r border-border font-extrabold bg-amber-100/60 dark:bg-amber-950/60">
                    {formatNumber(summary.totalRemaining)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-foreground border-r border-border font-extrabold">
                    {formatNumber(summary.totalRequired)}
                  </td>
                  <td
                    className={`px-3 py-2.5 text-right tabular-nums border-r border-border font-extrabold ${
                      summary.netDifference === 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : summary.netDifference < 0
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-blue-700 dark:text-blue-300'
                    }`}
                  >
                    {summary.netDifference > 0 ? `+${formatNumber(summary.netDifference)}` : formatNumber(summary.netDifference)}
                  </td>
                  <td className="px-3 py-2.5 text-center border-r border-border">
                    {summary.netDifference === 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">✔ Khớp 100%</span>
                    ) : summary.netDifference < 0 ? (
                      <span className="text-rose-700 dark:text-rose-300 font-extrabold">Thiếu {formatNumber(Math.abs(summary.netDifference))}</span>
                    ) : (
                      <span className="text-blue-700 dark:text-blue-300 font-extrabold">Thừa +{formatNumber(summary.netDifference)}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground text-[11px] font-normal">
                    {summary.matchedCount}/{filteredItems.length} loại hoa khớp đơn
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

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
