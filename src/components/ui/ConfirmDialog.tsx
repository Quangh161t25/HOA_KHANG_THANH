import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Info, Trash2, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConfirmStore } from '@/stores/confirm';
import { Button } from './Button';

/** Hộp thoại xác nhận toàn cục (gọi qua useConfirm()). */
export function ConfirmDialog() {
  const { isOpen, options, close, isLoading, setLoading } = useConfirmStore();
  const { title, message, variant, confirmText, cancelText, onConfirm, onCancel } = options;
  const ref = useRef<HTMLDivElement>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      close();
    } catch {
      setLoading(false);
    }
  };

  const handleCancel = useCallback(() => {
    onCancel?.();
    close();
  }, [onCancel, close]);

  useEffect(() => {
    if (!isOpen) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) handleCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isLoading, handleCancel]);

  const icon =
    variant === 'danger' ? (
      <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
        <Trash2 size={24} />
      </div>
    ) : variant === 'warning' ? (
      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
        <TriangleAlert size={24} />
      </div>
    ) : (
      <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4">
        <Info size={24} />
      </div>
    );

  const confirmCls =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 dark:shadow-rose-950/40'
      : variant === 'warning'
        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 dark:shadow-amber-950/40'
        : 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : handleCancel}
            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
          />
          <motion.div
            ref={ref}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            tabIndex={-1}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className={cn(
              'relative bg-card rounded-xl p-6 w-full shadow-2xl border border-border/40 flex flex-col items-center text-center outline-none',
              'max-w-sm',
            )}
          >
            {icon}
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-foreground mb-2">
              {title}
            </h3>
            <div className="text-sm text-muted-foreground mb-6 leading-relaxed w-full">{message}</div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 border-border text-muted-foreground hover:bg-muted h-11 rounded-lg"
              >
                {cancelText}
              </Button>
              <Button onClick={handleConfirm} isLoading={isLoading} className={`flex-1 h-11 rounded-lg ${confirmCls}`}>
                {confirmText}
              </Button>
            </div>
            {!isLoading && (
              <button
                onClick={handleCancel}
                aria-label="Đóng"
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
