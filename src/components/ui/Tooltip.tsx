import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: ReactNode;
  placement?: Placement;
  delay?: number;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, placement = 'top', delay = 150, disabled = false, children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; placement: Placement } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const anchor = useRef<HTMLDivElement>(null);

  const compute = useCallback(() => {
    if (!anchor.current) return;
    const r = anchor.current.getBoundingClientRect();
    let p = placement;
    if (p === 'top' && r.top < 40) p = 'bottom';
    if (p === 'bottom' && r.bottom > window.innerHeight - 40) p = 'top';
    if (p === 'left' && r.left < 80) p = 'right';
    if (p === 'right' && r.right > window.innerWidth - 80) p = 'left';
    const gap = 6;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const coords = {
      top: { left: cx, top: r.top - gap },
      bottom: { left: cx, top: r.bottom + gap },
      left: { left: r.left - gap, top: cy },
      right: { left: r.right + gap, top: cy },
    }[p];
    setPos({ ...coords, placement: p });
  }, [placement]);

  const show = useCallback(() => {
    if (disabled) return;
    timer.current = setTimeout(() => {
      if (anchor.current) {
        compute();
        setVisible(true);
      }
    }, delay);
  }, [disabled, delay, compute]);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setVisible(false);
    setPos(null);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (disabled || !content) return <>{children}</>;

  const tip =
    visible && pos ? (
      <div
        role="tooltip"
        className={cn(
          'fixed px-2.5 py-1 rounded-lg pointer-events-none',
          'bg-popover text-popover-foreground text-xs font-medium whitespace-nowrap',
          'shadow-md border border-border/60',
          'transition-all duration-150 ease-out opacity-100 scale-100',
          pos.placement === 'top' && '-translate-y-full -translate-x-1/2',
          pos.placement === 'bottom' && '-translate-x-1/2',
          pos.placement === 'left' && '-translate-x-full -translate-y-1/2',
          pos.placement === 'right' && '-translate-y-1/2',
          className,
        )}
        style={{ zIndex: 9999, left: pos.left, top: pos.top }}
      >
        {content}
      </div>
    ) : null;

  return (
    <>
      <div ref={anchor} className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
        {children}
      </div>
      {tip && createPortal(tip, document.body)}
    </>
  );
}
