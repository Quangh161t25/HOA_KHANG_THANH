import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  AlertTriangle,
  Calendar,
  Check,
  FileText,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Trash2,
  TrendingUp,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  useDebtStore,
  useDistributorStore,
  useFlowerStore,
  useOrderStore,
} from '@/stores/hoaKhangThanhStore';
import type { Flower, Order, OrderItem } from '@/types/hoaKhangThanh';
import { checkCustomerOverdueDebt } from '@/lib/debtCheck';
import { formatDate } from '@/lib/format';

dayjs.extend(customParseFormat);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: Order | null;
}

const CREATORS = [
  'Lê Minh Công',
  'Lê Hoàng Nam',
  'Lê Tuấn Hùng',
  'Nguyễn Văn Khang',
  'Trần Thị Kim Thành',
];

// Component ô nhập số có tự động phân cách hàng nghìn bằng dấu chấm (.)
// Hỗ trợ gợi ý thông minh cho giá tiền: gõ 5 -> gợi ý 5.000, 50.000, 500.000; gõ 34 -> gợi ý 34.000, 340.000, 3.400.000
function FormattedNumberInput({
  value,
  onChange,
  className = '',
  placeholder = '0',
  textColorClass = 'text-foreground',
  allowEmpty = false,
  showPriceSuggestions = false,
  variant = 'default',
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  textColorClass?: string;
  allowEmpty?: boolean;
  showPriceSuggestions?: boolean;
  variant?: 'default' | 'cell';
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  // Hiển thị giá trị
  const displayVal = isFocused
    ? localText
    : value !== undefined && value !== null && value !== 0
    ? value.toLocaleString('vi-VN')
    : allowEmpty && (value === 0 || value === undefined || value === null)
    ? ''
    : value === 0
    ? '0'
    : '';

  // Tính toán danh sách gợi ý giá dựa trên số vừa gõ
  // Gõ 5 -> 5.000, 50.000, 500.000
  // Gõ 34 -> 34.000, 340.000, 3.400.000
  const suggestions = useMemo(() => {
    if (!showPriceSuggestions) return [];
    const rawDigits = localText.replace(/\D/g, '');
    if (!rawDigits) return [];
    const num = parseInt(rawDigits, 10);
    if (!num || num <= 0 || num >= 1000000) return [];

    const list: number[] = [];
    const mults = [1000, 10000, 100000];
    for (const m of mults) {
      const candidate = num * m;
      if (candidate > num && candidate <= 100000000) {
        list.push(candidate);
      }
    }
    return list;
  }, [showPriceSuggestions, localText]);

  // Cập nhật toạ độ fixed khi mở gợi ý
  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const dropdownHeight = 145;
      const spaceBelow = window.innerHeight - rect.bottom;
      const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
      setCoords({
        top: placeAbove ? Math.max(10, rect.top - dropdownHeight - 4) : rect.bottom + 4,
        left: Math.max(10, rect.right - 180),
        width: Math.max(rect.width, 180),
      });
    }
  };

  const handleSelectSuggestion = (suggestedNum: number) => {
    const formatted = suggestedNum.toLocaleString('vi-VN');
    setLocalText(formatted);
    onChange(suggestedNum);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setLocalText('');
      onChange(0);
      setIsOpen(false);
    } else {
      const num = parseInt(raw, 10);
      setLocalText(num.toLocaleString('vi-VN'));
      onChange(num);
      if (showPriceSuggestions && num > 0 && num < 1000000) {
        updateCoords();
        setIsOpen(true);
        setHighlightedIndex(-1);
      } else {
        setIsOpen(false);
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    let currentRaw = 0;
    if (allowEmpty && (value === 0 || !value)) {
      setLocalText('');
    } else {
      setLocalText(value ? value.toLocaleString('vi-VN') : '');
      currentRaw = value || 0;
    }
    e.target.select();

    // Nếu giá trị hiện tại nhỏ (< 1.000) thì tự động hiện gợi ý ngay khi focus
    if (showPriceSuggestions && currentRaw > 0 && currentRaw < 1000) {
      updateCoords();
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.currentTarget.blur();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Đóng gợi ý khi cuộn trang
  useEffect(() => {
    if (!isOpen) return;
    const handleScroll = () => setIsOpen(false);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [isOpen]);

  // Click ra ngoài đóng gợi ý
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const inputBaseClass =
    variant === 'cell'
      ? `w-full h-full min-h-[46px] px-2.5 text-right font-mono font-bold text-xs bg-transparent border-0 rounded-none focus:bg-primary/5 focus:ring-1 focus:ring-inset focus:ring-primary focus:outline-none transition-colors`
      : `w-full h-8 px-2.5 text-right font-mono font-bold text-xs rounded border border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors`;

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayVal}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${inputBaseClass} ${textColorClass} ${className}`}
      />

      {isOpen && coords && suggestions.length > 0 && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            width: coords.width,
            zIndex: 99999,
          }}
          onMouseDown={(e) => e.preventDefault()}
          className="bg-card dark:bg-zinc-900 border border-primary/40 rounded-xl shadow-2xl p-1.5 flex flex-col gap-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="text-[10px] text-muted-foreground px-2 py-0.5 font-semibold flex items-center justify-between border-b border-border/60 pb-1">
            <span className="flex items-center gap-1 text-primary font-bold">
              <Sparkles size={11} className="text-amber-500 fill-amber-500/20" />
              Gợi ý giá:
            </span>
            <span className="text-[9px] text-muted-foreground font-normal">Nhấp để chọn</span>
          </div>
          <div className="flex flex-col gap-0.5">
            {suggestions.map((sug, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const rawNum = parseInt(localText.replace(/\D/g, ''), 10) || 1;
              const multiplierLabel =
                sug === rawNum * 1000
                  ? '× 1.000'
                  : sug === rawNum * 10000
                  ? '× 10.000'
                  : '× 100.000';

              return (
                <button
                  key={sug}
                  type="button"
                  onClick={() => handleSelectSuggestion(sug)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-between ${
                    isHighlighted
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  <span className="text-xs font-extrabold tracking-tight">
                    {sug.toLocaleString('vi-VN')}
                  </span>
                  <span
                    className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${
                      isHighlighted
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    {multiplierLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Component ô chọn ngày với định dạng hiển thị dd/mm/yyyy chuẩn Việt Nam
function DateInputVN({
  value,
  onChange,
}: {
  value: string; // ISO string 'YYYY-MM-DD'
  onChange: (isoDate: string) => void;
}) {
  const [text, setText] = useState(() =>
    value ? (value.includes('-') ? dayjs(value).format('DD/MM/YYYY') : value) : dayjs().format('DD/MM/YYYY')
  );
  const datePickerRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (value) {
      setText(value.includes('-') ? dayjs(value).format('DD/MM/YYYY') : value);
    }
  }, [value]);

  const isoVal = value
    ? value.includes('/')
      ? dayjs(value, 'DD/MM/YYYY').format('YYYY-MM-DD')
      : value
    : dayjs().format('YYYY-MM-DD');

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9/]/g, '');
    if (raw.length === 2 && !raw.includes('/') && !text.endsWith('/')) raw = raw + '/';
    if (raw.length === 5 && raw.split('/').length === 2 && !text.endsWith('/')) raw = raw + '/';
    if (raw.length > 10) raw = raw.slice(0, 10);
    setText(raw);

    if (raw.length === 10) {
      const parsed = dayjs(raw, 'DD/MM/YYYY', true);
      if (parsed.isValid()) {
        onChange(parsed.format('YYYY-MM-DD'));
      }
    }
  };

  const handleBlur = () => {
    const parsed = dayjs(text, 'DD/MM/YYYY', true);
    if (parsed.isValid()) {
      onChange(parsed.format('YYYY-MM-DD'));
    } else {
      setText(value ? (value.includes('-') ? dayjs(value).format('DD/MM/YYYY') : value) : dayjs().format('DD/MM/YYYY'));
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={text}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder="dd/mm/yyyy"
        className="w-full h-8 px-2.5 pr-8 rounded-lg border border-border bg-background text-xs font-mono font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
      />
      <input
        ref={datePickerRef}
        type="date"
        value={isoVal}
        onChange={(e) => {
          if (e.target.value) {
            onChange(e.target.value);
            setText(dayjs(e.target.value).format('DD/MM/YYYY'));
          }
        }}
        className="absolute right-0 top-0 w-8 h-8 opacity-0 cursor-pointer pointer-events-auto"
        tabIndex={-1}
      />
      <Calendar
        size={14}
        onClick={() => {
          try {
            datePickerRef.current?.showPicker();
          } catch {
            datePickerRef.current?.focus();
          }
        }}
        className="absolute right-2.5 top-2.5 cursor-pointer text-muted-foreground hover:text-primary transition-colors pointer-events-none"
      />
    </div>
  );
}

export function DonHangFormModal({ isOpen, onClose, orderToEdit }: Props) {
  const { distributors } = useDistributorStore();
  const { flowers } = useFlowerStore();
  const { orders, addOrder, updateOrder } = useOrderStore();
  const debtRecords = useDebtStore((s) => s.records);

  const [code, setCode] = useState('');
  const [distributorId, setDistributorId] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [isCustomPartner, setIsCustomPartner] = useState(false);
  const [phone, setPhone] = useState('');
  const [creator, setCreator] = useState(CREATORS[0]);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<Order['status']>('nhap');
  const [notes, setNotes] = useState('');

  // Financial fields
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [oldDebt, setOldDebt] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Items
  const [items, setItems] = useState<OrderItem[]>([]);

  // Thanh tìm kiếm nhanh & thêm hoa (Quick Add Bar)
  const [quickSearch, setQuickSearch] = useState('');
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState(false);
  const quickSearchRef = useRef<HTMLDivElement | null>(null);

  // Popover chọn hoa từng dòng (Row Flower Picker với position: fixed)
  const [activeRowIdx, setActiveRowIdx] = useState<number | null>(null);
  const [rowPickerSearch, setRowPickerSearch] = useState('');
  const [rowPickerCoords, setRowPickerCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // 3 Tabs xem mặt hàng: 'tat_ca' (Full cột), 'gia_ban' (Hoa, SL, Giá bán, TT Bán), 'gia_nhap' (Hoa, SL, Giá nhập, TT Nhập)
  const [tableTab, setTableTab] = useState<'tat_ca' | 'gia_ban' | 'gia_nhap'>('tat_ca');

  // Map tồn kho hoa để tra cứu nhanh
  const flowerStockMap = useMemo(() => {
    const map: Record<string, number> = {};
    flowers.forEach((f) => {
      map[f.id] = f.stock;
    });
    return map;
  }, [flowers]);

  // Map tra cứu tên riêng theo flowerId
  const flowerCustomNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    flowers.forEach((f) => {
      if (f.customName) map[f.id] = f.customName;
    });
    return map;
  }, [flowers]);

  // Lọc hoa cho Quick Add (Tối đa đúng 10 gợi ý)
  const quickFilteredFlowers = useMemo(() => {
    const q = quickSearch.toLowerCase().trim();
    const list = !q
      ? flowers
      : flowers.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.code.toLowerCase().includes(q) ||
            (f.customName && f.customName.toLowerCase().includes(q))
        );
    return list.slice(0, 10);
  }, [flowers, quickSearch]);

  // Lọc hoa cho Row Picker (Tối đa đúng 10 gợi ý)
  const rowFilteredFlowers = useMemo(() => {
    const q = rowPickerSearch.toLowerCase().trim();
    const list = !q
      ? flowers
      : flowers.filter(
          (f) =>
            f.name.toLowerCase().includes(q) ||
            f.code.toLowerCase().includes(q) ||
            (f.customName && f.customName.toLowerCase().includes(q))
        );
    return list.slice(0, 10);
  }, [flowers, rowPickerSearch]);

  // Click outside listener for Quick Add Dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickSearchRef.current && !quickSearchRef.current.contains(e.target as Node)) {
        setIsQuickSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDistributor = useMemo(() => {
    return distributors.find((d) => d.id === distributorId);
  }, [distributors, distributorId]);

  useEffect(() => {
    if (orderToEdit) {
      setCode(orderToEdit.code);
      setDistributorId(orderToEdit.distributorId || '');
      setPartnerName(orderToEdit.distributorName || '');
      setIsCustomPartner(!distributors.some((d) => d.id === orderToEdit.distributorId));
      setPhone(orderToEdit.phone || '');
      setCreator(orderToEdit.creator || CREATORS[0]);
      setOrderDate(orderToEdit.orderDate || new Date().toISOString().split('T')[0]);
      setStatus(orderToEdit.status || 'nhap');
      setNotes(orderToEdit.notes || '');
      setShippingFee(orderToEdit.shippingFee || 0);
      setDiscount(orderToEdit.discount || 0);
      const editDist = distributors.find((d) => d.id === orderToEdit.distributorId);
      setOldDebt(
        orderToEdit.oldDebt !== undefined
          ? orderToEdit.oldDebt
          : (editDist?.currentDebt ?? editDist?.oldDebt ?? 0)
      );
      setPaidAmount(orderToEdit.paidAmount || 0);

      const mappedItems: OrderItem[] = (orderToEdit.items || []).map((i) => {
        const fl = flowers.find((f) => f.id === i.flowerId);
        const cost = i.costPrice !== undefined ? i.costPrice : fl?.costPrice || 0;
        const price = i.unitPrice !== undefined ? i.unitPrice : fl?.wholesalePrice || 0;
        const q = i.quantity !== undefined ? i.quantity : 0;
        const importTotal = i.importTotal !== undefined ? i.importTotal : q * cost;
        const amount = i.amount !== undefined ? i.amount : q * price;
        const profit = i.profit !== undefined ? i.profit : amount - importTotal;
        return {
          ...i,
          costPrice: cost,
          unitPrice: price,
          importTotal,
          amount,
          profit,
        };
      });
      setItems(mappedItems);
    } else {
      const year = new Date().getFullYear();
      const num = Math.floor(100 + Math.random() * 900);
      setCode(`DH-${year}-${num}`);

      const firstDist = distributors[0];
      setDistributorId(firstDist?.id || '');
      setPartnerName(firstDist?.name || 'Đại lý Hoa Sỉ');
      setIsCustomPartner(false);
      setPhone(firstDist?.phone || '0903 112 233');
      setCreator(CREATORS[0]);
      setOrderDate(new Date().toISOString().split('T')[0]);
      setStatus('nhap');
      setNotes('');
      setShippingFee(0);
      setDiscount(0);

      // Lấy công nợ hiện tại của đối tác (Running Balance chuẩn xác)
      const partnerDebt = (() => {
        if (!firstDist) return 0;
        const debtRecords = useDebtStore.getState().records;
        const pRecords = debtRecords.filter(
          (r) =>
            r.partnerType === 'npp' &&
            (r.partnerId === firstDist.id ||
              r.partnerName.trim().toLowerCase() === firstDist.name.trim().toLowerCase()),
        );
        let run = firstDist.oldDebt || 0;
        const sorted = [...pRecords].sort((a, b) => a.date.localeCompare(b.date));
        sorted.forEach((r) => {
          const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
          const amt = r.amount !== undefined ? r.amount : (isThu ? (r.decreaseAmount || 0) : (r.increaseAmount || 0));
          run += isThu ? -amt : amt;
        });
        return run;
      })();

      setOldDebt(partnerDebt);
      setPaidAmount(0);

      // THÊM MỚI: ĐỂ TRỐNG Ô NHẬP HOA, SỐ LƯỢNG VÀ GIÁ ĐỂ NGƯỜI DÙNG TỰ NHẬP
      setItems([
        {
          flowerId: '',
          flowerCode: '',
          flowerName: '',
          unit: 'Cành',
          quantity: 0,
          costPrice: 0,
          unitPrice: 0,
          importTotal: 0,
          amount: 0,
          profit: 0,
        },
      ]);
    }
  }, [orderToEdit, isOpen, distributors, flowers]);

  // Kiểm tra công nợ quá hạn 4 ngày theo nguyên tắc FIFO (Đơn cũ nhất trả trước)
  const debtCheck = useMemo(() => {
    return checkCustomerOverdueDebt(
      isCustomPartner ? '' : distributorId,
      partnerName,
      orders,
      orderToEdit?.id,
      orderDate,
      debtRecords,
    );
  }, [isCustomPartner, distributorId, partnerName, orders, orderToEdit, orderDate, debtRecords]);

  const handleDistributorChange = (val: string) => {
    if (val === '__custom__') {
      setIsCustomPartner(true);
      setDistributorId('');
      setPartnerName('');
      setPhone('');
      setOldDebt(0);
    } else {
      setIsCustomPartner(false);
      setDistributorId(val);
      const dist = distributors.find((d) => d.id === val);
      if (dist) {
        setPartnerName(dist.name);
        setPhone(dist.phone);

        // Lấy công nợ hiện tại chuẩn xác nhất của đối tác này theo Running Balance
        const pRecords = debtRecords.filter(
          (r) =>
            r.partnerType === 'npp' &&
            (r.partnerId === dist.id || r.partnerName.trim().toLowerCase() === dist.name.trim().toLowerCase()),
        );
        let run = dist.oldDebt || 0;
        const sorted = [...pRecords].sort((a, b) => a.date.localeCompare(b.date));
        sorted.forEach((r) => {
          const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
          const amt = r.amount !== undefined ? r.amount : (isThu ? (r.decreaseAmount || 0) : (r.increaseAmount || 0));
          run += isThu ? -amt : amt;
        });
        setOldDebt(run);

        // Kiểm tra ngay công nợ quá hạn 4 ngày và thông báo
        const check = checkCustomerOverdueDebt(dist.id, dist.name, orders, orderToEdit?.id, orderDate, debtRecords);
        if (check.hasOverdueUnpaidDebt && check.earliestUnpaidOrder) {
          toast.warning(
            `⚠️ Chưa trả nợ: Khách ${dist.name} có đơn ${check.earliestUnpaidOrder.code} quá 4 ngày chưa thanh toán đủ (còn thiếu ${check.earliestUnpaidOrder.remainingDebt.toLocaleString('vi-VN')})!`,
            { duration: 6000 },
          );
        }
      }
    }
  };

  // Mở popup chọn hoa cho dòng cụ thể (tính toán toạ độ fixed)
  const handleOpenRowPicker = (index: number, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dropdownHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < dropdownHeight ? Math.max(10, rect.top - dropdownHeight) : rect.bottom + 4;
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - 440));

    setRowPickerCoords({ top, left });
    setActiveRowIdx(index);
    setRowPickerSearch('');
  };

  // Chọn hoa cho dòng cụ thể
  const handleSelectRowFlower = (index: number, fl: Flower) => {
    const next = [...items];
    const current = next[index];
    const qty = current?.quantity || 0;
    const cost = current?.costPrice || fl.costPrice || 0;
    const price = current?.unitPrice || fl.wholesalePrice || 0;
    const importTotal = qty * cost;
    const amount = qty * price;
    const profit = amount - importTotal;

    next[index] = {
      flowerId: fl.id,
      flowerCode: fl.code,
      flowerName: fl.name,
      unit: fl.unit || 'Cành',
      quantity: qty,
      costPrice: cost,
      unitPrice: price,
      importTotal,
      amount,
      profit,
    };
    setItems(next);
    setActiveRowIdx(null);
  };

  // Thêm nhanh hoa từ thanh tìm kiếm nhanh
  const handleQuickAddFlower = (fl: Flower) => {
    // Nếu có dòng trống đầu tiên chưa chọn hoa -> điền vào dòng đó
    const emptyRowIdx = items.findIndex((i) => !i.flowerId);
    if (emptyRowIdx >= 0) {
      handleSelectRowFlower(emptyRowIdx, fl);
      toast.success(`Đã chọn ${fl.name}`);
      setQuickSearch('');
      setIsQuickSearchOpen(false);
      return;
    }

    const existingIdx = items.findIndex((i) => i.flowerId === fl.id);
    if (existingIdx >= 0) {
      // Đã có hoa này trong đơn -> tăng thêm số lượng
      const current = items[existingIdx];
      const newQty = (current.quantity || 0) + 50;
      handleQuantityChange(existingIdx, newQty);
      toast.info(`Đã tăng số lượng ${fl.name} lên ${newQty.toLocaleString('vi-VN')}`);
    } else {
      // Thêm mới hoa vào bảng (để trống số lượng cho user tự nhập)
      const qty = 0;
      const cost = fl.costPrice || 0;
      const price = fl.wholesalePrice || 0;
      const importTotal = 0;
      const amount = 0;
      const profit = 0;

      setItems([
        ...items,
        {
          flowerId: fl.id,
          flowerCode: fl.code,
          flowerName: fl.name,
          unit: fl.unit || 'Cành',
          quantity: qty,
          costPrice: cost,
          unitPrice: price,
          importTotal,
          amount,
          profit,
        },
      ]);
      toast.success(`Đã thêm ${fl.name} vào đơn hàng`);
    }
    setQuickSearch('');
    setIsQuickSearchOpen(false);
  };

  const handleQuantityChange = (index: number, qty: number) => {
    const q = Math.max(0, qty || 0);
    const next = [...items];
    const current = next[index];
    const cost = current.costPrice || 0;
    const price = current.unitPrice || 0;
    const importTotal = q * cost;
    const amount = q * price;
    const profit = amount - importTotal;

    next[index] = {
      ...current,
      quantity: q,
      importTotal,
      amount,
      profit,
    };
    setItems(next);
  };

  const handleCostPriceChange = (index: number, cost: number) => {
    const c = Math.max(0, cost || 0);
    const next = [...items];
    const current = next[index];
    const importTotal = (current.quantity || 0) * c;
    const profit = (current.amount || 0) - importTotal;

    next[index] = {
      ...current,
      costPrice: c,
      importTotal,
      profit,
    };
    setItems(next);
  };

  const handleUnitPriceChange = (index: number, price: number) => {
    const p = Math.max(0, price || 0);
    const next = [...items];
    const current = next[index];
    const amount = (current.quantity || 0) * p;
    const profit = amount - (current.importTotal || 0);

    next[index] = {
      ...current,
      unitPrice: p,
      amount,
      profit,
    };
    setItems(next);
  };

  const addItem = () => {
    // Thêm dòng mới hoàn toàn để trống hoa, số lượng, giá
    setItems([
      ...items,
      {
        flowerId: '',
        flowerCode: '',
        flowerName: '',
        unit: 'Cành',
        quantity: 0,
        costPrice: 0,
        unitPrice: 0,
        importTotal: 0,
        amount: 0,
        profit: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Đơn hàng cần có ít nhất 1 dòng mặt hàng');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const totalFlowerQuantity = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const itemsSubtotal = items.reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalCost = items.reduce((sum, i) => sum + (i.importTotal || 0), 0);
  const totalProfitFromItems = items.reduce((sum, i) => sum + (i.profit || 0), 0);
  const totalAmount = Math.max(0, itemsSubtotal + Number(shippingFee || 0) - Number(discount || 0));
  const totalPayment = totalAmount + Number(oldDebt || 0);
  const debtAmount = totalPayment;

  // Format number WITHOUT currency symbol (e.g. 5.000, 14.600.000)
  const formatNumber = (num: number) => {
    return (num || 0).toLocaleString('vi-VN');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.flowerId && i.flowerName);
    const hasZeroQty = validItems.some((i) => (i.quantity || 0) <= 0);
    // Nhắc nhở nếu khách chưa trả nợ đơn hàng quá 4 ngày
    if (debtCheck.hasOverdueUnpaidDebt && debtCheck.earliestUnpaidOrder) {
      const confirmMsg = `⚠️ CẢNH BÁO CÔNG NỢ:\nKhách hàng "${partnerName}" chưa trả nợ đơn hàng quá 4 ngày (${debtCheck.earliestUnpaidOrder.code} còn thiếu ${formatNumber(debtCheck.earliestUnpaidOrder.remainingDebt)}).\n\nBạn có chắc chắn muốn tiếp tục lên đơn hàng mới này không?`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    const payload = {
      code: code.trim() || `DH-${Date.now().toString().slice(-4)}`,
      distributorId: isCustomPartner ? undefined : distributorId,
      distributorName: partnerName.trim() || 'Khách vãng lai',
      phone,
      creator,
      orderDate,
      status,
      items: validItems,
      totalQuantity: totalFlowerQuantity,
      itemsSubtotal,
      shippingFee: Number(shippingFee || 0),
      discount: Number(discount || 0),
      totalAmount,
      oldDebt: Number(oldDebt || 0),
      totalPayment,
      paidAmount: Number(paidAmount || 0),
      debtAmount,
      totalCost,
      totalProfit: totalProfitFromItems,
      notes,
      updatedAt: `${new Date().getDate()}/${new Date().getMonth() + 1}`,
    };

    if (orderToEdit) {
      updateOrder(orderToEdit.id, payload);
      toast.success(`Đã cập nhật đơn hàng ${code}`);
    } else {
      addOrder({
        ...payload,
        paymentStatus: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      });
      toast.success(`Đã tạo thành công đơn hàng ${code}`);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Drawer
        title={orderToEdit ? 'Chỉnh sửa đơn đặt hàng' : 'Thêm mới đơn đặt hàng'}
        subtitle={orderToEdit ? `ID đơn: ${orderToEdit.code}` : 'Lập phiếu bán hoa, tính toán chi phí và công nợ'}
        icon={<ShoppingCart size={18} />}
        maxWidthClass="sm:w-[74rem] sm:min-w-[74rem] sm:max-w-[74rem]"
        size="lg"
        onClose={onClose}
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">
                Tổng tiền: <strong className="text-foreground text-sm font-mono">{formatNumber(totalAmount)}</strong>
              </span>
              <span className="text-muted-foreground border-l border-border pl-4">
                Công nợ cũ: <strong className="font-mono text-amber-600 font-semibold">{formatNumber(oldDebt)}</strong>
              </span>
              <span className="text-muted-foreground border-l border-border pl-4">
                Thanh toán: <strong className="font-mono text-primary text-sm font-extrabold">{formatNumber(totalPayment)}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy bỏ
              </Button>
              <Button type="button" onClick={handleSubmit} className="bg-primary text-primary-foreground font-semibold shadow-sm">
                {orderToEdit ? 'Lưu thay đổi' : 'Tạo đơn hàng'}
              </Button>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* KHỐI THÔNG TIN ĐƠN HÀNG (ERP Header Block) */}
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* ID đơn hàng */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  ID đơn hàng
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="VD: DH-2026-001"
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono font-bold text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Trạng thái đơn */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Trạng thái đơn
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Order['status'])}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-1 focus:ring-primary"
                >
                  <option value="nhap">Nháp (Chờ xác nhận)</option>
                  <option value="da_xac_nhan">Đã xác nhận</option>
                  <option value="dang_giao">Đang giao hàng</option>
                  <option value="hoan_thanh">Hoàn thành</option>
                  <option value="huy">Đã hủy</option>
                </select>
              </div>

              {/* Ngày đặt (Định dạng dd/mm/yyyy) */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Ngày đặt (dd/mm/yyyy)
                </label>
                <DateInputVN value={orderDate} onChange={setOrderDate} />
              </div>

              {/* Người lập đơn */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Người lập đơn
                </label>
                <select
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                >
                  {CREATORS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dòng 2: NPP / Khách hàng & SĐT */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2.5 border-t border-border/50">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  NPP / Khách hàng
                </label>
                {!isCustomPartner ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={distributorId}
                      onChange={(e) => handleDistributorChange(e.target.value)}
                      className="flex-1 h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                    >
                      {distributors.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code} • {d.representative || d.phone})
                        </option>
                      ))}
                      <option value="__custom__">+ Khách hàng khác (Tự nhập tên)...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Nhập tên khách hàng mới..."
                      className="flex-1 h-8 px-2.5 rounded-lg border border-primary/50 bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCustomPartner(false);
                        if (distributors[0]) {
                          setDistributorId(distributors[0].id);
                          setPartnerName(distributors[0].name);
                          setPhone(distributors[0].phone);
                        }
                      }}
                      className="h-8 text-[11px] px-2 text-muted-foreground shrink-0"
                    >
                      Chọn NPP có sẵn
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0903 112 233"
                  className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono text-foreground focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* KHỐI CẢNH BÁO CÔNG NỢ NẾU KHÁCH 4 NGÀY CHƯA THANH TOÁN XONG ĐƠN CŨ */}
            {debtCheck.hasOverdueUnpaidDebt && debtCheck.earliestUnpaidOrder && (
              <div className="mt-3 p-3.5 rounded-xl border-2 border-rose-400 bg-rose-50/95 dark:bg-rose-950/50 text-rose-950 dark:text-rose-100 shadow-sm animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5 shadow-xs">
                    <AlertTriangle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                      <span className="text-xs font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                        ⚠️ Cảnh báo: Khách hàng chưa trả nợ (Đơn quá 4 ngày)
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200 border border-rose-300">
                        {debtCheck.overdueOrders.length} đơn quá hạn ≥ 4 ngày
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed text-rose-800 dark:text-rose-200">
                      Khách hàng <strong className="font-bold underline">{partnerName}</strong> có đơn hàng{' '}
                      <strong className="font-mono font-bold text-rose-950 dark:text-white bg-rose-200/70 dark:bg-rose-900/70 px-1.5 py-0.5 rounded">
                        {debtCheck.earliestUnpaidOrder.code}
                      </strong>{' '}
                      (ngày đặt {formatDate(debtCheck.earliestUnpaidOrder.orderDate)}, cách đây{' '}
                      <strong className="font-bold text-rose-600 dark:text-rose-400">{debtCheck.earliestUnpaidOrder.daysAgo} ngày</strong>) chưa thanh toán đủ.
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-rose-200 dark:border-rose-800/60 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="bg-white/80 dark:bg-black/30 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                        <span className="text-[10px] text-muted-foreground block font-medium">1. Giá trị đơn cũ:</span>
                        <span className="font-mono font-bold text-foreground">
                          {formatNumber(debtCheck.earliestUnpaidOrder.totalAmount)}
                        </span>
                      </div>
                      <div className="bg-white/80 dark:bg-black/30 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                        <span className="text-[10px] text-emerald-600 block font-medium">2. Đã trả phân bổ (FIFO):</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {formatNumber(debtCheck.earliestUnpaidOrder.allocatedPayment)}
                        </span>
                      </div>
                      <div className="bg-rose-100/90 dark:bg-rose-900/40 p-2 rounded-lg border border-rose-300 dark:border-rose-700">
                        <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-bold">3. Còn thiếu (Chưa trả nợ):</span>
                        <span className="font-mono font-black text-rose-700 dark:text-rose-300 text-sm">
                          {formatNumber(debtCheck.earliestUnpaidOrder.remainingDebt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 italic font-medium">
                      * Nhắc nhở: Cần thu tiền đơn cũ trước khi tiếp tục xuất giao đơn hàng mới.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BẢNG CHI TIẾT MẶT HÀNG TRONG ĐƠN (CÁC CỘT RỘNG RÃI, KHÔNG BAO GIỜ BỊ CẮT CHỮ) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Danh sách mặt hàng hoa
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  {formatNumber(totalFlowerQuantity)} hoa • {items.filter((i) => i.flowerId).length} loại
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={addItem}
                className="h-7 gap-1 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
              >
                <Plus size={13} className="stroke-[2.5px]" />
                <span>+ Thêm dòng</span>
              </Button>
            </div>

            {/* THANH TÌM KIẾM NHANH & THÊM HOA VÀO ĐƠN - ĐẶT NGOÀI BẢNG KHÔNG BỊ CLIPPED */}
            <div className="relative" ref={quickSearchRef}>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => {
                    setQuickSearch(e.target.value);
                    setIsQuickSearchOpen(true);
                  }}
                  onFocus={() => setIsQuickSearchOpen(true)}
                  placeholder="🔍 Gõ tên hoặc mã hoa để thêm nhanh (VD: Hồng, Baby, Cúc, HH-DO-01...)"
                  className="w-full h-9 pl-9 pr-8 rounded-xl border border-primary/40 bg-card text-xs font-semibold text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none shadow-xs"
                />
                {quickSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickSearch('');
                      setIsQuickSearchOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Dropdown gợi ý hoa khi tìm kiếm nhanh */}
              {isQuickSearchOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl divide-y divide-border/60">
                  <div className="p-2 text-[11px] font-bold text-muted-foreground bg-muted/60 flex items-center justify-between">
                    <span>Gợi ý hoa ({quickFilteredFlowers.length} loại)</span>
                    <span className="text-[10px] text-primary font-normal">Nhấn để thêm vào đơn</span>
                  </div>
                  {quickFilteredFlowers.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground text-center">
                      Không tìm thấy loại hoa nào phù hợp với "{quickSearch}"
                    </div>
                  ) : (
                    quickFilteredFlowers.map((fl) => (
                      <button
                        type="button"
                        key={fl.id}
                        onClick={() => handleQuickAddFlower(fl)}
                        className="w-full text-left p-2.5 hover:bg-primary/5 flex items-center justify-between gap-3 transition-colors border-b border-border/30 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-foreground font-semibold text-xs flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded font-mono text-primary font-bold bg-primary/10 text-[11px] shrink-0">{fl.code}</span>
                            <span className="text-sm font-bold text-foreground truncate">{fl.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                            <span>
                              Tồn kho: <strong className={fl.stock < 100 ? 'text-amber-600' : 'text-foreground font-mono'}>{formatNumber(fl.stock)}</strong>
                            </span>
                            {fl.customName && (
                              <span className="flex items-center gap-1">
                                <span className="text-muted-foreground/60">•</span>
                                <span className="text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                                  Tên riêng: {fl.customName}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* 3 TABS CHỌN CHẾ ĐỘ XEM: TẤT CẢ, GIÁ BÁN, GIÁ NHẬP */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border shadow-2xs">
                <button
                  type="button"
                  onClick={() => setTableTab('tat_ca')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    tableTab === 'tat_ca'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <span>Tất cả</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      tableTab === 'tat_ca'
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Full cột
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTableTab('gia_ban')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    tableTab === 'gia_ban'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <span>Giá bán</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      tableTab === 'gia_ban'
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Bán & TT Bán
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTableTab('gia_nhap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    tableTab === 'gia_nhap'
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card'
                  }`}
                >
                  <span>Giá nhập</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      tableTab === 'gia_nhap'
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    Nhập & TT Nhập
                  </span>
                </button>
              </div>

              <div className="text-[11px] text-muted-foreground hidden sm:block">
                {tableTab === 'tat_ca' && 'Đang xem: Đầy đủ các cột nhập, bán và lợi nhuận'}
                {tableTab === 'gia_ban' && 'Đang xem: Chỉ hiển thị Giá bán và Thành tiền bán'}
                {tableTab === 'gia_nhap' && 'Đang xem: Chỉ hiển thị Giá nhập và Thành tiền nhập'}
              </div>
            </div>

            {/* BẢNG CÁC MẶT HÀNG HOA ĐÃ CHỌN - CO GIÃN THEO TAB VÀ KẺ KHUNG KẾ TOÁN */}
            <div className="rounded-xl border border-border bg-card overflow-x-auto shadow-sm">
              <table
                className={`w-full text-xs text-left border-collapse border border-border ${
                  tableTab === 'tat_ca' ? 'min-w-[1060px]' : 'min-w-[760px]'
                }`}
              >
                <thead>
                  <tr className="bg-muted/60 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                    <th className="border border-border/80 py-2.5 px-2 text-center w-9 min-w-[36px]">#</th>
                    <th className="border border-border/80 py-2.5 px-3 min-w-[300px]">Mặt hàng (Mã hoa • Tên hoa • Tồn)</th>
                    <th className="border border-border/80 py-2.5 px-2.5 text-right w-28 min-w-[110px] whitespace-nowrap">Số lượng</th>

                    {/* Cột Giá nhập: Hiện ở tab Tất cả & Giá nhập */}
                    {(tableTab === 'tat_ca' || tableTab === 'gia_nhap') && (
                      <th className="border border-border/80 py-2.5 px-2.5 text-right w-32 min-w-[125px] whitespace-nowrap">Giá nhập</th>
                    )}

                    {/* Cột Giá bán: Hiện ở tab Tất cả & Giá bán */}
                    {(tableTab === 'tat_ca' || tableTab === 'gia_ban') && (
                      <th className="border border-border/80 py-2.5 px-2.5 text-right w-32 min-w-[125px] whitespace-nowrap">Giá bán</th>
                    )}

                    {/* Cột TT Nhập: Hiện ở tab Tất cả & Giá nhập */}
                    {(tableTab === 'tat_ca' || tableTab === 'gia_nhap') && (
                      <th className="border border-border/80 py-2.5 px-2.5 text-right w-32 min-w-[120px] whitespace-nowrap">TT Nhập</th>
                    )}

                    {/* Cột TT Bán: Hiện ở tab Tất cả & Giá bán */}
                    {(tableTab === 'tat_ca' || tableTab === 'gia_ban') && (
                      <th className="border border-border/80 py-2.5 px-2.5 text-right w-36 min-w-[130px] whitespace-nowrap">TT Bán</th>
                    )}

                    {/* Cột Lợi nhuận: Chỉ hiện ở tab Tất cả */}
                    {tableTab === 'tat_ca' && (
                      <th className="border border-border/80 py-2.5 px-2.5 text-right w-32 min-w-[120px] whitespace-nowrap">Lợi nhuận</th>
                    )}

                    <th className="border border-border/80 py-2.5 px-2 text-center w-10 min-w-[40px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/15 transition-colors">
                      {/* STT */}
                      <td className="border border-border/70 py-2 px-2 text-center font-mono text-muted-foreground text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Mặt hàng - HIỂN THỊ RÕ RÀNG: TÊN TRÊN, TÊN RIÊNG DƯỚI, BỎ ĐỔI HOA, BỎ KHUNG VIỀN RIÊNG */}
                      <td className="border border-border/70 p-0 min-w-[300px]">
                        {item.flowerId ? (
                          <button
                            type="button"
                            onClick={(e) => handleOpenRowPicker(idx, e)}
                            className="w-full text-left py-2 px-3 hover:bg-muted/30 focus:outline-none focus:bg-primary/5 transition-colors group flex flex-col justify-center min-h-[46px]"
                            title="Bấm vào để chọn lại hoặc đổi hoa"
                          >
                            {/* Tên bên trên: Mã hoa + Tên hoa */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded font-mono text-[10px] font-bold bg-primary/10 text-primary shrink-0">
                                {item.flowerCode}
                              </span>
                              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                                {item.flowerName}
                              </span>
                            </div>

                            {/* Tên riêng xuống dưới: Tên riêng (nổi bật) + Tồn kho */}
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                              {flowerCustomNameMap[item.flowerId] ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded text-[10px]">
                                  <span className="text-muted-foreground font-normal">Tên riêng:</span>
                                  {flowerCustomNameMap[item.flowerId]}
                                </span>
                              ) : null}
                              <span className="text-[10px] text-muted-foreground font-mono">
                                Tồn: <strong className="font-bold text-foreground">{formatNumber(flowerStockMap[item.flowerId] || 0)}</strong>
                              </span>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleOpenRowPicker(idx, e)}
                            className="w-full text-left py-2.5 px-3 hover:bg-primary/5 focus:outline-none transition-colors group flex items-center justify-between gap-2 min-h-[46px]"
                            title="Bấm để chọn mặt hàng hoa"
                          >
                            <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary flex items-center gap-1.5">
                              <Search size={13} className="text-primary/70" />
                              -- Bấm để chọn hoa --
                            </span>
                            <span className="text-[10px] text-primary font-bold px-1.5 py-0.5 rounded bg-primary/10">
                              Chọn hoa ▾
                            </span>
                          </button>
                        )}
                      </td>

                      {/* Số lượng - không khung bao quanh, ô kẻ khung liền mạch */}
                      <td className="border border-border/70 p-0 w-28 min-w-[110px]">
                        <FormattedNumberInput
                          value={item.quantity}
                          onChange={(val) => handleQuantityChange(idx, val)}
                          allowEmpty={true}
                          placeholder="0"
                          variant="cell"
                        />
                      </td>

                      {/* Giá nhập - không khung bao quanh, ô kẻ khung liền mạch */}
                      {(tableTab === 'tat_ca' || tableTab === 'gia_nhap') && (
                        <td className="border border-border/70 p-0 w-32 min-w-[125px]">
                          <FormattedNumberInput
                            value={item.costPrice}
                            onChange={(val) => handleCostPriceChange(idx, val)}
                            textColorClass="text-muted-foreground"
                            allowEmpty={true}
                            placeholder="0"
                            showPriceSuggestions={true}
                            variant="cell"
                          />
                        </td>
                      )}

                      {/* Giá bán - không khung bao quanh, ô kẻ khung liền mạch */}
                      {(tableTab === 'tat_ca' || tableTab === 'gia_ban') && (
                        <td className="border border-border/70 p-0 w-32 min-w-[125px]">
                          <FormattedNumberInput
                            value={item.unitPrice}
                            onChange={(val) => handleUnitPriceChange(idx, val)}
                            textColorClass="text-primary"
                            allowEmpty={true}
                            placeholder="0"
                            showPriceSuggestions={true}
                            variant="cell"
                          />
                        </td>
                      )}

                      {/* TT Nhập (Vốn) có dấu . */}
                      {(tableTab === 'tat_ca' || tableTab === 'gia_nhap') && (
                        <td className="border border-border/70 py-2 px-2.5 text-right font-mono text-muted-foreground text-xs font-medium w-32 min-w-[120px] whitespace-nowrap">
                          {formatNumber(item.importTotal)}
                        </td>
                      )}

                      {/* TT Bán (Doanh thu) có dấu . */}
                      {(tableTab === 'tat_ca' || tableTab === 'gia_ban') && (
                        <td className="border border-border/70 py-2 px-2.5 text-right font-mono font-bold text-primary text-xs w-36 min-w-[130px] whitespace-nowrap">
                          {formatNumber(item.amount)}
                        </td>
                      )}

                      {/* Lợi nhuận có dấu . */}
                      {tableTab === 'tat_ca' && (
                        <td className="border border-border/70 py-2 px-2.5 text-right font-mono font-bold text-xs w-32 min-w-[120px] whitespace-nowrap">
                          <span className={item.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {item.profit >= 0 ? '+' : ''}{formatNumber(item.profit)}
                          </span>
                        </td>
                      )}

                      {/* Thao tác xóa */}
                      <td className="border border-border/70 py-2 px-1 text-center w-10 min-w-[40px]">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 rounded text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Xóa mặt hàng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* BẢNG TỔNG CỘNG HÀNG - KHỚP 100% CỘT THEO TỪNG TAB */}
                <tfoot className="bg-muted/40 font-bold border-t border-border text-xs">
                  {tableTab === 'tat_ca' && (
                    <tr>
                      <td colSpan={2} className="border border-border/70 py-2.5 px-3 text-right text-muted-foreground uppercase text-[11px] whitespace-nowrap">
                        Tổng cộng:
                      </td>
                      <td className="border border-border/70 py-2.5 px-2 text-right font-mono font-extrabold text-foreground whitespace-nowrap">
                        {formatNumber(totalFlowerQuantity)}
                      </td>
                      <td colSpan={2} className="border border-border/70"></td>
                      <td className="border border-border/70 py-2.5 px-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {formatNumber(totalCost)}
                      </td>
                      <td className="border border-border/70 py-2.5 px-2.5 text-right font-mono text-primary text-xs font-extrabold whitespace-nowrap">
                        {formatNumber(itemsSubtotal)}
                      </td>
                      <td className="border border-border/70 py-2.5 px-2.5 text-right font-mono text-emerald-600 font-extrabold whitespace-nowrap">
                        +{formatNumber(totalProfitFromItems)}
                      </td>
                      <td className="border border-border/70"></td>
                    </tr>
                  )}

                  {tableTab === 'gia_ban' && (
                    <tr>
                      <td colSpan={2} className="border border-border/70 py-2.5 px-3 text-right text-muted-foreground uppercase text-[11px] whitespace-nowrap">
                        Tổng cộng:
                      </td>
                      <td className="border border-border/70 py-2.5 px-2 text-right font-mono font-extrabold text-foreground whitespace-nowrap">
                        {formatNumber(totalFlowerQuantity)}
                      </td>
                      <td className="border border-border/70"></td>
                      <td className="border border-border/70 py-2.5 px-2.5 text-right font-mono text-primary text-xs font-extrabold whitespace-nowrap">
                        {formatNumber(itemsSubtotal)}
                      </td>
                      <td className="border border-border/70"></td>
                    </tr>
                  )}

                  {tableTab === 'gia_nhap' && (
                    <tr>
                      <td colSpan={2} className="border border-border/70 py-2.5 px-3 text-right text-muted-foreground uppercase text-[11px] whitespace-nowrap">
                        Tổng cộng:
                      </td>
                      <td className="border border-border/70 py-2.5 px-2 text-right font-mono font-extrabold text-foreground whitespace-nowrap">
                        {formatNumber(totalFlowerQuantity)}
                      </td>
                      <td className="border border-border/70"></td>
                      <td className="border border-border/70 py-2.5 px-2.5 text-right font-mono text-muted-foreground whitespace-nowrap">
                        {formatNumber(totalCost)}
                      </td>
                      <td className="border border-border/70"></td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          </div>

          {/* KHỐI TỔNG KẾT TÀI CHÍNH & THANH TOÁN */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 p-3.5 rounded-xl border border-border bg-card">
            {/* CỘT TRÁI: Ghi chú & Lợi nhuận nội bộ */}
            <div className="space-y-2.5 flex flex-col justify-between">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText size={12} className="text-primary" />
                  Ghi chú đơn hàng
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú giao hàng, xe cộ, yêu cầu đóng thùng..."
                  className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>

              {/* Thẻ phân tích lợi nhuận nội bộ */}
              <div className="p-2.5 rounded-lg bg-muted/30 border border-border/70 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-emerald-600" />
                  Hiệu quả kinh doanh đơn hàng
                </span>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Tổng giá vốn nhập:</span>
                  <strong className="font-mono text-foreground">{formatNumber(totalCost)}</strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Lợi nhuận gộp từ hàng:</span>
                  <strong className="font-mono text-emerald-600 font-bold">+{formatNumber(totalProfitFromItems)}</strong>
                </div>
                <div className="flex items-center justify-between text-muted-foreground border-t border-border/50 pt-1">
                  <span>Tỷ suất lợi nhuận:</span>
                  <strong className="font-mono text-primary font-bold">
                    {itemsSubtotal > 0 ? ((totalProfitFromItems / itemsSubtotal) * 100).toFixed(1) : 0}%
                  </strong>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: Bảng thanh toán chuẩn kế toán (Số nhập có dấu .) */}
            <div className="p-3.5 rounded-lg bg-muted/20 border border-border/80 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block pb-1 border-b border-border/60">
                Chi tiết thanh toán & Công nợ
              </span>

              {/* Thành tiền hàng */}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground font-medium">Thành tiền hàng (1):</span>
                <span className="font-mono font-bold text-foreground text-sm">{formatNumber(itemsSubtotal)}</span>
              </div>

              {/* Cước xe có dấu . */}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <Truck size={12} className="text-primary" />
                  Cước xe (+) (2):
                </span>
                <div className="w-40">
                  <FormattedNumberInput
                    value={shippingFee}
                    onChange={setShippingFee}
                    textColorClass="text-primary"
                    showPriceSuggestions={true}
                  />
                </div>
              </div>

              {/* Trừ hàng có dấu . */}
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground font-medium">
                  Trừ hàng (-) (3):
                  <span className="text-[10px] text-rose-500 block">Khoản trừ cho khách</span>
                </span>
                <div className="w-40">
                  <FormattedNumberInput
                    value={discount}
                    onChange={setDiscount}
                    textColorClass="text-rose-600"
                    showPriceSuggestions={true}
                  />
                </div>
              </div>

              {/* TỔNG TIỀN ĐƠN HÀNG */}
              <div className="flex items-center justify-between py-2 border-t border-border/80 bg-primary/5 px-2.5 rounded-lg">
                <span className="text-primary font-bold text-xs uppercase">
                  Tổng tiền = (1) + (2) - (3):
                </span>
                <span className="font-mono font-extrabold text-primary text-base">
                  {formatNumber(totalAmount)}
                </span>
              </div>

              {/* 1. Công nợ cũ (thay thế Khách đã trả) */}
              <div className="flex items-center justify-between py-1 pt-1.5">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground font-medium">Công nợ cũ:</span>
                    {oldDebt < 0 && (
                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                        Dư: {formatNumber(Math.abs(oldDebt))}
                      </span>
                    )}
                  </div>
                  {selectedDistributor && (
                    <button
                      type="button"
                      onClick={() => {
                        const pRecords = debtRecords.filter(
                          (r) =>
                            r.partnerType === 'npp' &&
                            (r.partnerId === selectedDistributor.id ||
                              r.partnerName.trim().toLowerCase() === selectedDistributor.name.trim().toLowerCase()),
                        );
                        let run = selectedDistributor.oldDebt || 0;
                        const sorted = [...pRecords].sort((a, b) => a.date.localeCompare(b.date));
                        sorted.forEach((r) => {
                          const isThu = r.type === 'thu' || ((r.decreaseAmount || 0) > 0 && (r.increaseAmount || 0) === 0);
                          const amt = r.amount !== undefined ? r.amount : (isThu ? (r.decreaseAmount || 0) : (r.increaseAmount || 0));
                          run += isThu ? -amt : amt;
                        });
                        setOldDebt(run);
                      }}
                      className="text-[10px] text-primary hover:underline font-semibold block mt-0.5"
                      title="Lấy số công nợ hiện tại theo dòng tiền thực tế của NPP"
                    >
                      [Lấy nợ NPP]
                    </button>
                  )}
                </div>
                <div className="w-40">
                  <FormattedNumberInput
                    value={oldDebt}
                    onChange={setOldDebt}
                    textColorClass={oldDebt < 0 ? 'text-emerald-600 dark:text-emerald-400 font-extrabold' : 'text-amber-600 dark:text-amber-400 font-semibold'}
                    showPriceSuggestions={true}
                  />
                </div>
              </div>

              {/* 2. THANH TOÁN (thay thế Tình trạng nợ) */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-primary/40 bg-primary/10 text-primary font-mono font-bold">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider block">THANH TOÁN:</span>
                  <span className="text-[10px] text-muted-foreground font-normal block font-sans">
                    {oldDebt < 0 ? 'Tổng tiền đơn - tiền dư của khách' : 'Tổng tiền đơn + Công nợ cũ'}
                  </span>
                </div>
                <span className="text-base font-extrabold text-primary">
                  {totalPayment < 0 ? `Dư: ${formatNumber(Math.abs(totalPayment))}` : formatNumber(totalPayment)}
                </span>
              </div>
            </div>
          </div>
        </form>
      </Drawer>

      {/* FLOATING ROW FLOWER PICKER (Position: fixed - KHÔNG BAO GIỜ BỊ CLIPPED BỞI OVERFLOW CỦA BẢNG) */}
      {activeRowIdx !== null && (
        <div
          className="fixed inset-0 z-[9999] bg-black/20"
          onClick={() => setActiveRowIdx(null)}
        >
          <div
            style={{
              position: 'fixed',
              top: rowPickerCoords.top,
              left: rowPickerCoords.left,
              width: Math.min(440, window.innerWidth - 32),
            }}
            className="max-h-72 flex flex-col rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header search inside picker */}
            <div className="p-2.5 bg-muted/70 border-b border-border shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={rowPickerSearch}
                  onChange={(e) => setRowPickerSearch(e.target.value)}
                  placeholder="Tìm tên hoặc mã hoa..."
                  className="w-full h-8 pl-8 pr-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* List flowers */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/40">
              {rowFilteredFlowers.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground text-center">
                  Không tìm thấy loại hoa nào phù hợp
                </div>
              ) : (
                rowFilteredFlowers.map((fl) => {
                  const isSelected = fl.id === items[activeRowIdx]?.flowerId;
                  return (
                    <button
                      type="button"
                      key={fl.id}
                      onClick={() => handleSelectRowFlower(activeRowIdx, fl)}
                      className={`w-full text-left p-2.5 hover:bg-primary/10 flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-primary/15 font-bold' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <span className="font-mono text-primary font-bold text-[11px] px-1.5 py-0.5 rounded bg-primary/10 shrink-0">
                            {fl.code}
                          </span>
                          <span className="truncate text-sm font-bold text-foreground">{fl.name}</span>
                          {isSelected && <Check size={14} className="text-primary shrink-0 stroke-[3px] ml-auto" />}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 flex-wrap">
                          <span>
                            Tồn kho: <strong className={fl.stock < 100 ? 'text-amber-600' : 'text-foreground font-mono'}>{formatNumber(fl.stock)}</strong>
                          </span>
                          {fl.customName && (
                            <span className="flex items-center gap-1">
                              <span className="text-muted-foreground/60">•</span>
                              <span className="text-primary font-semibold bg-primary/10 px-1.5 py-0.5 rounded text-[11px]">
                                Tên riêng: {fl.customName}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
