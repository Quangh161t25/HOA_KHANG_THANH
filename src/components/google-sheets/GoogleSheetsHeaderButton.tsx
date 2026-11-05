import { useState } from 'react';
import { FileSpreadsheet, RotateCw } from 'lucide-react';
import { useGoogleSheetsStore } from '@/stores/googleSheetsStore';
import { GoogleSheetsModal } from './GoogleSheetsModal';

export function GoogleSheetsHeaderButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected, isSyncing } = useGoogleSheetsStore();

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Google Sheets"
        title="Quản lý kết nối Google Sheets (HOA_KHANG_THANH)"
        className="h-8 px-2 md:px-2.5 flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all text-xs font-semibold shadow-2xs group cursor-pointer"
      >
        <div className="relative shrink-0 flex items-center justify-center">
          {isSyncing ? (
            <RotateCw size={14} className="animate-spin text-emerald-600" />
          ) : (
            <FileSpreadsheet size={14} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          )}
          {isConnected && !isSyncing && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>
        <span className="hidden lg:inline text-[11px] font-bold tracking-tight">Google Sheets</span>
      </button>

      {isOpen && <GoogleSheetsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />}
    </>
  );
}
