import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import {
  Camera,
  Check,
  ChevronDown,
  Flower2,
  Plus,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import {
  useFlowerStore,
  useSupplierOrderStore,
  useSupplierStore,
} from '@/stores/hoaKhangThanhStore';
import type { Flower, SupplierOrder, SupplierOrderItem } from '@/types/hoaKhangThanh';
import { ImageOrderReaderModal } from './ImageOrderReaderModal';

dayjs.extend(customParseFormat);

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orderToEdit?: SupplierOrder | null;
  initialItems?: SupplierOrderItem[];
}

const CREATORS = [
  'Lê Minh Công',
  'Lê Hoàng Nam',
  'Lê Tuấn Hùng',
  'Nguyễn Văn Khang',
  'Trần Thị Kim Thành',
];

const WAREHOUSES = [
  'Kho Đà Lạt (Kho tổng)',
  'Kho Chợ hoa Đầm Sen',
  'Kho Hồ Thị Kỷ',
  'Kho Cần Thơ',
];

// Component ô nhập số có tự động phân cách hàng nghìn bằng dấu chấm (.)
// Hỗ trợ gợi ý thông minh cho giá tiền: gõ 5 -> gợi ý 5.000, 50.000, 500.000
function FormattedNumberInput({
  value,
  onChange,
  className = '',
  placeholder = '0',
  textColorClass = 'text-foreground',
  allowEmpty = false,
  showPriceSuggestions = false,
}: {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  textColorClass?: string;
  allowEmpty?: boolean;
  showPriceSuggestions?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [localText, setLocalText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const displayVal = isFocused
    ? localText
    : value !== undefined && value !== null && value !== 0
    ? value.toLocaleString('vi-VN')
    : allowEmpty && (value === 0 || value === undefined || value === null)
    ? ''
    : value === 0
    ? '0'
    : '';

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

  const updateCoords = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 180),
      });
    }
  };

  useEffect(() => {
    if (isOpen && suggestions.length > 0) {
      updateCoords();
      const handleScrollOrResize = () => updateCoords();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, suggestions.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalText(value === 0 ? '' : value ? value.toLocaleString('vi-VN') : '');
    if (showPriceSuggestions && value > 0) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 150);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleanDigits = raw.replace(/\D/g, '');
    if (cleanDigits === '') {
      setLocalText('');
      onChange(0);
      setIsOpen(false);
      return;
    }
    const num = parseInt(cleanDigits, 10);
    if (!isNaN(num)) {
      setLocalText(num.toLocaleString('vi-VN'));
      onChange(num);
      if (showPriceSuggestions && cleanDigits.length >= 1 && cleanDigits.length <= 5) {
        setIsOpen(true);
        setHighlightedIndex(-1);
      } else {
        setIsOpen(false);
      }
    }
  };

  const handleSelectSuggestion = (val: number) => {
    onChange(val);
    setLocalText(val.toLocaleString('vi-VN'));
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayVal}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`${className} ${textColorClass}`}
      />
      {isOpen &&
        suggestions.length > 0 &&
        coords &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              minWidth: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-popover border border-border/80 rounded-lg shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-100 backdrop-blur-md"
          >
            <div className="px-2.5 py-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase flex items-center justify-between border-b border-border/50">
              <span className="flex items-center gap-1 text-primary">
                <Sparkles size={11} className="stroke-[2.5]" />
                Gợi ý giá nhập nhanh
              </span>
              <span className="text-[9px] text-muted-foreground/80">phím ↑ ↓ Enter</span>
            </div>
            {suggestions.map((val, idx) => (
              <button
                key={val}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(val);
                }}
                className={`w-full text-left px-2.5 py-1.5 flex items-center justify-between transition-colors ${
                  idx === highlightedIndex
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'hover:bg-muted/60 text-foreground'
                }`}
              >
                <span className="font-mono font-medium">{val.toLocaleString('vi-VN')}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {val >= 1000000 ? `${val / 1000000} triệu` : `${val / 1000}k`}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

// Component Date input dd/mm/yyyy
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

  const handleBlur = () => {
    const parsed = dayjs(text, ['DD/MM/YYYY', 'D/M/YYYY', 'DD-MM-YYYY', 'D-M-YYYY'], true);
    if (parsed.isValid()) {
      const iso = parsed.format('YYYY-MM-DD');
      onChange(iso);
      setText(parsed.format('DD/MM/YYYY'));
    } else {
      toast.error('Ngày không hợp lệ (định dạng đúng: ngày/tháng/năm, VD: 26/10/2026)');
      setText(value.includes('-') ? dayjs(value).format('DD/MM/YYYY') : value);
    }
  };

  return (
    <div className="relative flex items-center">
      <input
        type="text"
        value={text}
        placeholder="dd/mm/yyyy"
        onChange={(e) => setText(e.target.value)}
        onBlur={handleBlur}
        className="w-full h-8 pl-2.5 pr-8 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary font-medium"
      />
      <button
        type="button"
        onClick={() => datePickerRef.current?.showPicker?.()}
        className="absolute right-2 text-muted-foreground hover:text-foreground p-0.5"
        tabIndex={-1}
      >
        <ChevronDown size={14} />
      </button>
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
        className="sr-only"
        tabIndex={-1}
      />
    </div>
  );
}

export function DonHangNCCFormModal({ isOpen, onClose, orderToEdit, initialItems }: Props) {
  const { suppliers } = useSupplierStore();
  const { flowers } = useFlowerStore();
  const { orders, addOrder, updateOrder } = useSupplierOrderStore();

  // Đọc ảnh ra đơn modal state
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderDate, setOrderDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [deliveryDate, setDeliveryDate] = useState('');
  const [warehouse, setWarehouse] = useState(WAREHOUSES[0]);
  const [creator, setCreator] = useState(CREATORS[0]);
  const [status, setStatus] = useState<SupplierOrder['status']>('nhap');
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // Items State
  const [items, setItems] = useState<SupplierOrderItem[]>([]);

  // Supplier Search dropdown
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  // Initialize or Reset
  useEffect(() => {
    if (!isOpen) return;

    if (orderToEdit) {
      setCode(orderToEdit.code);
      setSupplierId(orderToEdit.supplierId || '');
      setSupplierName(orderToEdit.supplierName);
      setPhone(orderToEdit.phone || '');
      setAddress(orderToEdit.address || '');
      setOrderDate(orderToEdit.orderDate);
      setDeliveryDate(orderToEdit.deliveryDate || '');
      setWarehouse(orderToEdit.warehouse || WAREHOUSES[0]);
      setCreator(orderToEdit.creator || CREATORS[0]);
      setStatus(orderToEdit.status);
      setShippingFee(orderToEdit.shippingFee || 0);
      setDiscount(orderToEdit.discount || 0);
      setPaidAmount(orderToEdit.paidAmount || 0);
      setNotes(orderToEdit.notes || '');
      setImageUrl(orderToEdit.imageUrl);
      setItems(orderToEdit.items || []);
      setSupplierSearch(orderToEdit.supplierName);
    } else {
      // Create new order code
      const nextNum = (orders.length + 1).toString().padStart(3, '0');
      setCode(`PO-NCC-${nextNum}`);

      const firstSup = suppliers[0];
      if (firstSup) {
        setSupplierId(firstSup.id);
        setSupplierName(firstSup.name);
        setPhone(firstSup.phone || '');
        setAddress(firstSup.address || '');
        setSupplierSearch(firstSup.name);
      } else {
        setSupplierId('');
        setSupplierName('');
        setPhone('');
        setAddress('');
        setSupplierSearch('');
      }

      setOrderDate(dayjs().format('YYYY-MM-DD'));
      setDeliveryDate('');
      setWarehouse(WAREHOUSES[0]);
      setCreator(CREATORS[0]);
      setStatus('nhap');
      setShippingFee(0);
      setDiscount(0);
      setPaidAmount(0);
      setNotes('');
      setImageUrl(undefined);

      if (initialItems && initialItems.length > 0) {
        setItems(initialItems);
      } else {
        // Empty row ready for typing or OCR
        setItems([
          {
            flowerId: '',
            flowerCode: '',
            flowerName: '',
            customName: '',
            unit: 'bó',
            quantity: 100,
            costPrice: 0,
            amount: 0,
            notes: '',
          },
        ]);
      }
    }
  }, [isOpen, orderToEdit, orders.length, suppliers, initialItems]);

  // Handle supplier selection
  const handleSelectSupplier = (s: { id: string; name: string; phone?: string; address?: string }) => {
    setSupplierId(s.id);
    setSupplierName(s.name);
    setPhone(s.phone || '');
    setAddress(s.address || '');
    setSupplierSearch(s.name);
    setIsSupplierDropdownOpen(false);
  };

  const filteredSuppliers = useMemo(() => {
    const q = supplierSearch.toLowerCase().trim();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.phone && s.phone.includes(q))
    );
  }, [suppliers, supplierSearch]);

  // Items manipulation
  const handleAddItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        flowerId: '',
        flowerCode: '',
        flowerName: '',
        customName: '',
        unit: 'bó',
        quantity: 100,
        costPrice: 0,
        amount: 0,
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index: number, patch: Partial<SupplierOrderItem>) => {
    setItems((prev) => {
      const next = [...prev];
      const current = next[index];
      const updated = { ...current, ...patch };
      // Recompute amount
      updated.amount = (updated.quantity || 0) * (updated.costPrice || 0);
      next[index] = updated;
      return next;
    });
  };

  const handleFlowerSelect = (index: number, flower: Flower) => {
    setItems((prev) => {
      const next = [...prev];
      const current = next[index];
      const costPrice = flower.costPrice || current.costPrice || 0;
      const quantity = current.quantity || 100;
      next[index] = {
        ...current,
        flowerId: flower.id,
        flowerCode: flower.code,
        flowerName: flower.name,
        customName: flower.customName || flower.name,
        unit: flower.unit || 'bó',
        costPrice,
        amount: quantity * costPrice,
      };
      return next;
    });
  };

  // Callback from ImageOrderReaderModal
  const handleApplyItemsFromOCR = (ocrItems: SupplierOrderItem[]) => {
    if (ocrItems.length === 0) return;
    setItems((prev) => {
      // Filter out empty rows if any
      const nonEmptyPrev = prev.filter((i) => i.flowerName.trim() || i.quantity > 0);
      return [...nonEmptyPrev, ...ocrItems];
    });
    toast.success(`Đã thêm thành công ${ocrItems.length} mặt hàng hoa từ ảnh vào đơn nhập NCC!`);
  };

  // Calculations
  const totalQuantity = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [items]);

  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return Math.max(0, itemsSubtotal + (shippingFee || 0) - (discount || 0));
  }, [itemsSubtotal, shippingFee, discount]);

  const debtAmount = useMemo(() => {
    return Math.max(0, totalAmount - (paidAmount || 0));
  }, [totalAmount, paidAmount]);

  // Submit
  const handleSave = () => {
    const validItems = items.filter((i) => i.flowerName.trim() || i.flowerId);
    const orderData: Omit<SupplierOrder, 'id'> = {
      code: code.trim() || `PO-NCC-${Date.now().toString().slice(-4)}`,
      supplierId: supplierId || undefined,
      supplierName: supplierName.trim() || 'NCC Vãng lai',
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      orderDate,
      deliveryDate: deliveryDate || undefined,
      warehouse,
      creator,
      status,
      paymentStatus: paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid',
      items: validItems,
      totalQuantity,
      itemsSubtotal,
      shippingFee,
      discount,
      totalAmount,
      paidAmount,
      debtAmount,
      notes: notes.trim() || undefined,
      imageUrl,
    };

    if (orderToEdit) {
      updateOrder(orderToEdit.id, orderData);
      toast.success(`Đã cập nhật đơn đặt hàng NCC ${code}`);
    } else {
      addOrder(orderData);
      toast.success(`Đã tạo thành công đơn đặt hàng NCC ${code}`);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">
              {orderToEdit ? `Sửa đơn nhập NCC: ${code}` : 'Thêm mới đơn đặt hàng NCC'}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">
              PO Nhà vườn
            </span>
          </div>
        }
        subtitle="Quản lý chi tiết danh sách hoa đặt từ vườn, cước xe, trừ hàng và công nợ NCC"
        icon={<ShoppingCart size={18} className="text-primary" />}
        size="lg"
        onClose={onClose}
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                Tổng SL hoa:{' '}
                <strong className="text-foreground font-mono">{totalQuantity.toLocaleString('vi-VN')}</strong>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">
                Tổng tiền:{' '}
                <strong className="text-primary font-mono text-sm">{totalAmount.toLocaleString('vi-VN')}</strong>
              </span>
              {debtAmount > 0 && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-rose-600 font-semibold">
                    Còn nợ: {debtAmount.toLocaleString('vi-VN')}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
                Hủy bỏ
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                className="text-xs font-semibold shadow-sm gap-1.5"
              >
                <Check size={14} className="stroke-[2.5]" />
                <span>{orderToEdit ? 'Lưu thay đổi' : 'Tạo đơn đặt NCC'}</span>
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs pb-6">
          {/* BANNER ĐỌC ẢNH RA ĐƠN TỨC THÌ */}
          <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-transparent p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shadow-inner">
                  <Camera size={18} />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                    <span>Đọc ảnh chụp phiếu hoa / tin nhắn Zalo ra đơn</span>
                    <span className="px-1.5 py-0.2 text-[10px] rounded bg-primary/20 text-primary font-bold">
                      OCR AI
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    Tự động nhận diện danh sách tên hoa và số lượng từ phiếu viết tay, hóa đơn hoặc Zalo
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setIsOCRModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-bold shadow bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
              >
                <Sparkles size={13} className="fill-current" />
                <span>📷 Đọc ảnh ra đơn</span>
              </Button>
            </div>
          </div>

          {/* THÔNG TIN CHUNG */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-muted/30 border border-border/70 rounded-xl">
            {/* Mã đơn */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                ID Đơn nhập NCC
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PO-NCC-xxx"
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs font-mono font-bold text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Nhà cung cấp */}
            <div className="relative">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Nhà cung cấp / Vườn hoa
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setSupplierName(e.target.value);
                    setIsSupplierDropdownOpen(true);
                  }}
                  onFocus={() => setIsSupplierDropdownOpen(true)}
                  placeholder="Chọn hoặc gõ tên nhà vườn..."
                  className="w-full h-8 pl-2.5 pr-7 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setIsSupplierDropdownOpen((v) => !v)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {isSupplierDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto py-1">
                  {filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSupplier(s)}
                      className="w-full text-left px-2.5 py-1.5 hover:bg-muted text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-foreground">{s.name}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {s.phone} {s.address ? `• ${s.address}` : ''}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground">{s.code}</span>
                    </button>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <div className="px-2.5 py-2 text-muted-foreground text-center text-xs">
                      Không tìm thấy NCC. Dùng tên "{supplierSearch}" làm nhà vườn mới.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Số điện thoại liên hệ
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0909 123 456"
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Ngày đặt / nhập */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Ngày đặt hàng
              </label>
              <DateInputVN value={orderDate} onChange={setOrderDate} />
            </div>

            {/* Kho nhập */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Kho nhận hàng
              </label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
              >
                {WAREHOUSES.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
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

            {/* Trạng thái đơn */}
            <div>
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Trạng thái đơn
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SupplierOrder['status'])}
                className="w-full h-8 px-2 rounded-lg border border-border bg-background text-xs text-foreground font-semibold focus:ring-1 focus:ring-primary"
              >
                <option value="nhap">Nháp (Chuẩn bị gửi)</option>
                <option value="da_gui_ncc">Đã gửi cho NCC</option>
                <option value="dang_chuyen">Đang chuyển về kho</option>
                <option value="da_nhap_kho">Đã nhập kho đủ</option>
                <option value="huy">Đã hủy</option>
              </select>
            </div>

            {/* Địa chỉ giao */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Địa chỉ nhà vườn / điểm lấy hoa
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="VD: Vạn Thành, Phường 5, TP. Đà Lạt, Lâm Đồng"
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* BẢNG CHI TIẾT MẶT HÀNG HOA */}
          <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-sm">
            <div className="px-3 py-2 bg-muted/40 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flower2 size={15} className="text-primary" />
                <span className="font-semibold text-foreground text-xs">
                  Danh sách hoa đặt từ NCC ({items.length} loại)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOCRModalOpen(true)}
                  className="h-7 text-[11px] gap-1 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-500/10"
                >
                  <Camera size={12} />
                  <span>Đọc từ ảnh</span>
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleAddItemRow}
                  className="h-7 text-[11px] gap-1 font-semibold"
                >
                  <Plus size={13} className="stroke-[2.5]" />
                  <span>Thêm hoa</span>
                </Button>
              </div>
            </div>

            {/* Bảng hoa */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/20 text-muted-foreground text-[11px]">
                    <th className="py-2 px-2 text-center w-10">STT</th>
                    <th className="py-2 px-2 min-w-[200px]">Mặt hàng hoa</th>
                    <th className="py-2 px-2 w-20 text-center">ĐVT</th>
                    <th className="py-2 px-2 w-24 text-right">Số lượng</th>
                    <th className="py-2 px-2 w-32 text-right">Giá nhập</th>
                    <th className="py-2 px-2 w-32 text-right">Thành tiền</th>
                    <th className="py-2 px-2 min-w-[120px]">Ghi chú</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {items.map((item, idx) => (
                    <FlowerRowItem
                      key={idx}
                      index={idx}
                      item={item}
                      flowers={flowers}
                      onUpdate={(patch) => handleUpdateItem(idx, patch)}
                      onSelectFlower={(flower) => handleFlowerSelect(idx, flower)}
                      onRemove={() => handleRemoveItem(idx)}
                    />
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <p>Chưa có mặt hàng hoa nào trong đơn nhập này.</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsOCRModalOpen(true)}
                              className="text-xs gap-1 text-emerald-600"
                            >
                              <Camera size={13} />
                              Đọc từ ảnh hóa đơn / Zalo
                            </Button>
                            <Button
                              type="button"
                              variant="default"
                              size="sm"
                              onClick={handleAddItemRow}
                              className="text-xs gap-1"
                            >
                              <Plus size={13} />
                              Thêm hàng thủ công
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TỔNG KẾT & CÔNG NỢ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ghi chú & ảnh */}
            <div className="p-3 bg-muted/20 border border-border/70 rounded-xl space-y-2">
              <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Ghi chú đơn đặt hàng
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ghi chú về đóng thùng xe, giờ giao, lưu ý chất lượng cành..."
                className="w-full p-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary"
              />
              {imageUrl && (
                <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">Ảnh hóa đơn:</span>
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate max-w-xs"
                  >
                    {imageUrl}
                  </a>
                </div>
              )}
            </div>

            {/* Tính toán tiền tệ */}
            <div className="p-3 bg-muted/30 border border-border/70 rounded-xl space-y-2">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Tổng số lượng hoa:</span>
                <span className="font-mono font-bold text-foreground">
                  {totalQuantity.toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Thành tiền hoa:</span>
                <span className="font-mono font-bold text-foreground">
                  {itemsSubtotal.toLocaleString('vi-VN')}
                </span>
              </div>

              {/* Cước xe */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Truck size={13} /> Cước xe nhà vườn:
                </span>
                <div className="w-36">
                  <FormattedNumberInput
                    value={shippingFee}
                    onChange={setShippingFee}
                    showPriceSuggestions={true}
                    className="w-full h-7 px-2 text-right rounded border border-border bg-background text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Trừ hàng / Chiết khấu */}
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Trừ hàng / Bớt giá:</span>
                <div className="w-36">
                  <FormattedNumberInput
                    value={discount}
                    onChange={setDiscount}
                    showPriceSuggestions={true}
                    className="w-full h-7 px-2 text-right rounded border border-border bg-background text-xs font-mono font-semibold text-rose-600"
                  />
                </div>
              </div>

              {/* Tổng tiền đơn */}
              <div className="flex items-center justify-between py-1.5 border-b border-border/70 bg-primary/5 px-2 rounded-lg">
                <span className="font-bold text-foreground">Tổng tiền đơn nhập:</span>
                <span className="font-mono font-bold text-primary text-sm">
                  {totalAmount.toLocaleString('vi-VN')}
                </span>
              </div>

              {/* Đã trả NCC */}
              <div className="flex items-center justify-between py-1">
                <span className="font-semibold text-emerald-600">Đã trả NCC:</span>
                <div className="w-36">
                  <FormattedNumberInput
                    value={paidAmount}
                    onChange={setPaidAmount}
                    showPriceSuggestions={true}
                    className="w-full h-7 px-2 text-right rounded border border-emerald-300 dark:border-emerald-800 bg-background text-xs font-mono font-bold text-emerald-600"
                  />
                </div>
              </div>

              {/* Còn nợ NCC */}
              <div className="flex items-center justify-between py-1 pt-1.5 border-t border-border/60">
                <span className="font-bold text-rose-600">Còn nợ NCC:</span>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  {debtAmount.toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>

      {/* Modal Đọc ảnh ra đơn bằng OCR */}
      {isOCRModalOpen && (
        <ImageOrderReaderModal
          isOpen={isOCRModalOpen}
          onClose={() => setIsOCRModalOpen(false)}
          onApplyItems={handleApplyItemsFromOCR}
        />
      )}
    </>
  );
}

// Sub-component dòng mặt hàng hoa
function FlowerRowItem({
  index,
  item,
  flowers,
  onUpdate,
  onSelectFlower,
  onRemove,
}: {
  index: number;
  item: SupplierOrderItem;
  flowers: Flower[];
  onUpdate: (patch: Partial<SupplierOrderItem>) => void;
  onSelectFlower: (flower: Flower) => void;
  onRemove: () => void;
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(item.flowerName || item.customName || '');

  const filteredFlowers = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return flowers.slice(0, 10);
    return flowers
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.code.toLowerCase().includes(q) ||
          (f.customName && f.customName.toLowerCase().includes(q))
      )
      .slice(0, 10);
  }, [flowers, searchTerm]);

  return (
    <tr className="hover:bg-muted/30 group">
      <td className="py-1.5 px-2 text-center text-muted-foreground font-mono text-[11px]">
        {index + 1}
      </td>

      {/* Chọn hoa */}
      <td className="py-1.5 px-2 relative">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onUpdate({
                flowerName: e.target.value,
                customName: e.target.value,
              });
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder="Tìm theo tên hoa, mã hoa..."
            className="w-full h-7 px-2 rounded border border-border bg-background text-xs text-foreground focus:ring-1 focus:ring-primary font-medium"
          />
          {item.flowerCode && (
            <span className="absolute right-2 top-1.5 text-[9px] font-mono px-1 bg-muted rounded text-muted-foreground">
              {item.flowerCode}
            </span>
          )}
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full left-2 right-2 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto py-1">
            {filteredFlowers.map((f) => (
              <button
                key={f.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setSearchTerm(f.name);
                  onSelectFlower(f);
                  setIsDropdownOpen(false);
                }}
                className="w-full text-left px-2.5 py-1.5 hover:bg-muted text-xs border-b border-border/30 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground text-xs">{f.name}</span>
                  <span className="text-[9px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{f.code}</span>
                </div>
                {f.customName && f.customName !== f.name && (
                  <div className="text-[10px] text-primary font-medium mt-0.5">
                    Tên riêng: {f.customName}
                  </div>
                )}
              </button>
            ))}
            {filteredFlowers.length === 0 && (
              <div className="px-2.5 py-1.5 text-muted-foreground text-center text-xs">
                Hoa mới (chưa có trong danh mục)
              </div>
            )}
          </div>
        )}
      </td>

      {/* Đơn vị tính */}
      <td className="py-1.5 px-2">
        <input
          type="text"
          value={item.unit}
          onChange={(e) => onUpdate({ unit: e.target.value })}
          placeholder="bó"
          className="w-full h-7 px-1.5 text-center rounded border border-border bg-background text-xs"
        />
      </td>

      {/* Số lượng */}
      <td className="py-1.5 px-2">
        <FormattedNumberInput
          value={item.quantity}
          onChange={(val) => onUpdate({ quantity: val })}
          className="w-full h-7 px-1.5 text-right font-mono font-semibold rounded border border-border bg-background text-xs"
        />
      </td>

      {/* Giá nhập */}
      <td className="py-1.5 px-2">
        <FormattedNumberInput
          value={item.costPrice}
          onChange={(val) => onUpdate({ costPrice: val })}
          showPriceSuggestions={true}
          className="w-full h-7 px-1.5 text-right font-mono rounded border border-border bg-background text-xs"
        />
      </td>

      {/* Thành tiền */}
      <td className="py-1.5 px-2 text-right font-mono font-bold text-foreground">
        {(item.amount || 0).toLocaleString('vi-VN')}
      </td>

      {/* Ghi chú */}
      <td className="py-1.5 px-2">
        <input
          type="text"
          value={item.notes || ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Đóng thùng, loại 1..."
          className="w-full h-7 px-2 rounded border border-border bg-background text-xs text-muted-foreground"
        />
      </td>

      {/* Xóa dòng */}
      <td className="py-1.5 px-2 text-center">
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-muted-foreground hover:text-rose-600 transition-colors rounded"
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}
