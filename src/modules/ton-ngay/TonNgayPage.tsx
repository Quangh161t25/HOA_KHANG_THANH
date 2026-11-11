import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Info,
  Package,
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
import { useFlowerStore, useOrderStore, useSupplierOrderStore } from '@/stores/hoaKhangThanhStore';
import {
  useDailyStockReconcileStore,
  normalizeDateToYMD,
  formatYMDToDisplay,
  type DailyStockRecord,
} from '@/stores/dailyStockReconcileStore';
import { todayISODate } from '@/lib/format';

// Dùng chung 1 bộ định dạng số (toLocaleString tạo Intl mới mỗi lần gọi -> rất chậm khi có hàng nghìn ô)
const viNumberFormat = new Intl.NumberFormat('vi-VN');
const fmt = (n: number) => viNumberFormat.format(n || 0);

const WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const weekdayOf = (ymd: string) => WEEKDAYS[dayjs(ymd).day()] ?? '';

/** Một dòng hiển thị: Mã hoa, Tên hoa, Tồn cuối là cột thật; còn lại là cột ảo (tính khi hiển thị) */
interface DailyRow {
  key: string; // date_flowerId
  flowerId: string;
  flowerCode: string;
  flowerName: string;
  unit: string;
  openingStock: number; // ảo: tồn cuối hôm trước (hoặc số sửa tay)
  isOpeningCustom: boolean;
  dailyExport: number; // ảo: từ Đơn hàng
  closingStock: number; // THẬT: người dùng nhập
  calculatedImport: number; // ảo: Tồn cuối + Xuất ngày - Tồn đầu
  actualImportFromNCC: number; // ảo: từ Đơn nhập NCC
}

interface Subtotal {
  flowerCount: number;
  opening: number;
  export: number;
  closing: number;
  calculatedImport: number;
  actualNCC: number;
}

interface DateGroupData {
  dateYMD: string;
  displayDate: string;
  isToday: boolean;
  rows: DailyRow[];
  subtotal: Subtotal;
}

function sumRows(rows: DailyRow[]): Subtotal {
  const s: Subtotal = { flowerCount: rows.length, opening: 0, export: 0, closing: 0, calculatedImport: 0, actualNCC: 0 };
  for (const r of rows) {
    s.opening += r.openingStock;
    s.export += r.dailyExport;
    s.closing += r.closingStock;
    s.calculatedImport += r.calculatedImport;
    s.actualNCC += r.actualImportFromNCC;
  }
  return s;
}

const keyOf = (s?: string) => (s || '').trim().toLowerCase();

/** Gom số lượng theo ngày → (mã/id/tên hoa viết thường) */
function indexByDate(
  list: { status?: string; orderDate?: string; items?: { quantity?: number; flowerCode?: string; flowerId?: string; flowerName?: string }[] }[],
) {
  const map = new Map<string, Map<string, number>>();
  list.forEach((o) => {
    if (o.status === 'huy') return;
    const ymd = normalizeDateToYMD(o.orderDate);
    if (!ymd) return;
    let dayMap = map.get(ymd);
    if (!dayMap) {
      dayMap = new Map<string, number>();
      map.set(ymd, dayMap);
    }
    (o.items || []).forEach((it) => {
      const qty = Number(it.quantity) || 0;
      const codeKey = keyOf(it.flowerCode);
      const idKey = keyOf(it.flowerId);
      const nameKey = keyOf(it.flowerName);
      if (codeKey) dayMap!.set(codeKey, (dayMap!.get(codeKey) || 0) + qty);
      if (idKey && idKey !== codeKey) dayMap!.set(idKey, (dayMap!.get(idKey) || 0) + qty);
      if (nameKey && nameKey !== codeKey) dayMap!.set(nameKey, (dayMap!.get(nameKey) || 0) + qty);
    });
  });
  return map;
}

interface DailyStockRowProps {
  idx: number;
  dateYMD: string;
  item: DailyRow;
  onClosingChange: (dateYMD: string, item: DailyRow, val: number) => void;
  onOpenEditOpening: (dateYMD: string, item: DailyRow) => void;
}

// Dòng hoa: có state riêng cho ô nhập + debounce 300ms nên gõ phím không lag
const DailyStockRow = React.memo(
  function DailyStockRow({ idx, dateYMD, item, onClosingChange, onOpenEditOpening }: DailyStockRowProps) {
    const [localVal, setLocalVal] = useState<string>(() => (item.closingStock === 0 ? '' : String(item.closingStock)));

    useEffect(() => {
      setLocalVal(item.closingStock === 0 ? '' : String(item.closingStock));
    }, [item.closingStock]);

    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const numClosing = localVal === '' ? 0 : Math.max(0, parseInt(localVal, 10) || 0);
    const localCalculatedImport = Math.max(0, numClosing + item.dailyExport - item.openingStock);

    const commit = useCallback(
      (val: number) => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        if (val !== item.closingStock) onClosingChange(dateYMD, item, val);
      },
      [dateYMD, item, onClosingChange],
    );

    useEffect(
      () => () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      },
      [],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      if (raw !== '' && !/^\d+$/.test(raw)) return;
      setLocalVal(raw);
      const nextNum = raw === '' ? 0 : Math.max(0, parseInt(raw, 10) || 0);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => commit(nextNum), 300);
    };

    const hasNCC = item.actualImportFromNCC > 0;
    const diff = item.actualImportFromNCC - localCalculatedImport;

    return (
      <tr className="hover:bg-muted/30 [&>td]:border-b [&>td]:border-border/60">
        <td className="px-3 py-2 text-center text-muted-foreground tabular-nums">{idx + 1}</td>
        <td className="px-3 py-2">
          <span className="font-mono font-bold px-2 py-0.5 rounded bg-muted/60 border border-border text-foreground">
            {item.flowerCode}
          </span>
        </td>
        <td className="px-3 py-2 font-medium text-foreground">{item.flowerName}</td>
        <td className="px-3 py-2 text-right tabular-nums">
          <button
            type="button"
            onClick={() => onOpenEditOpening(dateYMD, item)}
            title={item.isOpeningCustom ? 'Tồn đầu đã sửa tay — bấm để chỉnh' : 'Bấm để chỉnh sửa tồn đầu'}
            className={`font-semibold hover:text-primary hover:underline cursor-pointer ${item.isOpeningCustom ? 'text-amber-600' : 'text-foreground'}`}
          >
            {fmt(item.openingStock)}
            {item.isOpeningCustom && '*'}
          </button>
        </td>
        <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">
          {item.dailyExport > 0 ? `-${fmt(item.dailyExport)}` : '0'}
        </td>
        <td className="px-2 py-1.5 bg-amber-50/30 dark:bg-amber-950/10 text-center">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={localVal}
            placeholder="0"
            onChange={handleChange}
            onBlur={() => commit(numClosing)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                commit(numClosing);
                (e.target as HTMLInputElement).blur();
              }
            }}
            className="w-20 h-7 text-center font-bold text-xs rounded border border-amber-300 dark:border-amber-700 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </td>
        <td className="px-3 py-2 text-right tabular-nums font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10">
          {fmt(localCalculatedImport)}
        </td>
        <td className="px-3 py-2 text-right tabular-nums font-semibold text-foreground">
          {hasNCC ? fmt(item.actualImportFromNCC) : <span className="text-muted-foreground">—</span>}
        </td>
        <td className="px-3 py-2 text-center">
          {!hasNCC ? (
            <span className="text-muted-foreground text-[11px]">—</span>
          ) : diff === 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200">
              <CheckCircle2 size={12} /> Khớp
            </span>
          ) : diff < 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200">
              <TrendingDown size={12} /> Thiếu {fmt(Math.abs(diff))}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200">
              <TrendingUp size={12} /> Thừa +{fmt(diff)}
            </span>
          )}
        </td>
      </tr>
    );
  },
  (prev, next) =>
    prev.idx === next.idx &&
    prev.dateYMD === next.dateYMD &&
    prev.item.key === next.item.key &&
    prev.item.openingStock === next.item.openingStock &&
    prev.item.isOpeningCustom === next.item.isOpeningCustom &&
    prev.item.dailyExport === next.item.dailyExport &&
    prev.item.closingStock === next.item.closingStock &&
    prev.item.actualImportFromNCC === next.item.actualImportFromNCC &&
    prev.item.flowerCode === next.item.flowerCode &&
    prev.item.flowerName === next.item.flowerName &&
    prev.onClosingChange === next.onClosingChange &&
    prev.onOpenEditOpening === next.onOpenEditOpening,
);

// Ô chọn ngày chuẩn dd/mm/yyyy: đọc vào và ghi định dạng dd/mm/yyyy chuẩn Việt Nam
function DateInputVN({
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => (value ? formatYMDToDisplay(value) : ''));
  const pickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setText(value ? formatYMDToDisplay(value) : '');
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9/]/g, '');
    if (raw.length === 2 && !raw.includes('/') && !text.endsWith('/')) raw = raw + '/';
    if (raw.length === 5 && raw.split('/').length === 2 && !text.endsWith('/')) raw = raw + '/';
    if (raw.length > 10) raw = raw.slice(0, 10);
    setText(raw);

    if (raw.length === 10) {
      const ymd = normalizeDateToYMD(raw);
      if (ymd && ymd.length === 10 && !isNaN(new Date(ymd).getTime())) {
        onChange(ymd);
      }
    } else if (raw === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    if (!text.trim()) {
      onChange('');
      return;
    }
    const ymd = normalizeDateToYMD(text);
    if (ymd && ymd.length === 10 && !isNaN(new Date(ymd).getTime())) {
      onChange(ymd);
      setText(formatYMDToDisplay(ymd));
    } else {
      setText(value ? formatYMDToDisplay(value) : '');
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        type="text"
        value={text}
        placeholder={placeholder}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className="w-24 h-7 pl-2 pr-6 rounded border border-border bg-background text-xs font-mono font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      <button
        type="button"
        onClick={() => {
          try {
            pickerRef.current?.showPicker();
          } catch {
            pickerRef.current?.focus();
          }
        }}
        title="Bấm để chọn từ lịch"
        className="absolute right-1 text-muted-foreground hover:text-cyan-600 transition-colors cursor-pointer"
      >
        <Calendar size={13} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        value={normalizeDateToYMD(value)}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
            setText(formatYMDToDisplay(e.target.value));
          }
        }}
        className="sr-only pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
}

type QuickRange = 'today' | '7d' | '30d' | 'all' | 'custom';

export default function TonNgayPage() {
  const todayYMD = todayISODate();

  // Lọc ngày: mặc định 7 ngày gần nhất
  const [fromDate, setFromDate] = useState<string>(() => dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
  const [toDate, setToDate] = useState<string>(todayYMD);
  const [quickRange, setQuickRange] = useState<QuickRange>('7d');

  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const [editingOpening, setEditingOpening] = useState<{ dateYMD: string; item: DailyRow } | null>(null);
  const [editingOpeningVal, setEditingOpeningVal] = useState<number>(0);

  const flowers = useFlowerStore((s) => s.flowers);
  const orders = useOrderStore((s) => s.orders);
  const supplierOrders = useSupplierOrderStore((s) => s.orders);
  const records = useDailyStockReconcileStore((s) => s.records);
  const setClosingStock = useDailyStockReconcileStore((s) => s.setClosingStock);
  const setOpeningStockCustom = useDailyStockReconcileStore((s) => s.setOpeningStockCustom);

  const applyQuickRange = (r: QuickRange) => {
    setQuickRange(r);
    if (r === 'today') {
      setFromDate(todayYMD);
      setToDate(todayYMD);
    } else if (r === '7d') {
      setFromDate(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
      setToDate(todayYMD);
    } else if (r === '30d') {
      setFromDate(dayjs().subtract(29, 'day').format('YYYY-MM-DD'));
      setToDate(todayYMD);
    } else if (r === 'all') {
      setFromDate('');
      setToDate('');
    }
  };

  // 1. Chỉ mục Đơn hàng / Đơn nhập NCC theo ngày (chỉ tính lại khi dữ liệu đơn thay đổi)
  const dayOrderQtyByDate = useMemo(() => indexByDate(orders), [orders]);
  const dayNCCImportByDate = useMemo(() => indexByDate(supplierOrders), [supplierOrders]);

  // 2. Tra cứu hoa theo id / mã / tên (viết thường)
  const flowerIndex = useMemo(() => {
    const byKey = new Map<string, number>(); // key -> vị trí trong danh mục
    flowers.forEach((fl, i) => {
      [keyOf(fl.code), keyOf(fl.id), keyOf(fl.name)].forEach((k) => {
        if (k && !byKey.has(k)) byKey.set(k, i);
      });
    });
    const byId = new Map<string, number>();
    flowers.forEach((fl, i) => byId.set(fl.id, i));
    return { byKey, byId };
  }, [flowers]);

  // 3. Tính toàn bộ các ngày (tăng dần để chuyển tồn cuối → tồn đầu ngày sau)
  const allDateGroups = useMemo<DateGroupData[]>(() => {
    const recordsByDate = new Map<string, DailyStockRecord[]>();
    Object.keys(records).forEach((k) => {
      const ymd = normalizeDateToYMD(k);
      if (!ymd) return;
      recordsByDate.set(ymd, [...(recordsByDate.get(ymd) || []), ...records[k]]);
    });

    const dateSet = new Set<string>([todayYMD]);
    dayOrderQtyByDate.forEach((_, d) => dateSet.add(d));
    dayNCCImportByDate.forEach((_, d) => dateSet.add(d));
    recordsByDate.forEach((_, d) => dateSet.add(d));
    const datesAsc = Array.from(dateSet).sort();

    // Tồn cuối gần nhất trước ngày đang xét, theo vị trí hoa trong danh mục
    const lastClosing = new Map<number, number>();

    const groups: DateGroupData[] = [];
    for (const dateYMD of datesAsc) {
      const orderMap = dayOrderQtyByDate.get(dateYMD);
      const nccMap = dayNCCImportByDate.get(dateYMD);
      const saved = recordsByDate.get(dateYMD) || [];

      // Bản ghi đã lưu của ngày, theo vị trí hoa
      const savedByFlower = new Map<number, DailyStockRecord>();
      saved.forEach((r) => {
        const fi = flowerIndex.byId.get(r.flowerId) ?? flowerIndex.byKey.get(keyOf(r.flowerCode));
        if (fi !== undefined) savedByFlower.set(fi, r);
      });

      // Ứng viên: hoa có xuất trong ngày, hoa có tồn từ hôm trước, hoa sửa tay tồn đầu
      const candidates = new Set<number>();
      orderMap?.forEach((qty, k) => {
        if (qty <= 0) return;
        const fi = flowerIndex.byKey.get(k);
        if (fi !== undefined) candidates.add(fi);
      });
      lastClosing.forEach((v, fi) => {
        if (v > 0) candidates.add(fi);
      });
      savedByFlower.forEach((r, fi) => {
        if ((r.openingStockCustom ?? 0) > 0) candidates.add(fi);
      });

      const lookup = (m: Map<string, number> | undefined, fl: (typeof flowers)[number]) => {
        if (!m) return 0;
        const c = keyOf(fl.code);
        const i = keyOf(fl.id);
        const n = keyOf(fl.name);
        return (c ? m.get(c) : 0) || (i ? m.get(i) : 0) || (n ? m.get(n) : 0) || 0;
      };

      const rows: DailyRow[] = [];
      Array.from(candidates)
        .sort((a, b) => a - b)
        .forEach((fi) => {
          const fl = flowers[fi];
          const rec = savedByFlower.get(fi);
          const isOpeningCustom = rec?.openingStockCustom !== undefined;
          const openingStock = isOpeningCustom ? rec!.openingStockCustom! : lastClosing.get(fi) ?? 0;
          const dailyExport = lookup(orderMap, fl);

          // Chỉ hiện hoa có Tồn đầu > 0 hoặc Xuất ngày > 0
          if (openingStock <= 0 && dailyExport <= 0) return;

          const closingStock = rec?.closingStock ?? 0;
          rows.push({
            key: `${dateYMD}_${fl.id}`,
            flowerId: fl.id,
            flowerCode: rec?.flowerCode || fl.code,
            flowerName: rec?.flowerName || fl.name,
            unit: fl.unit || 'cành',
            openingStock,
            isOpeningCustom,
            dailyExport,
            closingStock,
            calculatedImport: Math.max(0, closingStock + dailyExport - openingStock),
            actualImportFromNCC: lookup(nccMap, fl),
          });
        });

      // Cập nhật tồn cuối đã nhập của ngày này cho các ngày sau
      savedByFlower.forEach((r, fi) => lastClosing.set(fi, r.closingStock || 0));

      groups.push({
        dateYMD,
        displayDate: formatYMDToDisplay(dateYMD),
        isToday: dateYMD === todayYMD,
        rows,
        subtotal: sumRows(rows),
      });
    }

    return groups.reverse(); // ngày mới nhất lên đầu
  }, [records, flowers, flowerIndex, dayOrderQtyByDate, dayNCCImportByDate, todayYMD]);

  // 4. Lọc theo khoảng ngày + tìm kiếm
  const filteredDateGroups = useMemo(() => {
    const q = deferredSearchTerm.trim().toLowerCase();
    return allDateGroups
      .filter((g) => (!fromDate || g.dateYMD >= fromDate) && (!toDate || g.dateYMD <= toDate))
      .map((g) => {
        if (!q) return g;
        const rows = g.rows.filter(
          (r) => r.flowerCode.toLowerCase().includes(q) || r.flowerName.toLowerCase().includes(q),
        );
        return { ...g, rows, subtotal: sumRows(rows) };
      })
      .filter((g) => g.rows.length > 0);
  }, [allDateGroups, fromDate, toDate, deferredSearchTerm]);

  const grandTotal = useMemo(() => {
    const t = { dateCount: filteredDateGroups.length, flowerCount: 0, opening: 0, export: 0, closing: 0, calculatedImport: 0, actualNCC: 0 };
    filteredDateGroups.forEach((g) => {
      t.flowerCount += g.subtotal.flowerCount;
      t.opening += g.subtotal.opening;
      t.export += g.subtotal.export;
      t.closing += g.subtotal.closing;
      t.calculatedImport += g.subtotal.calculatedImport;
      t.actualNCC += g.subtotal.actualNCC;
    });
    return t;
  }, [filteredDateGroups]);

  const handleClosingStockChange = useCallback(
    (dateYMD: string, item: DailyRow, value: number) => {
      setClosingStock(dateYMD, item.flowerId, Math.max(0, value || 0), {
        flowerCode: item.flowerCode,
        flowerName: item.flowerName,
      });
    },
    [setClosingStock],
  );

  const handleOpenEditOpening = useCallback((dateYMD: string, item: DailyRow) => {
    setEditingOpening({ dateYMD, item });
    setEditingOpeningVal(item.openingStock);
  }, []);

  const handleSaveOpening = (resetToAuto = false) => {
    if (!editingOpening) return;
    const { dateYMD, item } = editingOpening;
    setOpeningStockCustom(dateYMD, item.flowerId, resetToAuto ? undefined : editingOpeningVal, {
      flowerCode: item.flowerCode,
      flowerName: item.flowerName,
    });
    toast.success(
      resetToAuto
        ? `Đã trả tồn đầu ngày ${formatYMDToDisplay(dateYMD)} về tự động`
        : `Đã cập nhật tồn đầu ngày ${formatYMDToDisplay(dateYMD)}: ${fmt(editingOpeningVal)}`,
    );
    setEditingOpening(null);
  };

  const ncc = (actual: number, calc: number) =>
    actual === 0 ? '' : actual === calc ? 'Khớp' : actual > calc ? `Thừa +${actual - calc}` : `Thiếu ${actual - calc}`;

  // Xuất Excel gom nhóm theo ngày
  const handleExportExcel = () => {
    if (filteredDateGroups.length === 0) {
      toast.error('Không có dữ liệu để xuất Excel');
      return;
    }
    const data: Record<string, string | number>[] = [];
    filteredDateGroups.forEach((g) => {
      data.push({
        STT: `${weekdayOf(g.dateYMD)}, ${g.displayDate}`,
        'Mã hoa': `${g.rows.length} loại hoa`,
        'Tên hoa': '',
        'Tồn đầu': g.subtotal.opening,
        'Xuất ngày': g.subtotal.export,
        'Tồn cuối': g.subtotal.closing,
        'Nhập (tìm ra)': g.subtotal.calculatedImport,
        'Thực nhập NCC': g.subtotal.actualNCC || '',
        'Đối soát NCC': ncc(g.subtotal.actualNCC, g.subtotal.calculatedImport),
      });
      g.rows.forEach((r, i) =>
        data.push({
          STT: i + 1,
          'Mã hoa': r.flowerCode,
          'Tên hoa': r.flowerName,
          'Tồn đầu': r.openingStock,
          'Xuất ngày': r.dailyExport,
          'Tồn cuối': r.closingStock,
          'Nhập (tìm ra)': r.calculatedImport,
          'Thực nhập NCC': r.actualImportFromNCC || '',
          'Đối soát NCC': ncc(r.actualImportFromNCC, r.calculatedImport),
        }),
      );
      data.push({});
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ton_Ngay');
    const fromDisp = fromDate ? formatYMDToDisplay(fromDate).replace(/\//g, '-') : 'tat-ca';
    const toDisp = toDate ? formatYMDToDisplay(toDate).replace(/\//g, '-') : formatYMDToDisplay(todayYMD).replace(/\//g, '-');
    XLSX.writeFile(wb, `Ton_Ngay_${fromDisp}_den_${toDisp}.xlsx`);
    toast.success('Đã xuất file Excel tồn ngày');
  };

  // In PDF gom nhóm theo ngày
  const handlePrintPdf = () => {
    if (filteredDateGroups.length === 0) {
      toast.error('Không có dữ liệu để in');
      return;
    }
    const frame = document.createElement('iframe');
    Object.assign(frame.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
    document.body.appendChild(frame);
    const doc = frame.contentWindow?.document;
    if (!doc) return;

    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
    const body = filteredDateGroups
      .map(
        (g) => `
        <tr class="grp"><td colspan="7">${weekdayOf(g.dateYMD)}, ${g.displayDate} <span>(${g.rows.length} loại hoa)</span></td></tr>
        ${g.rows
          .map(
            (r, i) => `<tr>
              <td class="c">${i + 1}</td><td class="m">${esc(r.flowerCode)}</td><td>${esc(r.flowerName)}</td>
              <td class="r">${fmt(r.openingStock)}</td><td class="r x">${fmt(r.dailyExport)}</td>
              <td class="r b">${fmt(r.closingStock)}</td><td class="r n">${fmt(r.calculatedImport)}</td></tr>`,
          )
          .join('')}`,
      )
      .join('');

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>BÁO CÁO TỒN NGÀY</title><style>
      @page { size: A4; margin: 12mm 10mm; }
      body { font-family: Arial, sans-serif; font-size: 12px; color: #111827; }
      h1 { text-align: center; font-size: 17px; margin: 0 0 4px; }
      .sub { text-align: center; color: #4b5563; margin-bottom: 10px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #cbd5e1; padding: 5px 6px; }
      th { background: #f1f5f9; }
      .grp td { background: #e2e8f0; font-weight: bold; }
      .grp span { font-weight: normal; color: #475569; }
      .c { text-align: center; } .r { text-align: right; } .m { font-family: monospace; font-weight: bold; }
      .x { color: #be123c; } .b { font-weight: bold; background: #fefce8; } .n { color: #1d4ed8; font-weight: bold; }
    </style></head><body>
      <h1>BÁO CÁO TỒN NGÀY</h1>
      <div class="sub">${fromDate ? formatYMDToDisplay(fromDate) : 'Tất cả'} → ${toDate ? formatYMDToDisplay(toDate) : 'nay'} • Nhập = Tồn cuối + Xuất ngày − Tồn đầu</div>
      <table><thead><tr><th>STT</th><th>Mã hoa</th><th>Tên hoa</th><th>Tồn đầu</th><th>Xuất ngày</th><th>Tồn cuối</th><th>Nhập</th></tr></thead>
      <tbody>${body}</tbody></table>
    </body></html>`);
    doc.close();
    setTimeout(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
      setTimeout(() => document.body.removeChild(frame), 1000);
    }, 300);
  };

  const quickBtn = (r: QuickRange, label: string) => (
    <Button
      size="sm"
      variant={quickRange === r ? 'default' : 'outline'}
      onClick={() => applyQuickRange(r)}
      className="h-8 text-xs px-2.5 cursor-pointer"
    >
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col h-full min-h-0 bg-background p-3 sm:p-4 space-y-3">
      {/* Tiêu đề + lọc ngày */}
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-sm flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-foreground">Tồn Ngày</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chỉ nhập Tồn cuối • Tồn đầu = Tồn cuối hôm trước • Xuất ngày lấy từ Đơn hàng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {quickBtn('today', 'Hôm nay')}
          {quickBtn('7d', '7 ngày')}
          {quickBtn('30d', '30 ngày')}
          {quickBtn('all', 'Tất cả')}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background border border-border text-xs font-semibold">
            <span className="text-muted-foreground">Từ</span>
            <DateInputVN
              value={fromDate}
              onChange={(val) => {
                setFromDate(val);
                setQuickRange('custom');
              }}
            />
            <span className="text-muted-foreground">đến</span>
            <DateInputVN
              value={toDate}
              onChange={(val) => {
                setToDate(val);
                setQuickRange('custom');
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 shrink-0">
        <Kpi label="Số ngày" value={`${grandTotal.dateCount} ngày`} icon={<Calendar size={18} />} tone="muted" />
        <Kpi label="Tổng Tồn đầu" value={fmt(grandTotal.opening)} icon={<RotateCcw size={18} />} tone="muted" />
        <Kpi label="Tổng Xuất ngày" value={fmt(grandTotal.export)} icon={<ShoppingCart size={18} />} tone="rose" />
        <Kpi label="Tổng Tồn cuối" value={fmt(grandTotal.closing)} icon={<ClipboardCheck size={18} />} tone="amber" />
        <Kpi label="Tổng Nhập (tìm ra)" value={fmt(grandTotal.calculatedImport)} icon={<TrendingUp size={18} />} tone="blue" />
      </div>

      {/* Tìm kiếm + thao tác */}
      <div className="p-3 rounded-xl border border-border bg-card shadow-sm flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo mã hoa, tên hoa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Info size={13} className="text-cyan-600 shrink-0" />
          Chỉ hiện hoa có Tồn đầu hoặc Xuất ngày &gt; 0
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={handlePrintPdf} className="h-8 gap-1 text-xs cursor-pointer">
            <Printer size={13} /> <span>In PDF</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportExcel} className="h-8 gap-1 text-xs cursor-pointer">
            <Download size={13} /> <span>Xuất Excel</span>
          </Button>
        </div>
      </div>

      {/* Bảng gom nhóm theo ngày (kiểu AppSheet): 1 bảng, mỗi ngày là 1 dòng tiêu đề nhóm */}
      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-border bg-card shadow-sm">
        {filteredDateGroups.length === 0 ? (
          <div className="py-20 text-center">
            <Package size={32} className="mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm font-semibold text-foreground">Không có dữ liệu tồn ngày</p>
            <p className="text-xs text-muted-foreground mt-1">
              {searchTerm ? 'Không tìm thấy hoa phù hợp.' : 'Không có hoa nào có Tồn đầu hoặc Xuất ngày trong khoảng ngày này.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 text-foreground/80 font-semibold select-none [&_th]:h-9 [&_th]:border-b [&_th]:border-border [&_th]:bg-muted [&_th]:px-3">
              <tr>
                <th className="text-center w-12">STT</th>
                <th className="w-28">Mã hoa</th>
                <th className="min-w-[200px]">Tên hoa</th>
                <th className="text-right w-28">Tồn đầu</th>
                <th className="text-right w-28 text-rose-700 dark:text-rose-400">Xuất ngày</th>
                <th className="text-center w-32 text-amber-800 dark:text-amber-200">Tồn cuối ✎</th>
                <th className="text-right w-28 text-blue-700 dark:text-blue-400">Nhập</th>
                <th className="text-right w-28">Thực nhập NCC</th>
                <th className="text-center w-32">Đối soát NCC</th>
              </tr>
            </thead>
            {filteredDateGroups.map((g) => (
              <tbody key={g.dateYMD}>
                <tr>
                  <td
                    colSpan={9}
                    className="sticky top-9 z-10 px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-border"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          {weekdayOf(g.dateYMD)}, {g.displayDate}
                        </span>
                        {g.isToday && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
                            Hôm nay
                          </span>
                        )}
                        <span className="min-w-6 px-2 py-0.5 rounded-full bg-background border border-border text-[11px] font-bold text-muted-foreground text-center">
                          {g.rows.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-semibold">
                        <span className="text-muted-foreground">
                          Tồn đầu <b className="text-foreground">{fmt(g.subtotal.opening)}</b>
                        </span>
                        <span className="text-rose-600">Xuất -{fmt(g.subtotal.export)}</span>
                        <span className="text-amber-700 dark:text-amber-300">Tồn cuối {fmt(g.subtotal.closing)}</span>
                        <span className="text-blue-600">Nhập +{fmt(g.subtotal.calculatedImport)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
                {g.rows.map((item, idx) => (
                  <DailyStockRow
                    key={item.key}
                    idx={idx}
                    dateYMD={g.dateYMD}
                    item={item}
                    onClosingChange={handleClosingStockChange}
                    onOpenEditOpening={handleOpenEditOpening}
                  />
                ))}
              </tbody>
            ))}
          </table>
        )}
      </div>

      {/* Modal sửa Tồn đầu */}
      {editingOpening && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Điều chỉnh Tồn đầu</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Ngày {formatYMDToDisplay(editingOpening.dateYMD)} • {editingOpening.item.flowerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingOpening(null)}
                className="text-muted-foreground hover:text-foreground text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs">
              <label className="font-semibold text-foreground block mb-1">
                Số lượng Tồn đầu ({editingOpening.item.unit}):
              </label>
              <input
                type="number"
                min="0"
                value={editingOpeningVal}
                onChange={(e) => setEditingOpeningVal(Number(e.target.value) || 0)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveOpening()}
                className="w-full h-9 px-3 text-sm font-semibold rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Bình thường Tồn đầu tự lấy từ Tồn cuối hôm trước. Chỉ sửa khi ngày đầu tiên chưa có số liệu.
              </p>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              {editingOpening.item.isOpeningCustom ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => handleSaveOpening(true)}>
                  Trả về tự động
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingOpening(null)}>
                  Hủy
                </Button>
                <Button type="button" size="sm" onClick={() => handleSaveOpening()} className="font-semibold cursor-pointer">
                  Lưu tồn đầu
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const KPI_TONES = {
  muted: 'border-border bg-card text-foreground [&_.ic]:bg-muted [&_.ic]:text-muted-foreground',
  rose: 'border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 [&_.ic]:bg-rose-100 dark:[&_.ic]:bg-rose-900/60',
  amber: 'border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 [&_.ic]:bg-amber-100 dark:[&_.ic]:bg-amber-900/60',
  blue: 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 [&_.ic]:bg-blue-100 dark:[&_.ic]:bg-blue-900/60',
} as const;

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: keyof typeof KPI_TONES }) {
  return (
    <div className={`p-3 rounded-xl border shadow-sm flex items-center justify-between ${KPI_TONES[tone]}`}>
      <div>
        <div className="text-xs opacity-80">{label}</div>
        <div className="text-lg font-extrabold mt-0.5 tabular-nums">{value}</div>
      </div>
      <div className="ic p-2 rounded-lg">{icon}</div>
    </div>
  );
}
