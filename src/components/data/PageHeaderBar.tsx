import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Funnel, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { MobileFilterSheet, type FilterGroup } from './MobileFilterSheet';

interface PageHeaderBarProps {
  filters?: ReactNode;
  actions?: ReactNode;
  leadingContent?: ReactNode;
  row2Content?: ReactNode;
  filterGroups?: FilterGroup[];
  activeFilterCount?: number;
  onClearFilters?: () => void;
  onBack?: () => void;
  hideBack?: boolean;
  className?: string;
}

/** Thanh dính đầu trang (Quay lại + nội dung + bộ lọc + thao tác), dùng ở lưới module và trang thống kê. */
export function PageHeaderBar({
  filters,
  actions,
  leadingContent,
  row2Content,
  filterGroups,
  activeFilterCount = 0,
  onClearFilters,
  onBack,
  hideBack = false,
  className,
}: PageHeaderBarProps) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const back = onBack ?? (() => navigate(-1));
  const hasGroups = !!(filterGroups && filterGroups.length > 0);

  return (
    <div className={cn('sticky top-12 md:top-14 z-30 shrink-0 bg-card border-b border-border px-3 sm:px-4 py-2', className)}>
      <div className={cn('sm:hidden flex gap-2', row2Content && 'flex-col')}>
        <div className="flex items-center gap-1.5">
          {!hideBack && (
            <button onClick={back} className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-muted/30 text-muted-foreground active:scale-95 transition-all">
              <ArrowLeft size={15} className="stroke-[2.5px]" />
            </button>
          )}
          {leadingContent && <div className="flex-1 min-w-0">{leadingContent}</div>}
          {hasGroups && (
            <button
              onClick={() => setSheetOpen(true)}
              className={cn(
                'shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border transition-all active:scale-95 relative',
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
          {!leadingContent && <div className="flex-1" />}
          {actions}
        </div>
        {row2Content && <div className="w-full min-w-0">{row2Content}</div>}
      </div>
      {activeFilterCount > 0 && (
        <div className="sm:hidden pt-1.5">
          <button
            onClick={onClearFilters}
            className="h-7 px-2.5 flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-destructive/20 active:scale-95"
          >
            <X size={12} className="stroke-[2.5px]" />
            {t('common.clearFilters', { count: activeFilterCount })}
          </button>
        </div>
      )}
      {hasGroups && <MobileFilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} groups={filterGroups!} onClearAll={onClearFilters} />}
      <div className="hidden sm:flex items-center gap-2">
        {!hideBack && (
          <button
            onClick={back}
            className="shrink-0 h-8 px-2 -ml-1 flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <ArrowLeft size={15} className="stroke-[2.5px]" />
            <span className="text-xs font-medium">{t('common.back')}</span>
          </button>
        )}
        {leadingContent && <div className="flex-1 min-w-0 max-w-md">{leadingContent}</div>}
        {filters && (
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            {filters}
            {activeFilterCount > 0 && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="h-7 px-2 flex items-center gap-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-all border border-destructive/20 hover:border-destructive/30 active:scale-95"
              >
                <X size={11} className="stroke-[2.5px]" />
                {t('common.clearFilters', { count: activeFilterCount })}
              </button>
            )}
          </div>
        )}
        <div className="flex-1" />
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
