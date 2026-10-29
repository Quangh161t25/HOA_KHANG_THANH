import { createElement, isValidElement, memo, type ReactNode } from 'react';
import { Layers, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

/** Vòng xoay + chữ "Đang tải..." */
export function Spinner({ text, centered = true, className }: { text: string; centered?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2 text-primary', centered && 'justify-center', className)} role="status" aria-live="polite" aria-label={text}>
      <div className="h-5 w-5 shrink-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" aria-hidden />
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: ReactNode;
  icon?: LucideIcon | ReactNode;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = memo(({ title, description, icon, action, className }: EmptyStateProps) => {
  const heading = title || t('shared.empty.title');
  const iconNode =
    icon == null ? (
      <Layers size={40} className="mb-3 opacity-20" />
    ) : isValidElement(icon) ? (
      icon
    ) : (
      createElement(icon as LucideIcon, { size: 40, className: 'mb-3 opacity-20' })
    );
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-muted-foreground py-8 bg-card rounded-xl border border-dashed border-border',
        className,
      )}
    >
      {iconNode}
      <p className="text-sm text-foreground font-semibold">{heading}</p>
      {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});
EmptyState.displayName = 'EmptyState';
