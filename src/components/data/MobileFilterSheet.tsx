import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { Check, ChevronDown, Funnel, Search, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { hideZeroCount, type FilterOption } from '@/components/ui/MultiSelectFilter';

export interface FilterGroup {
  key: string;
  label: string;
  icon: LucideIcon;
  options: FilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
}

function GroupBlock({ group, defaultOpen = true }: { group: FilterGroup; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState('');
  const Icon = group.icon;
  const visible = hideZeroCount(
    group.options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase())),
    group.value,
  );
  const allChecked = visible.length > 0 && visible.every((o) => group.value.includes(o.value));
  const toggle = (v: string) => (group.value.includes(v) ? group.onChange(group.value.filter((x) => x !== v)) : group.onChange([...group.value, v]));
  const toggleAll = () => {
    if (allChecked) {
      const remove = new Set(visible.map((o) => o.value));
      group.onChange(group.value.filter((v) => !remove.has(v)));
    } else {
      group.onChange(Array.from(new Set([...group.value, ...visible.map((o) => o.value)])));
    }
  };
  return (
    <div className="border-b border-border last:border-b-0">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 active:bg-muted/40 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon size={16} className={group.value.length > 0 ? 'text-primary' : 'text-muted-foreground'} />
          <span className="text-sm font-semibold text-foreground">{group.label}</span>
          {group.value.length > 0 && (
            <span className="bg-primary/15 text-primary text-caption font-bold px-1.5 py-0.5 rounded-full tabular-nums">{group.value.length}</span>
          )}
        </div>
        <ChevronDown size={16} className={cn('text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 pb-3 space-y-2">
              {group.options.length > 5 && (
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('shared.mobileFilter.searchPlaceholder', { label: group.label.toLowerCase() })}
                    className="w-full h-10 pl-9 pr-3 text-sm bg-muted/40 border border-border rounded-xl placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                </div>
              )}
              {visible.length > 1 && (
                <div className="flex items-center justify-between gap-2">
                  <button type="button" onClick={toggleAll} className="flex-1 flex items-center gap-3 px-2 min-h-[40px] rounded-lg active:bg-muted/40 transition-colors">
                    <div
                      className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                        allChecked ? 'bg-primary border-primary text-white' : 'border-border bg-background',
                      )}
                    >
                      {allChecked && <Check size={13} strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">{t('shared.mobileFilter.selectAll')}</span>
                  </button>
                  <button type="button" onClick={() => group.onChange([])} className="shrink-0 text-sm font-medium text-primary hover:underline py-2 px-2">
                    {t('common.clearSelection')}
                  </button>
                </div>
              )}
              <div className="space-y-0.5">
                {visible.length === 0 ? (
                  <div className="py-3 text-center text-sm text-muted-foreground">{t('shared.mobileFilter.notFound')}</div>
                ) : (
                  visible.map((o) => {
                    const checked = group.value.includes(o.value);
                    const hasCount = o.count !== undefined;
                    const disabled = hasCount && o.count === 0 && !checked;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => !disabled && toggle(o.value)}
                        className={cn(
                          'w-full flex items-center gap-3 px-2 min-h-[44px] rounded-lg transition-colors',
                          disabled ? 'opacity-40' : 'active:bg-muted/40',
                          checked && 'bg-primary/[0.04]',
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                            checked ? 'bg-primary border-primary text-white' : 'border-border bg-background',
                          )}
                        >
                          {checked && <Check size={13} strokeWidth={3} />}
                        </div>
                        <span className={cn('text-sm flex-1 text-left', checked ? 'font-medium text-primary' : 'text-foreground')}>{o.label}</span>
                        {hasCount && (
                          <span className={cn('shrink-0 text-xs font-medium tabular-nums', checked ? 'text-primary/70' : 'text-muted-foreground')}>{o.count}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Bảng lọc trượt từ dưới lên (giao diện mobile). */
export function MobileFilterSheet({ open, onClose, groups, onClearAll }: { open: boolean; onClose: () => void; groups: FilterGroup[]; onClearAll?: () => void }) {
  const activeCount = groups.reduce((sum, g) => sum + g.value.length, 0);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) onClose();
    },
    [onClose],
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60]"
          />
          <motion.div
            key="filter-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={onDragEnd}
            className="fixed bottom-0 inset-x-0 z-[61] bg-card rounded-t-2xl shadow-2xl flex flex-col"
            style={{ maxHeight: '70vh' }}
          >
            <div className="flex justify-center pt-2.5 pb-1 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Funnel size={16} className="text-primary" />
                <span className="text-base font-bold text-foreground">{t('shared.mobileFilter.title')}</span>
                {activeCount > 0 && <span className="bg-primary text-white text-caption font-bold px-2 py-0.5 rounded-full tabular-nums">{activeCount}</span>}
              </div>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted active:bg-muted/70 transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {groups.map((g) => (
                <GroupBlock key={g.key} group={g} defaultOpen={g.value.length > 0} />
              ))}
            </div>
            <div className="shrink-0 border-t border-border bg-card px-4 py-3 flex items-center gap-3 safe-area-bottom">
              {onClearAll && activeCount > 0 && (
                <button
                  onClick={onClearAll}
                  className="h-11 px-4 flex items-center justify-center gap-1.5 text-sm font-medium text-destructive border border-destructive/30 rounded-xl active:bg-destructive/10 transition-colors"
                >
                  {t('shared.mobileFilter.clear')}
                </button>
              )}
              <button onClick={onClose} className="flex-1 h-11 flex items-center justify-center text-sm font-semibold text-white bg-primary rounded-xl active:scale-[0.98] transition-all">
                {t('common.apply')}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
