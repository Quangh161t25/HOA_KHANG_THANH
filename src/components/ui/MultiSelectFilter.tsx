import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
  icon?: LucideIcon;
}

/** Ẩn lựa chọn có số lượng 0 (trừ lựa chọn đang được chọn). */
export function hideZeroCount(options: FilterOption[], value: string[]) {
  return options.filter((o) => (o.count === undefined ? true : o.count > 0 || value.includes(o.value)));
}

interface MultiSelectProps {
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  icon?: LucideIcon;
  size?: 'sm' | 'md';
}

function MultiSelect({ options, value, onChange, placeholder = 'Chọn...', label, className, icon: Icon, size = 'sm' }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const toggleAll = () => (value.length === filtered.length ? onChange([]) : onChange(filtered.map((o) => o.value)));
  const hasValue = value.length > 0;
  const firstLabel = hasValue ? options.find((o) => o.value === value[0])?.label : null;
  const extra = value.length - 1;
  const heightCls = size === 'sm' ? 'h-7' : 'h-8';
  const allChecked = value.length === filtered.length && filtered.length > 0;

  return (
    <div className={cn('relative min-w-[140px]', className)} ref={ref}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center justify-between px-2 text-xs border rounded-lg transition-all',
          heightCls,
          open
            ? 'border-primary ring-2 ring-primary/10 bg-background'
            : hasValue
              ? 'border-primary/40 bg-primary/[0.03]'
              : 'border-border bg-background hover:bg-muted/50',
          hasValue ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-1">
          {Icon && <Icon size={12} className={cn('shrink-0', hasValue ? 'text-primary' : 'text-muted-foreground')} />}
          {label && <span className="font-medium text-foreground shrink-0">{label}:</span>}
          {hasValue ? (
            <div className="flex items-center gap-1 min-w-0">
              <span className="truncate text-xs font-medium">{firstLabel}</span>
              {extra > 0 && (
                <span
                  className="shrink-0 bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                  title={value
                    .map((v) => options.find((o) => o.value === v)?.label)
                    .filter(Boolean)
                    .join(', ')}
                >
                  +{extra}
                </span>
              )}
            </div>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {hasValue && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
              className="p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X size={10} />
            </div>
          )}
          <ChevronDown size={11} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute top-full left-0 mt-1 w-full min-w-[200px] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
        >
          <div className="p-1.5 border-b border-border">
            <div className="relative">
              <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                className="w-full pl-7 pr-3 py-1.5 text-xs text-foreground border border-border rounded-lg bg-background placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                placeholder="Tìm kiếm..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1">
            {filtered.length > 0 && (
              <div className="flex items-center justify-between gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground border-b border-border mb-0.5">
                <div className="flex items-center flex-1 min-w-0 hover:bg-muted/50 rounded-lg cursor-pointer py-0.5 -my-0.5 px-1 -mx-1" onClick={toggleAll}>
                  <div
                    className={cn(
                      'w-3.5 h-3.5 rounded border flex items-center justify-center mr-2 transition-colors shrink-0',
                      allChecked ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card',
                    )}
                  >
                    {allChecked && <Check size={9} />}
                  </div>
                  <span className="truncate">{t('common.selectAll')}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange([]);
                  }}
                  className="shrink-0 text-xs font-medium text-primary hover:underline py-0.5 px-1"
                >
                  {t('common.clearSelection')}
                </button>
              </div>
            )}
            {filtered.length === 0 ? (
              <div className="py-3 text-center text-xs text-muted-foreground">Không tìm thấy</div>
            ) : (
              filtered.map((o) => {
                const checked = value.includes(o.value);
                const hasCount = o.count !== undefined;
                const disabled = hasCount && o.count === 0 && !checked;
                const OptIcon = o.icon;
                return (
                  <div
                    key={o.value}
                    onClick={() => !disabled && toggle(o.value)}
                    className={cn(
                      'flex items-center px-2 py-1.5 text-xs rounded-lg transition-colors',
                      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                      checked ? 'bg-primary/5 text-primary' : !disabled && 'text-foreground hover:bg-muted/50',
                    )}
                  >
                    <div
                      className={cn(
                        'w-3.5 h-3.5 rounded border flex items-center justify-center mr-2 transition-colors shrink-0',
                        checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-card',
                      )}
                    >
                      {checked && <Check size={9} />}
                    </div>
                    {OptIcon && <OptIcon size={13} className="mr-1.5 text-muted-foreground" />}
                    <span className="truncate">{o.label}</span>
                    {hasCount && (
                      <span className={cn('ml-auto shrink-0 text-xs font-medium tabular-nums pl-2', checked ? 'text-primary/70' : 'text-muted-foreground')}>
                        {o.count}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {hasValue && (
            <div className="px-2 py-1.5 bg-muted/30 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
              <span className="tabular-nums">
                {value.length} / {options.length} đã chọn
              </span>
              <button onClick={() => setOpen(false)} className="text-primary font-medium hover:underline text-xs">
                Xong
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MultiSelectFilterProps extends Omit<MultiSelectProps, 'label'> {
  hideZeroCount?: boolean;
}

/** Bộ lọc nhiều lựa chọn trên thanh công cụ danh sách. */
export function MultiSelectFilter({ hideZeroCount: hide = true, options, value, className = 'w-full sm:w-[150px]', size = 'sm', ...rest }: MultiSelectFilterProps) {
  return <MultiSelect options={hide ? hideZeroCount(options, value) : options} value={value} className={className} size={size} {...rest} />;
}
