import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';
import { ArrowRight, Plus, Save, SquarePen, Trash2, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { Button } from './Button';
import { EmptyState } from './Feedback';

interface SectionProps {
  title: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  variant?: 'primary' | 'default';
  id?: string;
}

/** Khối có tiêu đề in hoa, dùng cả trong form (FormSection) và trang chi tiết (DetailSection). */
export function Section({ title, icon, children, className, variant = 'primary', id }: SectionProps) {
  const primary = variant === 'primary';
  return (
    <div
      id={id}
      className={cn(
        'w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3',
        id && 'scroll-mt-24',
        className,
      )}
    >
      <h4
        className={cn(
          'text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 pb-2 sm:pb-2.5 border-b',
          primary ? 'text-primary font-bold border-primary/20' : 'text-muted-foreground border-border',
        )}
      >
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}

export const FormSection = Section;
export const DetailSection = Section;

/** Lưới 1/2/3 cột trong form. */
export function FormGrid({ children, cols = 2, className }: { children: ReactNode; cols?: 1 | 2 | 3; className?: string }) {
  const base =
    cols === 1 ? 'grid grid-cols-1 gap-4' : cols === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : 'grid grid-cols-1 sm:grid-cols-3 gap-4';
  return <div className={cn(base, className)}>{children}</div>;
}

/** Một cặp nhãn - giá trị trong trang chi tiết. */
export function DetailField({
  label,
  value,
  icon,
  className,
  emptyText = 'Chưa cập nhật',
}: {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  className?: string;
  emptyText?: string;
}) {
  const empty = value == null || value === '';
  return (
    <div className={cn('space-y-1 min-w-0 w-full', className)}>
      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      {empty ? (
        <p className="text-body-sm italic text-muted-foreground/50">{emptyText}</p>
      ) : isValidElement(value) ? (
        <div className="text-body-sm leading-relaxed">{value}</div>
      ) : (
        <p className="text-body-sm text-foreground leading-relaxed">{value}</p>
      )}
    </div>
  );
}

/** Chân form: Hủy | Thêm mới → (hoặc Lưu khi sửa). */
export function FormFooter({
  formId,
  onCancel,
  isLoading = false,
  isEdit = false,
  saveLabel,
  createLabel,
  cancelLabel,
  createIcon,
}: {
  formId: string;
  onCancel: () => void;
  isLoading?: boolean;
  isEdit?: boolean;
  saveLabel?: string;
  createLabel?: string;
  cancelLabel?: string;
  createIcon?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between w-full gap-3">
      <Button variant="outline" onClick={onCancel} className="border-border text-muted-foreground">
        {cancelLabel ?? t('common.cancel')}
      </Button>
      <Button type="submit" form={formId} isLoading={isLoading} className="bg-primary text-white shadow-lg">
        {isEdit ? (
          <>
            <Save className="mr-2 h-4 w-4" /> {saveLabel ?? t('common.save')}
          </>
        ) : (
          <>
            {createIcon ?? <UserPlus className="mr-2 h-4 w-4" />} {createLabel ?? t('common.create')} <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

/** Chân trang chi tiết: Đóng | Sửa, Xóa. */
export function DetailFooter({ onClose, onEdit, onDelete }: { onClose: () => void; onEdit: () => void; onDelete?: () => void }) {
  return (
    <div className="flex items-center justify-between w-full">
      <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground border border-border">
        {t('common.close')}
      </Button>
      <div className="flex items-center gap-3">
        <Button onClick={onEdit} className="bg-primary text-white shadow-lg hover:bg-primary/90">
          <SquarePen size={16} className="mr-2" /> {t('common.edit')}
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            onClick={onDelete}
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
          >
            <Trash2 size={16} className="mr-2" /> {t('common.delete')}
          </Button>
        )}
      </div>
    </div>
  );
}

export interface QuickAction {
  label: string;
  icon: ReactElement<{ size?: number; strokeWidth?: number }>;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'danger' | 'success' | 'warning' | 'info' | 'violet' | 'secondary' | 'ghost';
}

const ACTION_ICON: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-white',
  danger: 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-100 dark:border-rose-900 hover:bg-rose-500 hover:text-white',
  success: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100 dark:border-emerald-900 hover:bg-emerald-500 hover:text-white',
  warning: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 border-amber-100 dark:border-amber-900 hover:bg-amber-500 hover:text-white',
  info: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 border-sky-100 dark:border-sky-900 hover:bg-sky-500 hover:text-white',
  violet: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 border-violet-100 dark:border-violet-900 hover:bg-violet-500 hover:text-white',
  secondary:
    'bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700',
  ghost: 'bg-transparent text-muted-foreground border-transparent hover:bg-muted',
};
const ACTION_TEXT: Record<string, string> = {
  primary: 'text-primary',
  danger: 'text-rose-600 dark:text-rose-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-sky-600 dark:text-sky-400',
  violet: 'text-violet-600 dark:text-violet-400',
  secondary: 'text-slate-600 dark:text-slate-400',
};

/** Hàng nút tròn thao tác nhanh trong trang chi tiết. */
export function QuickActions({ actions, columns, className }: { actions: QuickAction[]; columns?: 2; className?: string }) {
  if (!actions.length) return null;
  return (
    <div className={cn('grid gap-3 p-3.5 min-w-0', columns === 2 ? 'grid-cols-2' : 'grid-cols-3 sm:grid-cols-6', className)}>
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          onClick={a.onClick}
          disabled={a.disabled}
          className={cn(
            'flex flex-col items-center gap-1.5 transition-all outline-none min-w-0 w-full',
            a.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:-translate-y-0.5 active:scale-95',
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm border',
              ACTION_ICON[a.variant ?? ''] ?? 'bg-muted/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground',
            )}
          >
            {cloneElement(a.icon, { size: 16, strokeWidth: 2 })}
          </div>
          <span
            className={cn(
              'text-xs font-medium text-center transition-colors break-words w-full px-1 leading-tight',
              ACTION_TEXT[a.variant ?? ''] ?? 'text-muted-foreground',
            )}
          >
            {a.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Khối có bảng con (tài liệu đính kèm, lịch phỏng vấn...) kèm nút Thêm. */
export function TableSection({
  title,
  icon,
  count,
  addLabel,
  onAdd,
  emptyTitle,
  emptyDescription,
  emptyIcon,
  loading = false,
  loadingText = 'Đang tải...',
  maxTableHeight = '320px',
  className,
  children,
}: {
  title: ReactNode;
  icon?: ReactNode;
  count?: number;
  addLabel?: string;
  onAdd?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  maxTableHeight?: string;
  className?: string;
  children?: ReactNode;
}) {
  const showEmpty = !loading && count !== undefined && count === 0 && !children;
  const showTable = !loading && (children != null || (count !== undefined && count > 0));
  return (
    <div className={cn('w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm space-y-2.5 sm:space-y-3', className)}>
      <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
        <div className="flex items-center gap-2 shrink-0">
          {icon}
          <h4 className="text-xs font-semibold uppercase tracking-wider text-primary font-bold">{title}</h4>
          {count !== undefined && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium tabular-nums bg-primary/10 text-primary border border-primary/20">
              {count}
            </span>
          )}
        </div>
        <div className="flex-1 self-center h-px border-b border-dashed border-border/80 mx-1" aria-hidden />
        {onAdd && addLabel && (
          <Button type="button" size="sm" onClick={onAdd} className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3 shrink-0">
            <Plus size={14} className="mr-1.5" />
            {addLabel}
          </Button>
        )}
      </div>
      {loading && <div className="py-6 text-center text-sm text-muted-foreground">{loadingText}</div>}
      {showEmpty && (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={emptyIcon}
          action={
            onAdd && addLabel ? (
              <Button type="button" size="sm" onClick={onAdd} className="bg-primary text-white hover:bg-primary/90">
                <Plus size={14} className="mr-2" />
                {addLabel}
              </Button>
            ) : undefined
          }
        />
      )}
      {showTable && children != null && (
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <div
            className={cn('overflow-x-auto overflow-y-auto custom-scrollbar', maxTableHeight === '320px' && 'max-h-[320px]')}
            style={maxTableHeight !== '320px' ? { maxHeight: maxTableHeight } : undefined}
          >
            <table className="w-full text-sm text-left border-collapse">{children}</table>
          </div>
        </div>
      )}
    </div>
  );
}

/** Ô tiêu đề cột trong bảng con. */
export const subTh = 'px-4 py-2 font-semibold text-foreground/80 text-xs whitespace-nowrap';
export const subThActions =
  'sticky right-0 z-[2] px-4 py-2 font-semibold text-foreground/80 text-xs text-center w-24 bg-muted border-l border-border min-w-[96px]';
export const subTdActions = 'sticky right-0 z-[1] px-4 py-2.5 text-center bg-card border-l border-border/50';
