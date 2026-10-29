import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { t } from '@/lib/i18n';

export type DrawerSize = 'sm' | 'md' | 'lg';

export const DRAWER_SIZES: Record<DrawerSize, string> = {
  sm: 'sm:w-[30rem] sm:min-w-[30rem] sm:max-w-[30rem]', // Nhỏ
  md: 'sm:w-[46rem] sm:min-w-[46rem] sm:max-w-[46rem]', // Vừa
  lg: 'sm:w-[76rem] sm:min-w-[62rem] sm:max-w-[95vw]', // Rộng
};

export const DRAWER_WIDTH = DRAWER_SIZES.md;
const STACKED_WIDTH = 'sm:w-[44rem] sm:min-w-[44rem] sm:max-w-[44rem]';
const BASE_Z_BACKDROP = 60;
const BASE_Z_PANEL = 61;

function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < breakpoint : false));
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e: MediaQueryListEvent) => setMobile(e.matches);
    setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return mobile;
}

interface DrawerProps {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
  size?: DrawerSize;
  variant?: 'drawer' | 'modal';
  stackLevel?: number;
}

/** Ngăn kéo trượt từ phải (hoặc hộp thoại giữa màn hình) dùng cho form và trang chi tiết. */
export function Drawer({
  title,
  subtitle,
  icon,
  onClose,
  children,
  footer,
  maxWidthClass,
  size = 'md',
  variant = 'drawer',
  stackLevel = 0,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<Element | null>(null);
  const isMobile = useIsMobile();
  const [currentSize, setCurrentSize] = useState<DrawerSize>(size);
  const isModal = variant === 'modal';
  const fullscreenModal = isModal && isMobile;
  const widthCls = maxWidthClass ?? (isModal ? (stackLevel > 0 ? STACKED_WIDTH : DRAWER_SIZES.md) : DRAWER_SIZES[currentSize]);
  const offset = isModal ? 5 : stackLevel * 2;
  const zBackdrop = BASE_Z_BACKDROP + offset;
  const zPanel = BASE_Z_PANEL + offset;

  useEffect(() => {
    prevFocus.current = document.activeElement;
    return () => {
      const el = prevFocus.current as HTMLElement | null;
      if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const timer = setTimeout(() => panelRef.current?.focus(), 100);
    return () => {
      document.removeEventListener('keydown', onKey);
      clearTimeout(timer);
    };
  }, [onClose]);

  const body = (
    <>
      <div
        className={`flex items-center justify-between gap-4 border-b border-border/60 bg-card/80 backdrop-blur-xl shrink-0 ${!fullscreenModal && isModal ? 'rounded-t-2xl' : ''}`}
        style={{
          paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
          paddingBottom: '0.5rem',
          paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground leading-tight truncate">{title}</h3>
            {subtitle != null &&
              subtitle !== '' &&
              (typeof subtitle === 'string' ? (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
              ) : (
                <div className="mt-0.5 flex items-center min-w-0">{subtitle}</div>
              ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isModal && (
            <div className="hidden sm:flex items-center gap-0.5 bg-muted/80 p-0.5 rounded-lg border border-border/50 text-[11px] font-medium text-muted-foreground">
              <button
                type="button"
                onClick={() => setCurrentSize('sm')}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentSize === 'sm' ? 'bg-card text-primary shadow-xs font-bold' : 'hover:text-foreground'
                }`}
                title="Kích thước nhỏ (gọn)"
              >
                Nhỏ
              </button>
              <button
                type="button"
                onClick={() => setCurrentSize('md')}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentSize === 'md' ? 'bg-card text-primary shadow-xs font-bold' : 'hover:text-foreground'
                }`}
                title="Kích thước vừa"
              >
                Vừa
              </button>
              <button
                type="button"
                onClick={() => setCurrentSize('lg')}
                className={`px-2 py-0.5 rounded transition-all ${
                  currentSize === 'lg' ? 'bg-card text-primary shadow-xs font-bold' : 'hover:text-foreground'
                }`}
                title="Kích thước rộng"
              >
                Rộng
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-90 shrink-0"
          >
            <X size={18} className="stroke-[2.5px]" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-muted/50 p-4 sm:p-5 custom-scrollbar">
        <div className="max-w-4xl mx-auto">{children}</div>
      </div>
      {footer && (
        <div
          className={`bg-card border-t border-border/60 flex flex-col-reverse sm:flex-row items-center gap-3 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)] shrink-0 w-full ${!fullscreenModal && isModal ? 'rounded-b-2xl' : ''}`}
          style={{
            paddingTop: '0.5rem',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'max(0.75rem, env(safe-area-inset-left, 0px))',
            paddingRight: 'max(0.75rem, env(safe-area-inset-right, 0px))',
          }}
        >
          {footer}
        </div>
      )}
    </>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-md"
        style={{ zIndex: zBackdrop }}
      />
      {isModal ? (
        <div
          className={`fixed inset-0 pointer-events-none ${fullscreenModal ? 'flex flex-col' : 'flex items-center justify-center p-4'}`}
          style={{ zIndex: zPanel }}
        >
          <motion.div
            initial={fullscreenModal ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.9, y: 30 }}
            animate={fullscreenModal ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
            exit={fullscreenModal ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`w-full bg-card shadow-ultra flex flex-col pointer-events-auto border border-border/40 outline-none ${fullscreenModal ? 'h-full min-h-[100dvh] max-h-none rounded-none' : `${widthCls} max-h-[90vh] rounded-2xl`}`}
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={typeof title === 'string' ? title : undefined}
            tabIndex={-1}
          >
            {body}
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={`fixed inset-y-0 right-0 w-full ${widthCls} bg-card shadow-ultra flex flex-col h-[100dvh] border-l border-border/40 outline-none`}
          style={{ zIndex: zPanel }}
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={typeof title === 'string' ? title : undefined}
          tabIndex={-1}
        >
          {body}
        </motion.div>
      )}
    </>
  );
}
