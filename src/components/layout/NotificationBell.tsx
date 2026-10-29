import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, ChevronRight, ChevronUp, CircleAlert, CircleCheckBig, Info, Trash2, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';
import { useNotificationStore, type AppNotification } from '@/stores/notifications';

const PREVIEW_COUNT = 5;
const TYPE_STYLE = {
  info: { icon: Info, className: 'text-primary bg-primary/10' },
  success: { icon: CircleCheckBig, className: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  warning: { icon: TriangleAlert, className: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
  error: { icon: CircleAlert, className: 'text-rose-600 bg-rose-500/10 dark:text-rose-400' },
};

function NotificationItem({ item, onMarkRead, onRemove }: { item: AppNotification; onMarkRead: (id: string) => void; onRemove: (id: string) => void }) {
  const style = TYPE_STYLE[item.type ?? 'info'];
  const Icon = style.icon;
  const content = (
    <>
      <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', style.className)}>
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn('text-xs leading-tight', item.read ? 'font-medium text-foreground' : 'font-semibold text-primary')}>{item.title}</p>
        <p className={cn('text-xs mt-0.5 line-clamp-2', item.read ? 'text-muted-foreground' : 'text-foreground/80')}>{item.message}</p>
      </div>
    </>
  );
  const onClick = () => {
    if (!item.read) onMarkRead(item.id);
  };
  const cls = cn(
    'flex gap-3 p-3 rounded-xl transition-colors text-left w-full relative',
    item.read ? 'hover:bg-muted/60' : 'bg-primary/10 hover:bg-primary/15 border-l-[3px] border-primary',
  );
  return (
    <motion.li layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -8 }} className="relative group">
      {item.link ? (
        <Link to={item.link} className={cls} onClick={onClick}>
          {content}
        </Link>
      ) : (
        <button type="button" className={cls} onClick={onClick}>
          {content}
        </button>
      )}
      <button
        type="button"
        aria-label={t('notification.remove')}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove(item.id);
        }}
        className="absolute top-2.5 right-2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </motion.li>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { notifications, markAsRead, markAllAsRead, remove, clearAll } = useNotificationStore();
  const unread = notifications.filter((n) => !n.read).length;
  const hasAny = notifications.length > 0;
  const shown = expanded ? notifications : notifications.slice(0, PREVIEW_COUNT);
  const hasMore = notifications.length > PREVIEW_COUNT;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1, maxHeight: expanded ? 560 : 420 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-[min(100vw-2rem,360px)] max-w-full bg-card/95 backdrop-blur-xl rounded-xl shadow-xl border border-border overflow-hidden z-50 flex flex-col"
    >
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-card/80">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{t('notification.title')}</h3>
          {unread > 0 && <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{unread}</span>}
        </div>
        <div className="flex items-center gap-1">
          {hasAny && unread > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
              title={t('notification.markAllRead')}
            >
              <CheckCheck size={16} />
            </button>
          )}
          {hasAny && (
            <button
              type="button"
              onClick={() => {
                clearAll();
                onClose();
              }}
              className="p-2 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title={t('notification.clearAll')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain no-scrollbar">
        {hasAny ? (
          <>
            <ul className="p-2 space-y-0.5">
              <AnimatePresence mode="popLayout">
                {shown.map((n) => (
                  <NotificationItem key={n.id} item={n} onMarkRead={markAsRead} onRemove={remove} />
                ))}
              </AnimatePresence>
            </ul>
            <div className="shrink-0 border-t border-border p-2">
              {hasMore || expanded ? (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                >
                  {t(expanded ? 'notification.collapse' : 'notification.viewAll')}
                  {expanded ? <ChevronUp size={16} /> : <ChevronRight size={16} />}
                </button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <Bell size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">{t('notification.empty')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('notification.emptyHint')}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** Nút chuông + bảng thông báo. */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const unread = useNotificationStore((s) => s.notifications.filter((n) => !n.read).length);

  useLayoutEffect(() => {
    if (!open || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 8, right: Math.max(16, window.innerWidth - r.right) });
  }, [open]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      const panel = document.querySelector('[data-notification-dropdown]');
      if (panel && panel.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={t('nav.notification')}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-9 w-9 md:h-10 md:w-10',
          'flex items-center justify-center rounded-xl',
          'text-muted-foreground hover:bg-muted hover:text-foreground transition-all relative active:scale-95',
          open && 'bg-muted text-foreground',
        )}
      >
        <Bell size={20} strokeWidth={1.8} className="shrink-0" />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-xs font-semibold text-primary-foreground rounded-full shadow-sm ring-2 ring-card"
            aria-hidden
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open &&
        pos &&
        createPortal(
          <AnimatePresence>
            <div data-notification-dropdown className="fixed z-[9999]" style={{ top: pos.top, right: pos.right }}>
              <NotificationPanel onClose={() => setOpen(false)} />
            </div>
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
