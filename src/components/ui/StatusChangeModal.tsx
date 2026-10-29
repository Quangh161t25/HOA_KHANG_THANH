import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { t } from '@/lib/i18n';
import { Button } from './Button';
import { Textarea } from './Input';
import { Select, type SelectOption } from './Select';

/** Hộp thoại "Chuyển trạng thái" (chọn trạng thái + ghi chú) mở từ trang chi tiết. */
export function StatusChangeModal({
  open,
  title,
  statusLabel,
  noteLabel,
  notePlaceholder,
  options,
  initialStatus,
  initialNote = '',
  isPending = false,
  showNote = true,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  statusLabel: string;
  noteLabel?: string;
  notePlaceholder?: string;
  options: SelectOption[];
  initialStatus: string;
  initialNote?: string;
  isPending?: boolean;
  showNote?: boolean;
  onClose: () => void;
  onSubmit: (status: string, note: string | null) => void;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [note, setNote] = useState(initialNote);
  useEffect(() => {
    if (open) {
      setStatus(initialStatus);
      setNote(initialNote);
    }
  }, [open, initialStatus, initialNote]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          onClick={() => !isPending && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card rounded-xl border border-border shadow-xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <button
                type="button"
                onClick={() => !isPending && onClose()}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <Select label={statusLabel} value={status} onChange={setStatus} options={options} searchable={false} dropdownInPortal />
              {showNote && <Textarea label={noteLabel} placeholder={notePlaceholder} value={note} onChange={(e) => setNote(e.target.value)} rows={3} />}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="ghost" onClick={onClose} disabled={isPending} className="border border-border">
                {t('common.cancel')}
              </Button>
              <Button onClick={() => onSubmit(status, note.trim() || null)} disabled={isPending} className="bg-primary text-white">
                {isPending ? t('common.saving') : t('common.confirm')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
