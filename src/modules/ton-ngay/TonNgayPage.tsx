import { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
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
  normalizeDateToYMD,
  formatYMDToDisplay,
  getPreviousClosingStock,
  type DailyStockItem,
} from '@/stores/dailyStockReconcileStore';
import { todayISODate } from '@/lib/format';

interface DateGroupData {
  dateYMD: string;
  displayDate: string;
  isToday: boolean;
  rows: DailyStockItem[];
  subtotal: {
    flowerCount: number;
    opening: number;
    export: number;
    closing: number;
    calculatedImport: number;
    actualNCC: number;
    diffNCC: number;
  };
}

export default function TonNgayPage() {
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all'); // 'all' hoặc YYYY-MM-DD
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  // Modal thêm hoa vào một ngày cụ thể
  const [targetDateForAdd, setTargetDateForAdd] = useState<string | null>(null);
  const [customFlowerId, setCustomFlowerId] = useState('');

  // Modal điều chỉnh Tồn đầu thủ công
  const [editingOpeningItem, setEditingOpeningItem] = useState<{ dateYMD: string; item: DailyStockItem } | null>(null);
  const [editingOpeningVal, setEditingOpeningVal] = useState<number>(0);

  const { flowers } = useFlowerStore();
  const { orders } = useOrderStore();
  const { orders: supplierOrders } = useSupplierOrderStore();
  const { records, setClosingStock, setOpeningStock, addFlowerToDate } =
    useDailyStockReconcileStore();

  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const todayYMD = todayISODate();

  // 1. Thu thập tất cả các ngày có đơn hàng, đơn nhập hoặc đã lưu kiểm tồn
  const availableDates = useMemo<string[]>(() => {
    const dateSet = new Set<string>();

    orders.forEach((o) => {
      if (o.status !== 'huy') {
        const ymd = normalizeDateToYMD(o.orderDate);
        if (ymd) dateSet.add(ymd);
      }
    });

    supplierOrders.forEach((so) => {
      if (so.status !== 'huy') {
        const ymd = normalizeDateToYMD(so.orderDate);
        if (ymd) dateSet.add(ymd);
      }
    });

    Object.keys(records).forEach((rDate) => {
      const ymd = normalizeDateToYMD(rDate);
      if (ymd) dateSet.add(ymd);
    });

    // Luôn có ngày hôm nay
    dateSet.add(todayYMD);

    // Sắp xếp ngày mới nhất lên đầu
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [orders, supplierOrders, records, todayYMD]);

  // 2. Gom nhóm dữ liệu theo từng ngày ("nhóm theo ngày")
  const dateGroups = useMemo<DateGroupData[]>(() => {
    // Sắp xếp ngày theo thứ tự thời gian tăng dần để tính tồn đầu luân chuyển chuẩn xác
    const sortedDatesAsc = [...availableDates].sort((a, b) => a.localeCompare(b));

    // Bộ nhớ đệm Tồn cuối ngày trước để gán cho Tồn đầu ngày hôm sau
    const runningLastClosingMap = new Map<string, number>();

    const groupsAsc: DateGroupData[] = sortedDatesAsc.map((dateYMD) => {
      const displayDate = formatYMDToDisplay(dateYMD);
      const isToday = dateYMD === todayYMD;

      // Đơn hàng bán trong ngày này
      const dayOrderQtyMap = new Map<string, number>();
      orders
        .filter((o) => o.status !== 'huy' && normalizeDateToYMD(o.orderDate) === dateYMD)
        .forEach((o) => {
          (o.items || []).forEach((it) => {
            const qty = Number(it.quantity) || 0;
            const codeKey = (it.flowerCode || '').trim().toLowerCase();
            const idKey = (it.flowerId || '').trim().toLowerCase();
            const nameKey = (it.flowerName || '').trim().toLowerCase();
            if (codeKey) dayOrderQtyMap.set(codeKey, (dayOrderQtyMap.get(codeKey) || 0) + qty);
            if (idKey && idKey !== codeKey) dayOrderQtyMap.set(idKey, (dayOrderQtyMap.get(idKey) || 0) + qty);
            if (nameKey && nameKey !== codeKey) dayOrderQtyMap.set(nameKey, (dayOrderQtyMap.get(nameKey) || 0) + qty);
          });
        });

      // Đơn nhập NCC trong ngày này
      const dayNCCImportMap = new Map<string, number>();
      supplierOrders
        .filter((so) => so.status !== 'huy' && normalizeDateToYMD(so.orderDate) === dateYMD)
        .forEach((so) => {
          (so.items || []).forEach((it) => {
            const qty = Number(it.quantity) || 0;
            const codeKey = (it.flowerCode || '').trim().toLowerCase();
            const idKey = (it.flowerId || '').trim().toLowerCase();
            const nameKey = (it.flowerName || '').trim().toLowerCase();
            if (codeKey) dayNCCImportMap.set(codeKey, (dayNCCImportMap.get(codeKey) || 0) + qty);
            if (idKey && idKey !== codeKey) dayNCCImportMap.set(idKey, (dayNCCImportMap.get(idKey) || 0) + qty);
            if (nameKey && nameKey !== codeKey) dayNCCImportMap.set(nameKey, (dayNCCImportMap.get(nameKey) || 0) + qty);
          });
        });

      // Dữ liệu đã lưu trong store cho ngày này
      const savedItems = records[dateYMD] || [];
      const savedMap = new Map(savedItems.map((s) => [s.flowerId, s]));

      // Thu thập các mặt hàng hoa thực tế có phát sinh trong ngày này:
      // (Có đơn khách đặt, có nhập NCC, có tồn cuối hôm trước > 0, hoặc đã lưu kiểm tồn)
      const dayFlowerKeys = new Set<string>();

      flowers.forEach((fl) => {
        const codeKey = (fl.code || '').trim().toLowerCase();
        const idKey = (fl.id || '').trim().toLowerCase();
        const nameKey = (fl.name || '').trim().toLowerCase();

        const hasExport =
          (dayOrderQtyMap.get(codeKey) || 0) > 0 ||
          (dayOrderQtyMap.get(idKey) || 0) > 0 ||
          (dayOrderQtyMap.get(nameKey) || 0) > 0;

        const hasNCC =
          (dayNCCImportMap.get(codeKey) || 0) > 0 ||
          (dayNCCImportMap.get(idKey) || 0) > 0 ||
          (dayNCCImportMap.get(nameKey) || 0) > 0;

        const hasSaved = savedMap.has(fl.id) || (codeKey && savedItems.some((s) => s.flowerCode?.toLowerCase() === codeKey));

        // Kiểm tra xem hoa này có tồn cuối ngày trước chuyển sang không
        const prevClosing = runningLastClosingMap.get(fl.id) ?? getPreviousClosingStock(records, dateYMD, fl.id);
        const hasPrevStock = prevClosing !== undefined && prevClosing > 0;

        if (hasExport || hasNCC || hasSaved || hasPrevStock) {
          dayFlowerKeys.add(fl.id);
        }
      });

      // Nếu ngày hôm nay chưa có đơn nào, hiển thị danh mục hoa ban đầu
      const targetFlowers =
        dayFlowerKeys.size > 0
          ? flowers.filter((f) => dayFlowerKeys.has(f.id))
          : isToday
            ? flowers.slice(0, 10)
            : [];

      // Tạo các dòng hoa cho ngày này
      const rows: DailyStockItem[] = targetFlowers.map((fl) => {
        const codeKey = (fl.code || '').trim().toLowerCase();
        const idKey = (fl.id || '').trim().toLowerCase();
        const nameKey = (fl.name || '').trim().toLowerCase();

        // 1. Xuất ngày: Lấy ở đơn hàng theo ngày
        const dailyExport =
          (codeKey ? dayOrderQtyMap.get(codeKey) : 0) ||
          (idKey ? dayOrderQtyMap.get(idKey) : 0) ||
          (nameKey ? dayOrderQtyMap.get(nameKey) : 0) ||
          0;

        // 2. Thực nhập NCC trong ngày
        const actualImportFromNCC =
          (codeKey ? dayNCCImportMap.get(codeKey) : 0) ||
          (idKey ? dayNCCImportMap.get(idKey) : 0) ||
          (nameKey ? dayNCCImportMap.get(nameKey) : 0) ||
          0;

        const saved = savedMap.get(fl.id);

        // 3. Tồn đầu: "tồn đầu hôm nay là tồn cuối hôm trước"
        let openingStock = 0;
        if (saved && saved.isOpeningCustom) {
          openingStock = saved.openingStock;
        } else {
          openingStock = runningLastClosingMap.get(fl.id) ?? getPreviousClosingStock(records, dateYMD, fl.id) ?? saved?.openingStock ?? 0;
        }

        // 4. Tồn cuối: "tôi nhập tồn cuối"
        const closingStock = saved ? (saved.closingStock ?? 0) : 0;

        // Cập nhật lại bộ nhớ đệm cho ngày kế tiếp
        if (saved && saved.closingStock !== undefined) {
          runningLastClosingMap.set(fl.id, saved.closingStock);
        }

        // 5. Nhập: "để tìm ra nhập = Tồn cuối + Xuất ngày - Tồn đầu"
        const calculatedImport = Math.max(0, closingStock + dailyExport - openingStock);

        return {
          id: `${dateYMD}_${fl.id}`,
          date: dateYMD,
          flowerId: fl.id,
          flowerCode: fl.code,
          flowerName: fl.name,
          unit: fl.unit || 'cành',
          openingStock,
          dailyExport,
          closingStock,
          calculatedImport,
          actualImportFromNCC,
          notes: saved?.notes || '',
        };
      });

      // Tính tổng cộng cho nhóm ngày
      let subOpening = 0;
      let subExport = 0;
      let subClosing = 0;
      let subCalcImport = 0;
      let subActualNCC = 0;

      rows.forEach((r) => {
        subOpening += r.openingStock;
        subExport += r.dailyExport;
        subClosing += r.closingStock;
        subCalcImport += r.calculatedImport;
        subActualNCC += r.actualImportFromNCC;
      });

      return {
        dateYMD,
        displayDate,
        isToday,
        rows,
        subtotal: {
          flowerCount: rows.length,
          opening: subOpening,
          export: subExport,
          closing: subClosing,
          calculatedImport: subCalcImport,
          actualNCC: subActualNCC,
          diffNCC: subActualNCC - subCalcImport,
        },
      };
    });

    // Trả về danh sách ngày sắp xếp theo ngày mới nhất lên đầu để người dùng dễ xem
    return groupsAsc.reverse();
  }, [availableDates, orders, supplierOrders, records, flowers, todayYMD]);

  // Lọc theo ngày được chọn hoặc tìm kiếm
  const filteredDateGroups = useMemo(() => {
    return dateGroups
      .filter((group) => {
        if (selectedDateFilter !== 'all' && group.dateYMD !== selectedDateFilter) {
          return false;
        }
        return true;
      })
      .map((group) => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return group;

        const matchedRows = group.rows.filter(
          (r) =>
            r.flowerCode.toLowerCase().includes(q) ||
            r.flowerName.toLowerCase().includes(q),
        );

        let subOpening = 0;
        let subExport = 0;
        let subClosing = 0;
        let subCalcImport = 0;
        let subActualNCC = 0;

        matchedRows.forEach((r) => {
          subOpening += r.openingStock;
          subExport += r.dailyExport;
          subClosing += r.closingStock;
          subCalcImport += r.calculatedImport;
          subActualNCC += r.actualImportFromNCC;
        });

        return {
          ...group,
          rows: matchedRows,
          subtotal: {
            flowerCount: matchedRows.length,
            opening: subOpening,
            export: subExport,
            closing: subClosing,
            calculatedImport: subCalcImport,
            actualNCC: subActualNCC,
            diffNCC: subActualNCC - subCalcImport,
          },
        };
      })
      .filter((group) => group.rows.length > 0 || group.isToday || selectedDateFilter !== 'all');
  }, [dateGroups, selectedDateFilter, searchTerm]);

  // Thống kê toàn bộ các nhóm đang hiển thị
  const grandTotal = useMemo(() => {
    let count = 0;
    let opening = 0;
    let exportQty = 0;
    let closing = 0;
    let calcImport = 0;
    let actualNCC = 0;

    filteredDateGroups.forEach((g) => {
      count += g.subtotal.flowerCount;
      opening += g.subtotal.opening;
      exportQty += g.subtotal.export;
      closing += g.subtotal.closing;
      calcImport += g.subtotal.calculatedImport;
      actualNCC += g.subtotal.actualNCC;
    });

    return {
      dateCount: filteredDateGroups.length,
      flowerCount: count,
      opening,
      export: exportQty,
      closing,
      calculatedImport: calcImport,
      actualNCC,
      diffNCC: actualNCC - calcImport,
    };
  }, [filteredDateGroups]);

  // Ẩn / hiện một nhóm ngày
  const toggleCollapseDate = (dateYMD: string) => {
    setCollapsedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateYMD)) next.delete(dateYMD);
      else next.add(dateYMD);
      return next;
    });
  };

  // Người dùng nhập Tồn cuối
  const handleClosingStockChange = (dateYMD: string, item: DailyStockItem, value: number) => {
    const val = Math.max(0, value || 0);
    setClosingStock(dateYMD, item.flowerId, val, {
      flowerCode: item.flowerCode,
      flowerName: item.flowerName,
      unit: item.unit,
      dailyExport: item.dailyExport,
      openingStock: item.openingStock,
      actualImportFromNCC: item.actualImportFromNCC,
    });
  };

  // Mở modal sửa tồn đầu thủ công
  const handleOpenEditOpening = (dateYMD: string, item: DailyStockItem) => {
    setEditingOpeningItem({ dateYMD, item });
    setEditingOpeningVal(item.openingStock);
  };

  const handleSaveOpeningStock = () => {
    if (!editingOpeningItem) return;
    setOpeningStock(editingOpeningItem.dateYMD, editingOpeningItem.item.flowerId, editingOpeningVal);
    toast.success(`Đã cập nhật tồn đầu ngày ${formatYMDToDisplay(editingOpeningItem.dateYMD)}: ${formatNumber(editingOpeningVal)}`);
    setEditingOpeningItem(null);
  };

  // Thêm một mặt hàng hoa vào một ngày cụ thể
  const handleAddFlowerToDate = () => {
    if (!targetDateForAdd || !customFlowerId) return;
    const fl = flowers.find((f) => f.id === customFlowerId);
    if (!fl) return;

    addFlowerToDate(targetDateForAdd, {
      id: `${targetDateForAdd}_${fl.id}`,
      date: targetDateForAdd,
      flowerId: fl.id,
      flowerCode: fl.code,
      flowerName: fl.name,
      unit: fl.unit || 'cành',
      openingStock: 0,
      dailyExport: 0,
      closingStock: 0,
      calculatedImport: 0,
      actualImportFromNCC: 0,
    });

    toast.success(`Đã thêm hoa "${fl.name}" vào ngày ${formatYMDToDisplay(targetDateForAdd)}`);
    setTargetDateForAdd(null);
    setCustomFlowerId('');
  };

  // Xuất file Excel (.xlsx) gom nhóm theo ngày
  const handleExportExcel = () => {
    if (filteredDateGroups.length === 0) {
      toast.error('Không có dữ liệu để xuất Excel');
      return;
    }

    const exportData: any[] = [];
    filteredDateGroups.forEach((group) => {
      // Header ngày
      exportData.push({
        STT: `NGÀY ${group.displayDate}`,
        'Mã hoa': `${group.rows.length} loại hoa`,
        'Tên hoa': '',
        'ĐVT': '',
        'Tồn đầu (Hôm trước)': group.subtotal.opening,
        'Xuất ngày (Đơn hàng)': group.subtotal.export,
        'Tồn cuối (Tôi nhập)': group.subtotal.closing,
        'Nhập (Tìm ra nhập)': group.subtotal.calculatedImport,
        'Thực nhập NCC': group.subtotal.actualNCC > 0 ? group.subtotal.actualNCC : '',
        'Đối soát NCC':
          group.subtotal.actualNCC === 0
            ? ''
            : group.subtotal.diffNCC === 0
              ? 'Khớp 100%'
              : group.subtotal.diffNCC > 0
                ? `Thừa nhập +${group.subtotal.diffNCC}`
                : `Thiếu nhập ${group.subtotal.diffNCC}`,
      });

      // Từng dòng hoa
      group.rows.forEach((r, idx) => {
        exportData.push({
          STT: idx + 1,
          'Mã hoa': r.flowerCode,
          'Tên hoa': r.flowerName,
          'ĐVT': r.unit,
          'Tồn đầu (Hôm trước)': r.openingStock,
          'Xuất ngày (Đơn hàng)': r.dailyExport,
          'Tồn cuối (Tôi nhập)': r.closingStock,
          'Nhập (Tìm ra nhập)': r.calculatedImport,
          'Thực nhập NCC': r.actualImportFromNCC > 0 ? r.actualImportFromNCC : '',
          'Đối soát NCC':
            r.actualImportFromNCC === 0
              ? ''
              : r.actualImportFromNCC === r.calculatedImport
                ? 'Khớp 100%'
                : r.actualImportFromNCC > r.calculatedImport
                  ? `Thừa nhập +${r.actualImportFromNCC - r.calculatedImport}`
                  : `Thiếu nhập ${r.actualImportFromNCC - r.calculatedImport}`,
        });
      });

      // Dòng trống cách nhóm
      exportData.push({});
    });

    // Dòng tổng kết toàn bộ
    exportData.push({
      STT: 'TỔNG CỘNG TẤT CẢ:',
      'Mã hoa': `${grandTotal.dateCount} ngày • ${grandTotal.flowerCount} lượt hoa`,
      'Tên hoa': '',
      'ĐVT': '',
      'Tồn đầu (Hôm trước)': grandTotal.opening,
      'Xuất ngày (Đơn hàng)': grandTotal.export,
      'Tồn cuối (Tôi nhập)': grandTotal.closing,
      'Nhập (Tìm ra nhập)': grandTotal.calculatedImport,
      'Thực nhập NCC': grandTotal.actualNCC > 0 ? grandTotal.actualNCC : '',
      'Đối soát NCC':
        grandTotal.actualNCC === 0
          ? ''
          : grandTotal.diffNCC === 0
            ? 'Khớp hoàn toàn'
            : grandTotal.diffNCC > 0
              ? `Tổng thừa +${grandTotal.diffNCC}`
              : `Tổng thiếu ${grandTotal.diffNCC}`,
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ton_Ngay_Nhom');
    XLSX.writeFile(wb, `Bao_Cao_Ton_Ngay_Nhom_${todayYMD}.xlsx`);
    toast.success('Đã xuất file Excel bảng tồn ngày gom nhóm thành công');
  };

  // In PDF báo cáo tồn ngày gom nhóm
  const handlePrintPdf = () => {
    if (filteredDateGroups.length === 0) {
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

    let groupsHtml = '';
    filteredDateGroups.forEach((g) => {
      const rowsHtml = g.rows
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

      groupsHtml += `
        <div style="margin-top: 20px; page-break-inside: avoid;">
          <div style="background: #e0f2fe; padding: 7px 10px; font-weight: bold; font-size: 13px; color: #0369a1; border: 1px solid #bae6fd; border-radius: 4px; display: flex; justify-content: space-between;">
            <span>📅 NGÀY ${g.displayDate} (${g.rows.length} loại hoa)</span>
            <span>Tổng xuất: ${formatNumber(g.subtotal.export)} • Nhập tìm ra: ${formatNumber(g.subtotal.calculatedImport)}</span>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-top: 6px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="width: 40px; text-align: center; border: 1px solid #cbd5e1; padding: 6px;">STT</th>
                <th style="width: 110px; text-align: left; border: 1px solid #cbd5e1; padding: 6px;">Mã hoa</th>
                <th style="text-align: left; border: 1px solid #cbd5e1; padding: 6px;">Tên hoa</th>
                <th style="width: 100px; text-align: right; border: 1px solid #cbd5e1; padding: 6px;">Tồn đầu</th>
                <th style="width: 100px; text-align: right; border: 1px solid #cbd5e1; padding: 6px;">Xuất ngày</th>
                <th style="width: 100px; text-align: right; border: 1px solid #cbd5e1; padding: 6px;">Tồn cuối</th>
                <th style="width: 110px; text-align: right; border: 1px solid #cbd5e1; padding: 6px;">Nhập (Tìm ra)</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td colspan="3" style="text-align: right; padding: 6px 10px; border: 1px solid #cbd5e1;">TỔNG NGÀY ${g.displayDate}:</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px;">${formatNumber(g.subtotal.opening)}</td>
                <td style="text-align: right; color: #be123c; border: 1px solid #cbd5e1; padding: 6px;">${formatNumber(g.subtotal.export)}</td>
                <td style="text-align: right; border: 1px solid #cbd5e1; padding: 6px;">${formatNumber(g.subtotal.closing)}</td>
                <td style="text-align: right; color: #1d4ed8; border: 1px solid #cbd5e1; padding: 6px;">${formatNumber(g.subtotal.calculatedImport)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>BÁO CÁO TỒN NGÀY THEO TỪNG NGÀY</title>
        <style>
          @page { size: A4; margin: 12mm 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111827; padding: 10px; margin: 0; font-size: 12px; }
          .header { text-align: center; margin-bottom: 14px; border-bottom: 2px solid #0284c7; padding-bottom: 8px; }
          .header h1 { margin: 0 0 4px; font-size: 18px; text-transform: uppercase; color: #0369a1; }
          .header .subtitle { font-size: 12px; color: #4b5563; }
          td { font-size: 12px; border: 1px solid #e2e8f0; padding: 5px 6px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>BÁO CÁO TỒN NGÀY & TÍNH SỐ LƯỢNG NHẬP (NHÓM THEO NGÀY)</h1>
          <div class="subtitle">HOA KHANG THÀNH • Công thức: Nhập = Tồn cuối + Xuất ngày - Tồn đầu (Tồn đầu = Tồn cuối hôm trước)</div>
        </div>

        ${groupsHtml}

        <div style="margin-top: 35px; display: flex; justify-content: space-between; text-align: center;">
          <div style="width: 180px;"><div style="font-weight: bold; margin-bottom: 45px;">Người kiểm tồn</div><div>(Ký & ghi rõ họ tên)</div></div>
          <div style="width: 180px;"><div style="font-weight: bold; margin-bottom: 45px;">Thủ kho</div><div>(Ký & ghi rõ họ tên)</div></div>
          <div style="width: 180px;"><div style="font-weight: bold; margin-bottom: 45px;">Chủ shop / Kế toán</div><div>(Ký & ghi rõ họ tên)</div></div>
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
      {/* Tiêu đề & Chọn ngày */}
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">
              Báo Cáo Tồn Ngày (Gom Nhóm Theo Ngày)
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tồn đầu lấy từ Tồn cuối hôm trước • Xuất ngày lấy từ Đơn hàng • Nhập Tồn cuối để tìm ra số lượng Nhập
            </p>
          </div>
        </div>

        {/* Thanh chuyển nhanh & lọc ngày */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={selectedDateFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setSelectedDateFilter('all')}
            className="h-8 text-xs font-semibold px-2.5"
          >
            Tất cả các ngày ({availableDates.length})
          </Button>

          {/* Các nút ngày có đơn hàng gần đây */}
          {availableDates.slice(0, 4).map((dStr) => (
            <Button
              key={dStr}
              size="sm"
              variant={selectedDateFilter === dStr ? 'default' : 'outline'}
              onClick={() => setSelectedDateFilter(dStr)}
              className="h-8 text-xs px-2.5"
            >
              {dStr === todayYMD ? 'Hôm nay' : formatYMDToDisplay(dStr)}
            </Button>
          ))}

          {/* Date Picker chọn ngày bất kỳ */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-background border border-border shadow-xs text-xs font-semibold">
            <Calendar size={13} className="text-cyan-600" />
            <input
              type="date"
              value={selectedDateFilter === 'all' ? '' : selectedDateFilter}
              onChange={(e) => e.target.value && setSelectedDateFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer"
              title="Chọn ngày cụ thể"
            />
          </div>
        </div>
      </div>

      {/* Thẻ KPI tổng kết */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 shrink-0">
        <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Số ngày có số liệu</div>
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {grandTotal.dateCount} ngày
            </div>
          </div>
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Calendar size={18} />
          </div>
        </div>

        <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Tổng Tồn đầu (Hôm trước)</div>
            <div className="text-lg font-bold text-foreground mt-0.5 tabular-nums">
              {formatNumber(grandTotal.opening)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            <RotateCcw size={18} />
          </div>
        </div>

        <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-800 dark:text-rose-300 font-medium">Tổng Xuất ngày (Đơn hàng)</div>
            <div className="text-lg font-extrabold text-rose-700 dark:text-rose-300 mt-0.5 tabular-nums">
              {formatNumber(grandTotal.export)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <ShoppingCart size={18} />
          </div>
        </div>

        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">Tổng Tồn cuối (Đã đếm)</div>
            <div className="text-lg font-extrabold text-amber-700 dark:text-amber-300 mt-0.5 tabular-nums">
              {formatNumber(grandTotal.closing)}
            </div>
          </div>
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <ClipboardCheck size={18} />
          </div>
        </div>

        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-blue-800 dark:text-blue-300 font-semibold">Tổng Nhập (Tìm ra)</div>
            <div className="text-lg font-extrabold text-blue-700 dark:text-blue-300 mt-0.5 tabular-nums">
              {formatNumber(grandTotal.calculatedImport)}
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
            <strong>Gom nhóm theo ngày:</strong> Mỗi ngày hiển thị đúng các mặt hàng hoa phát sinh của ngày đó.
            Nhập = Tồn cuối + Xuất ngày - Tồn đầu (Tồn đầu tự động nhận từ Tồn cuối hôm trước).
          </span>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Bấm vào ô <strong>Tồn cuối</strong> để nhập số lượng hoa kiểm đếm
        </div>
      </div>

      {/* Thanh công cụ: Tìm kiếm & Thao tác */}
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

      {/* Danh sách các nhóm ngày */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
        {filteredDateGroups.length === 0 ? (
          <div className="py-20 text-center bg-card rounded-xl border border-border">
            <Package size={32} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">Không có dữ liệu kiểm tồn ngày</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm ? 'Không tìm thấy hoa phù hợp với từ khóa.' : 'Chưa có đơn hàng hoặc phát sinh nào.'}
            </p>
          </div>
        ) : (
          filteredDateGroups.map((group) => {
            const isCollapsed = collapsedDates.has(group.dateYMD);

            return (
              <div
                key={group.dateYMD}
                className="bg-card rounded-xl border border-border overflow-hidden shadow-xs transition-all"
              >
                {/* Thanh tiêu đề nhóm ngày */}
                <div
                  onClick={() => toggleCollapseDate(group.dateYMD)}
                  className="px-3.5 py-2.5 bg-muted/60 hover:bg-muted/80 border-b border-border flex flex-wrap items-center justify-between gap-2.5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1 rounded text-muted-foreground hover:text-foreground"
                    >
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                      <Calendar size={15} className="text-cyan-600" />
                      Ngày {group.displayDate}
                      {group.isToday && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                          Hôm nay
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      ({group.rows.length} loại hoa)
                    </span>
                  </div>

                  {/* Tóm tắt nhanh số liệu ngày */}
                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <div className="text-muted-foreground">
                      Tồn đầu: <span className="text-foreground">{formatNumber(group.subtotal.opening)}</span>
                    </div>
                    <div className="text-rose-600">
                      Xuất ngày: <span>-{formatNumber(group.subtotal.export)}</span>
                    </div>
                    <div className="text-amber-600">
                      Tồn cuối: <span>{formatNumber(group.subtotal.closing)}</span>
                    </div>
                    <div className="text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                      Nhập tìm ra: <span>+{formatNumber(group.subtotal.calculatedImport)}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTargetDateForAdd(group.dateYMD);
                        setCustomFlowerId('');
                      }}
                      className="h-7 text-xs px-2 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100/50 gap-1"
                    >
                      <Plus size={12} />
                      <span>Thêm hoa</span>
                    </Button>
                  </div>
                </div>

                {/* Bảng các dòng hoa của ngày này */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-separate border-spacing-0">
                      <thead className="bg-muted/40 text-foreground/80 font-semibold select-none">
                        <tr>
                          <th className="px-3 py-2 text-center border-b border-r border-border/80 w-12">STT</th>
                          <th className="px-3 py-2 border-b border-r border-border/80 w-28">Mã hoa</th>
                          <th className="px-3 py-2 border-b border-r border-border/80 min-w-[200px]">Tên hoa</th>
                          <th className="px-3 py-2 text-right border-b border-r border-border/80 w-32">
                            Tồn đầu
                            <div className="text-[10px] font-normal text-muted-foreground">(Hôm trước)</div>
                          </th>
                          <th className="px-3 py-2 text-right border-b border-r border-border/80 w-32 text-rose-700 dark:text-rose-400">
                            Xuất ngày
                            <div className="text-[10px] font-normal text-muted-foreground">(Đơn hàng)</div>
                          </th>
                          <th className="px-3 py-2 text-center border-b border-r border-border/80 w-36 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200">
                            Tồn cuối
                            <div className="text-[10px] font-normal text-amber-700 dark:text-amber-300">(Tôi nhập vào ô này)</div>
                          </th>
                          <th className="px-3 py-2 text-right border-b border-r border-border/80 w-32 text-blue-700 dark:text-blue-400 font-bold bg-blue-50/20 dark:bg-blue-950/10">
                            Nhập
                            <div className="text-[10px] font-normal text-blue-600 dark:text-blue-400">(Tìm ra nhập)</div>
                          </th>
                          <th className="px-3 py-2 text-right border-b border-r border-border/80 w-28">Thực nhập NCC</th>
                          <th className="px-3 py-2 text-center border-b border-border/80 w-36">Đối soát NCC</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="py-6 text-center text-muted-foreground">
                              Chưa có mặt hàng hoa nào trong ngày này. Bấm "+ Thêm hoa" để nhập hoa cần kiểm đếm.
                            </td>
                          </tr>
                        ) : (
                          group.rows.map((item, idx) => {
                            const hasNCC = item.actualImportFromNCC > 0;
                            const isNCCMatched = item.actualImportFromNCC === item.calculatedImport;
                            const isNCCShortage = item.actualImportFromNCC < item.calculatedImport;
                            const diff = item.actualImportFromNCC - item.calculatedImport;

                            return (
                              <tr
                                key={item.id}
                                className="border-b border-border hover:bg-muted/30 transition-colors [&>td]:border-b [&>td]:border-border/60"
                              >
                                <td className="px-3 py-2 text-center text-muted-foreground tabular-nums border-r border-border/60">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-2 border-r border-border/60">
                                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground">
                                    {item.flowerCode}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-medium text-foreground border-r border-border/60">
                                  {item.flowerName}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums border-r border-border/60">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditOpening(group.dateYMD, item)}
                                    title="Bấm để chỉnh sửa tồn đầu"
                                    className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                                  >
                                    {formatNumber(item.openingStock)}
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400 border-r border-border/60">
                                  {item.dailyExport > 0 ? `-${formatNumber(item.dailyExport)}` : '0'}
                                </td>
                                {/* Ô NHẬP TỒN CUỐI */}
                                <td className="px-2 py-1.5 border-r border-border/60 bg-amber-50/20 dark:bg-amber-950/10 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleClosingStockChange(group.dateYMD, item, item.closingStock - 5)}
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
                                        handleClosingStockChange(group.dateYMD, item, Number(e.target.value) || 0)
                                      }
                                      className="w-20 h-7 text-center font-bold text-xs rounded border border-amber-300 dark:border-amber-700 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleClosingStockChange(group.dateYMD, item, item.closingStock + 5)}
                                      className="w-5 h-6 rounded bg-muted hover:bg-muted/80 text-muted-foreground text-xs flex items-center justify-center font-bold"
                                      title="+5"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                {/* NHẬP TÌM RA */}
                                <td className="px-3 py-2 text-right tabular-nums font-extrabold text-blue-600 dark:text-blue-400 border-r border-border/60 bg-blue-50/20 dark:bg-blue-950/10">
                                  {formatNumber(item.calculatedImport)}
                                </td>
                                {/* Thực nhập NCC */}
                                <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground border-r border-border/60">
                                  {hasNCC ? formatNumber(item.actualImportFromNCC) : <span className="text-muted-foreground">—</span>}
                                </td>
                                {/* Đối soát NCC */}
                                <td className="px-3 py-2 text-center">
                                  {!hasNCC ? (
                                    <span className="text-muted-foreground text-[11px]">Chưa nhập NCC</span>
                                  ) : isNCCMatched ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
                                      <CheckCircle2 size={12} /> Khớp 100%
                                    </span>
                                  ) : isNCCShortage ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
                                      <TrendingDown size={12} /> Thiếu {formatNumber(Math.abs(diff))}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
                                      <TrendingUp size={12} /> Thừa +{formatNumber(diff)}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {/* Dòng TỔNG CỘNG CHO NHÓM NGÀY NÀY */}
                      {group.rows.length > 0 && (
                        <tfoot className="bg-muted/90 font-bold text-xs border-t-2 border-border/80">
                          <tr>
                            <td colSpan={3} className="px-3 py-2.5 text-right uppercase border-r border-border/80">
                              TỔNG CỘNG NGÀY {group.displayDate} ({group.rows.length} LOẠI HOA):
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-foreground border-r border-border/80">
                              {formatNumber(group.subtotal.opening)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-rose-700 dark:text-rose-400 border-r border-border/80">
                              {formatNumber(group.subtotal.export)}
                            </td>
                            <td className="px-3 py-2.5 text-center tabular-nums text-amber-800 dark:text-amber-200 border-r border-border/80 font-extrabold bg-amber-100/60 dark:bg-amber-950/60">
                              {formatNumber(group.subtotal.closing)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-blue-700 dark:text-blue-300 border-r border-border/80 font-extrabold bg-blue-50/40 dark:bg-blue-950/30">
                              {formatNumber(group.subtotal.calculatedImport)}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-foreground border-r border-border/80">
                              {group.subtotal.actualNCC > 0 ? formatNumber(group.subtotal.actualNCC) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-center text-muted-foreground text-[11px] font-normal">
                              {group.subtotal.actualNCC > 0 ? (
                                group.subtotal.diffNCC === 0 ? (
                                  <span className="text-emerald-600 font-bold">✔ Khớp hoàn toàn</span>
                                ) : group.subtotal.diffNCC > 0 ? (
                                  <span className="text-blue-600 font-bold">Thừa +{formatNumber(group.subtotal.diffNCC)}</span>
                                ) : (
                                  <span className="text-rose-600 font-bold">Thiếu {formatNumber(Math.abs(group.subtotal.diffNCC))}</span>
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
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal điều chỉnh Tồn đầu thủ công */}
      {editingOpeningItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Điều chỉnh Tồn đầu ngày</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ngày {formatYMDToDisplay(editingOpeningItem.dateYMD)} • {editingOpeningItem.item.flowerName}
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
                  Số lượng Tồn đầu ({editingOpeningItem.item.unit}):
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
                  (Thông thường hệ thống tự động nhận từ Tồn cuối hôm trước. Bạn chỉ chỉnh khi ngày đầu tiên chưa có số liệu).
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

      {/* Modal thêm hoa vào một ngày cụ thể */}
      {targetDateForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Thêm hoa vào ngày kiểm tồn</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ngày {formatYMDToDisplay(targetDateForAdd)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTargetDateForAdd(null)}
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
                onClick={() => setTargetDateForAdd(null)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!customFlowerId}
                onClick={handleAddFlowerToDate}
                className="bg-primary text-primary-foreground font-semibold"
              >
                Thêm vào ngày
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
