import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Check, Funnel, LayoutTemplate, Plus, Power, Search, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import type { ColumnDef } from '@/stores/createListStore';
import { Tooltip } from '@/components/ui/Tooltip';
import { ColumnSettings } from './ColumnSettings';
import { MobileFilterSheet, type FilterGroup } from './MobileFilterSheet';

interface ListToolbarProps {
  selectedCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onClearSelection: () => void;
  actions?: ReactNode;
  bulkActions?: ReactNode;
  filters?: ReactNode;
  onDeleteMany?: () => void;
  onStatusChangeMany?: (status: 'Đang hoạt động' | 'Ngừng hoạt động') => void;
  columns?: ColumnDef[];
  onToggleColumn?: (id: string) => void;
  onReorderColumns?: (from: number, to: number) => void;
  onResetColumns?: () => void;
  onUpdateColumn?: (id: string, updates: Partial<ColumnDef>) => void;
  showBack?: boolean;
  onBack?: () => void;
  searchPlaceholder?: string;
  hideSearch?: boolean;
  activeFilterCount?: number;
  onClearAllFilters?: () => void;
  filterGroups?: FilterGroup[];
  onAdd?: () => void;
  searchTrailing?: ReactNode;
}

/** Thanh công cụ đầu bảng: Quay lại, tìm kiếm, bộ lọc, chọn cột, Thêm, thao tác hàng loạt. */
export function ListToolbar({
  selectedCount,
  searchTerm,
  onSearchChange,
  onClearSelection,
  actions,
  bulkActions,
  filters,
  onDeleteMany,
  onStatusChangeMany,
  columns,
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
  onUpdateColumn,
  showBack = false,
  onBack,
  searchPlaceholder,
  hideSearch = false,
  activeFilterCount = 0,
  onClearAllFilters,
  filterGroups,
  onAdd,
  searchTrailing,
}: ListToolbarProps) {
  const navigate = useNavigate();
  const placeholder = searchPlaceholder ?? t('common.searchPlaceholder');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const hasSelection = selectedCount > 0;
  const back = onBack ?? (() => navigate(-1));
  const searchRef = useRef<HTMLInputElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (hideSearch) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hideSearch]);

  useEffect(() => {
    if (!columnsOpen) return;
    const onDown = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [columnsOpen]);

  const canConfigureColumns = !!(columns && onToggleColumn);
  const hasFilterGroups = !!(filters && filterGroups && filterGroups.length > 0);
  const mobileIconBtn = 'shrink-0 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center rounded-lg';

  return (
    <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-xl border-b border-border/40 px-3 sm:px-4 py-2 space-y-2 transition-all shrink-0">
      {/* Mobile */}
      <div className="sm:hidden">
        <AnimatePresence mode="wait">
          {hasSelection ? (
            <motion.div key="mobile-bulk" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex items-center gap-1.5">
              <div className="bg-primary text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-primary/20 flex items-center gap-1.5 tabular-nums">
                <Check size={12} className="stroke-[3px]" />
                <span>{selectedCount}</span>
              </div>
              <button onClick={onClearSelection} className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all active:scale-90">
                <X size={14} className="stroke-[2.5px]" />
              </button>
              <div className="flex-1" />
              {onStatusChangeMany && (
                <>
                  <button onClick={() => onStatusChangeMany('Đang hoạt động')} className={`${mobileIconBtn} text-primary bg-primary/10 border border-primary/20 active:scale-95`}>
                    <Check size={14} className="stroke-[2.5px]" />
                  </button>
                  <button onClick={() => onStatusChangeMany('Ngừng hoạt động')} className={`${mobileIconBtn} text-muted-foreground bg-muted/50 border border-border active:scale-95`}>
                    <Power size={14} className="stroke-[2.5px]" />
                  </button>
                </>
              )}
              {onDeleteMany && (
                <button onClick={onDeleteMany} className={`${mobileIconBtn} text-white bg-destructive shadow-sm active:scale-95`}>
                  <Trash2 size={14} className="stroke-[2.5px]" />
                </button>
              )}
              {bulkActions}
            </motion.div>
          ) : (
            <motion.div key="mobile-normal" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex items-center gap-1.5">
              {showBack && (
                <button onClick={back} className={`${mobileIconBtn} border border-border bg-muted/30 text-muted-foreground active:scale-95 transition-all`}>
                  <ArrowLeft size={15} className="stroke-[2.5px]" />
                </button>
              )}
              {hideSearch ? (
                <div className="flex-1 min-w-0" />
              ) : (
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-8 pl-8 pr-7 bg-muted/40 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => onSearchChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground p-0.5 rounded-full">
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
              {searchTrailing}
              {hasFilterGroups && (
                <button
                  onClick={() => setFilterSheetOpen(true)}
                  className={cn(
                    `${mobileIconBtn} border transition-all active:scale-95 relative`,
                    activeFilterCount > 0 ? 'bg-primary/5 border-primary/40 text-primary' : 'bg-background border-border text-muted-foreground',
                  )}
                >
                  <Funnel size={15} />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full tabular-nums">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}
              {onAdd && (
                <button onClick={onAdd} className={`${mobileIconBtn} bg-primary text-white shadow-sm active:scale-95 transition-all`}>
                  <Plus size={16} className="stroke-[2.5px]" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!hasSelection && activeFilterCount > 0 && onClearAllFilters && (
        <div className="sm:hidden pt-1">
          <button
            onClick={onClearAllFilters}
            className="h-7 px-2.5 flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-destructive/20 active:scale-95"
          >
            <X size={12} className="stroke-[2.5px]" />
            {t('common.clearFilters', { count: activeFilterCount })}
          </button>
        </div>
      )}

      {/* Desktop */}
      <div className="hidden sm:flex items-center gap-3">
        <AnimatePresence mode="wait">
          {hasSelection ? (
            <motion.div key="bulk-bar" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex-1 flex items-center gap-2">
              <div className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm shadow-primary/20 flex items-center gap-2 tabular-nums">
                <Check size={13} className="stroke-[3px]" />
                <span>{selectedCount}</span>
                <span className="opacity-70">{t('common.selected')}</span>
              </div>
              <Tooltip content={t('common.deselectAll')}>
                <button
                  onClick={onClearSelection}
                  className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-all active:scale-90"
                >
                  <X size={15} className="stroke-[2.5px]" />
                </button>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div key="search-bar" initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex-1 flex items-center gap-2 min-w-0">
              {showBack && (
                <button
                  onClick={back}
                  className="shrink-0 h-8 px-2 -ml-1 flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
                >
                  <ArrowLeft size={15} className="stroke-[2.5px]" />
                  <span className="text-xs font-medium">{t('common.back')}</span>
                </button>
              )}
              {hideSearch ? (
                <div className="flex-1 max-w-md min-w-0" />
              ) : (
                <div className="relative flex-1 max-w-md min-w-0 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    ref={searchRef}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-8 pl-10 pr-8 bg-muted/40 hover:bg-muted/60 border border-border/60 rounded-lg text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 focus:bg-background transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}
              {searchTrailing}
              {activeFilterCount > 0 && onClearAllFilters && (
                <button
                  onClick={onClearAllFilters}
                  className="shrink-0 h-7 px-2 flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-destructive/20 hover:border-destructive/30 active:scale-95"
                >
                  <X size={11} className="stroke-[2.5px]" />
                  {t('common.clearFilters', { count: activeFilterCount })}
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-1.5 shrink-0">
          <AnimatePresence mode="wait">
            {hasSelection ? (
              <motion.div key="bulk-actions" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-1.5">
                {onStatusChangeMany && (
                  <>
                    <button
                      onClick={() => onStatusChangeMany('Đang hoạt động')}
                      className="h-8 px-3 flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg transition-all border border-primary/20 active:scale-95"
                    >
                      <Check size={14} className="stroke-[2.5px] shrink-0" />
                      <span className="text-xs font-medium">{t('common.activate')}</span>
                    </button>
                    <button
                      onClick={() => onStatusChangeMany('Ngừng hoạt động')}
                      className="h-8 px-3 flex items-center gap-1.5 text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg transition-all border border-border active:scale-95"
                    >
                      <Power size={14} className="stroke-[2.5px] shrink-0" />
                      <span className="text-xs font-medium">{t('common.deactivate')}</span>
                    </button>
                  </>
                )}
                {onDeleteMany && (
                  <button
                    onClick={onDeleteMany}
                    className="h-8 px-3 flex items-center gap-1.5 text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-all shadow-sm active:scale-95"
                  >
                    <Trash2 size={14} className="stroke-[2.5px] shrink-0" />
                    <span className="text-xs font-medium">{t('common.delete')}</span>
                  </button>
                )}
                {bulkActions}
              </motion.div>
            ) : (
              <motion.div key="primary-actions" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-1.5">
                {canConfigureColumns && (
                  <div className="relative" ref={columnsRef}>
                    <Tooltip content={t('common.columnOptions')} placement="bottom" disabled={columnsOpen}>
                      <button
                        onClick={() => setColumnsOpen(!columnsOpen)}
                        className={cn(
                          'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 flex items-center justify-center border rounded-lg transition-all',
                          columnsOpen ? 'bg-primary text-white border-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                      >
                        <LayoutTemplate size={15} />
                      </button>
                    </Tooltip>
                    <AnimatePresence>
                      {columnsOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 bg-card backdrop-blur-xl rounded-xl shadow-xl border border-border z-[41] overflow-hidden"
                        >
                          <ColumnSettings
                            columns={columns!}
                            onToggleColumn={onToggleColumn!}
                            onReorderColumns={onReorderColumns ?? (() => {})}
                            onResetColumns={onResetColumns ?? (() => {})}
                            onUpdateColumn={onUpdateColumn}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {actions}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      {hasSelection ? (
        <div className="hidden sm:block min-h-8" aria-hidden />
      ) : filters ? (
        <div className="hidden sm:flex items-center gap-2 flex-wrap min-h-8">{filters}</div>
      ) : null}
      {hasFilterGroups && <MobileFilterSheet open={filterSheetOpen} onClose={() => setFilterSheetOpen(false)} groups={filterGroups!} onClearAll={onClearAllFilters} />}
    </div>
  );
}
