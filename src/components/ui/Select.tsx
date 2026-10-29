import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
  subLabel?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  label?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  error?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  searchable?: boolean;
  renderOption?: (option: SelectOption) => ReactNode;
  renderValue?: (option: SelectOption) => ReactNode;
  triggerClassName?: string;
  dropdownInPortal?: boolean;
}

/** Ô chọn một giá trị, có ô tìm kiếm và nút xóa (combobox của bản gốc). */
export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Chọn một mục...',
  searchPlaceholder = 'Tìm kiếm...',
  error,
  required,
  className,
  disabled = false,
  icon,
  searchable = true,
  renderOption,
  renderValue,
  triggerClassName,
  dropdownInPortal = false,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const measure = () => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxH = 320;
    const below = window.innerHeight - r.bottom;
    const flip = below < Math.min(maxH, 240);
    setRect({ top: flip ? r.top - maxH - 4 : r.bottom + 4, left: r.left, width: r.width });
  };

  useEffect(() => {
    if (open && dropdownInPortal) measure();
  }, [open, dropdownInPortal]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (wrapRef.current?.contains(target)) return;
      if (dropdownInPortal && target.closest?.('[data-combobox-dropdown]')) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [dropdownInPortal]);

  useEffect(() => {
    if (!open || !dropdownInPortal) return;
    const onScroll = (e: Event) => {
      const target = e.target;
      if (target instanceof Element && target.closest('[data-combobox-dropdown]')) return;
      setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [open, dropdownInPortal]);

  const filtered = useMemo(() => {
    if (!searchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q) || (o.subLabel && o.subLabel.toLowerCase().includes(q)));
  }, [options, query, searchable]);

  const selected = options.find((o) => o.value === value);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  const searchBox = searchable && (
    <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          className="w-full pl-9 pr-3 py-2 text-sm text-foreground bg-muted border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          placeholder={searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>
  );

  const optionList = (maxH: string) => (
    <div className={cn('overflow-y-auto custom-scrollbar p-1.5 space-y-1', maxH)}>
      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground flex flex-col items-center">
          <Search size={24} className="mb-2 opacity-20" />
          Không tìm thấy kết quả
        </div>
      ) : (
        filtered.map((o) => (
          <div
            key={o.value}
            className={cn(
              'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm cursor-pointer transition-colors',
              value === o.value ? 'bg-primary/5 text-primary font-medium' : 'text-foreground hover:bg-muted/50',
            )}
            onClick={(e) => {
              e.stopPropagation();
              pick(o.value);
            }}
          >
            <div className="flex flex-col min-w-0 flex-1">
              {renderOption ? (
                renderOption(o)
              ) : (
                <>
                  <span>{o.label}</span>
                  {o.subLabel && <span className="text-xs text-muted-foreground font-normal">{o.subLabel}</span>}
                </>
              )}
            </div>
            {value === o.value && <Check size={16} className="text-primary shrink-0" />}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className={cn('w-full relative', className)} ref={wrapRef}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-foreground">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        role="combobox"
        disabled={disabled}
        className={cn(
          'relative w-full h-10 rounded-lg border border-border bg-background py-2 px-3 text-sm text-foreground ring-offset-background flex items-center justify-between cursor-pointer transition-all duration-200 text-left',
          open ? 'border-primary ring-2 ring-primary/20' : 'hover:border-border/80 focus-within:border-border/80',
          error ? 'border-destructive focus-visible:ring-destructive' : '',
          disabled ? 'opacity-50 cursor-not-allowed bg-muted' : '',
          triggerClassName,
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        <span className={cn('truncate flex-1 min-w-0', !selected && 'text-muted-foreground')}>
          {selected ? (renderValue ? renderValue(selected) : selected.label) : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {selected && !disabled && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              role="button"
              tabIndex={-1}
              aria-hidden
            >
              <X size={14} />
            </div>
          )}
          <ChevronDown size={16} className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </button>
      {error && <p className="text-xs font-medium text-destructive mt-1.5 ml-1">{error}</p>}
      {dropdownInPortal && open && rect
        ? createPortal(
            <AnimatePresence>
              <motion.div
                id={listId}
                role="listbox"
                data-combobox-dropdown
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                style={{ top: rect.top, left: rect.left, width: Math.max(rect.width, 280), maxHeight: 320 }}
              >
                {searchBox}
                {optionList('max-h-[220px]')}
              </motion.div>
            </AnimatePresence>,
            document.body,
          )
        : (
          <AnimatePresence>
            {open && !disabled && !dropdownInPortal && (
              <motion.div
                id={listId}
                role="listbox"
                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
              >
                {searchBox}
                {optionList('max-h-[250px]')}
              </motion.div>
            )}
          </AnimatePresence>
        )}
    </div>
  );
}
