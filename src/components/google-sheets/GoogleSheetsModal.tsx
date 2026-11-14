import { useEffect, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  RotateCw,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { GOOGLE_SHEETS_CONFIG } from '@/config/googleSheetsConfig';
import { useGoogleSheetsStore } from '@/stores/googleSheetsStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const MODULE_SHEETS = [
  { name: 'DON_HANG', label: 'Đơn hàng bán', cols: 17, color: 'bg-blue-500', desc: 'Mã đơn, khách hàng, số lượng hoa, cước xe, tổng tiền, nợ cũ, thanh toán...' },
  { name: 'CHI_TIET_DON_HANG', label: 'Chi tiết hoa từng đơn', cols: 12, color: 'bg-emerald-500', desc: 'Mã hoa, tên hoa, số lượng, giá vốn, giá bán, thành tiền, lợi nhuận...' },
  { name: 'DANH_SACH_HOA', label: 'Danh mục hoa', cols: 7, color: 'bg-rose-500', desc: 'Mã hoa, tên hoa, tên riêng theo người đặt, ĐVT, danh mục, trạng thái...' },
  { name: 'NHA_PHAN_PHOI', label: 'Nhà phân phối', cols: 14, color: 'bg-sky-500', desc: 'Tên NPP, SĐT, địa chỉ, công nợ cũ, tiền mua, đã trả, nợ hiện tại, cảnh báo nợ...' },
  { name: 'NHA_CUNG_CAP', label: 'Nhà cung cấp', cols: 11, color: 'bg-amber-500', desc: 'Tên nhà vườn/NCC, người đại diện, SĐT, vùng trồng, công nợ cũ, tiền nhập...' },
  { name: 'DON_NHAP_NCC', label: 'Đơn nhập hoa', cols: 12, color: 'bg-orange-500', desc: 'Mã đơn nhập, NCC, số lượng hoa, tiền hàng, cước xe, đã trả, còn nợ...' },
  { name: 'CONG_NO', label: 'Sổ công nợ tổng hợp', cols: 10, color: 'bg-purple-500', desc: 'Mã công nợ (ID), ngày ghi, đối tác, loại giao dịch, phát sinh, lũy kế nợ...' },
  { name: 'THU_CHI', label: 'Sổ quỹ thu chi', cols: 9, color: 'bg-emerald-600', desc: 'Mã phiếu, loại thu/chi, số tiền, người nộp/nhận, phương thức...' },
  { name: 'TON_KHO', label: 'Báo cáo tồn kho', cols: 9, color: 'bg-slate-500', desc: 'Mã hoa, tồn đầu kỳ, nhập, xuất, tồn cuối kỳ, cảnh báo tồn, vị trí kho...' },
  { name: 'NHAN_VIEN', label: 'Danh sách nhân sự', cols: 11, color: 'bg-indigo-500', desc: 'Mã NV, họ tên, chức vụ, phòng ban, quyền hạn, SĐT, ngày vào làm, lương...' },
  { name: 'LICH_SU_THAO_TAC', label: 'Nhật ký thao tác', cols: 10, color: 'bg-zinc-500', desc: 'Thời gian, nhân viên thực hiện, thao tác, mã đơn, tóm tắt, chi tiết thay đổi...' },
];

export function GoogleSheetsModal({ isOpen, onClose }: Props) {
  const {
    isConnected,
    isSyncing,
    lastSyncTime,
    autoSync,
    sheetInfo,
    syncLogs,
    checkStatus,
    syncToSheets,
    pullFromSheets,
    setAutoSync,
    clearLogs,
  } = useGoogleSheetsStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'sheets' | 'logs'>('overview');

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen, checkStatus]);

  if (!isOpen) return null;

  return (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <FileSpreadsheet size={15} />
          </div>
          <span className="font-bold text-sm sm:text-base">Google Trang tính (HOA_KHANG_THANH)</span>
        </div>
      }
      subtitle={`Kết nối 2 chiều giữa Web và Google Sheets qua Service Account`}
      icon={<FileSpreadsheet size={18} className="text-emerald-600" />}
      onClose={onClose}
      size="md"
    >
      <div className="p-4 sm:p-5 space-y-4 text-xs">
        {/* Connection Status Card */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-bold text-xs text-emerald-800 dark:text-emerald-300">
                {isConnected ? 'Đang kết nối thành công' : 'Chưa kết nối'}
              </span>
            </div>
            <a
              href={GOOGLE_SHEETS_CONFIG.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <ExternalLink size={12} />
              <span>Mở Google Sheet</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60 text-xs">
            <div>
              <span className="text-muted-foreground block text-[11px]">Tên bảng tính:</span>
              <span className="font-bold text-foreground">{sheetInfo?.title || GOOGLE_SHEETS_CONFIG.title}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Đồng bộ lần cuối:</span>
              <span className="font-mono font-medium text-foreground">{lastSyncTime || 'Chưa đồng bộ'}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground block text-[11px]">Tài khoản dịch vụ (Service Account):</span>
              <span className="font-mono text-[11px] text-muted-foreground select-all break-all">
                {GOOGLE_SHEETS_CONFIG.serviceAccount.clientEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Card */}
        <div className="bg-card border border-border rounded-xl p-3.5 space-y-3">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <span>Thao tác đồng bộ dữ liệu</span>
            {isSyncing && (
              <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold normal-case">
                <RotateCw size={12} className="animate-spin" />
                Đang xử lý...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Sync To Sheets Button */}
            <Button
              type="button"
              disabled={isSyncing}
              onClick={() => syncToSheets(false)}
              className="h-9 gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <ArrowUpCircle size={15} className={isSyncing ? 'animate-spin' : ''} />
              <span>Đồng bộ lên Google Sheets</span>
            </Button>

            {/* Pull From Sheets Button */}
            <Button
              type="button"
              variant="outline"
              disabled={isSyncing}
              onClick={() => pullFromSheets()}
              className="h-9 gap-2 text-xs font-semibold border-border hover:bg-muted"
            >
              <ArrowDownCircle size={15} />
              <span>Tải từ Google Sheets về Web</span>
            </Button>
          </div>

          {/* Auto-sync Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border/70">
            <div className="flex items-center gap-2">
              <Zap size={14} className={autoSync ? 'text-amber-500' : 'text-muted-foreground'} />
              <div>
                <div className="font-semibold text-foreground text-xs">Tự động đồng bộ lên Google Sheets</div>
                <div className="text-[11px] text-muted-foreground">Tự động gửi cập nhật khi thêm, sửa hoặc xóa dữ liệu</div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>
        </div>

        {/* Tab switcher: Danh sách Sheets | Nhật ký đồng bộ */}
        <div className="flex items-center gap-1 border-b border-border/80 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'overview'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Danh sách 11 Sheet ({MODULE_SHEETS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
              activeTab === 'logs'
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>Nhật ký đồng bộ</span>
            {syncLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted font-mono">
                {syncLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Danh sách 11 Sheets */}
        {activeTab === 'overview' && (
          <div className="space-y-2">
            <div className="text-[11px] text-muted-foreground">
              Toàn bộ 11 phân hệ đã được thiết kế sẵn các cột chuẩn kế toán và cố định dòng tiêu đề:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODULE_SHEETS.map((s) => (
                <div
                  key={s.name}
                  className="bg-card border border-border/80 rounded-lg p-2.5 flex items-start gap-2.5 hover:border-border transition-colors shadow-2xs"
                >
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.color}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-foreground font-mono truncate">{s.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 bg-muted px-1.5 py-0.2 rounded">
                        {s.cols} cột
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-foreground/80 mt-0.5">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5" title={s.desc}>
                      {s.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Lịch sử các lần gửi và tải dữ liệu:</span>
              {syncLogs.length > 0 && (
                <button
                  type="button"
                  onClick={clearLogs}
                  className="text-rose-600 hover:text-rose-700 flex items-center gap-1 text-[11px]"
                >
                  <Trash2 size={11} />
                  Xóa nhật ký
                </button>
              )}
            </div>

            {syncLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-xs">
                Chưa có nhật ký đồng bộ nào. Nhấn "Đồng bộ lên Google Sheets" để bắt đầu.
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[300px] overflow-y-auto border border-border rounded-lg bg-card">
                {syncLogs.map((log) => (
                  <div key={log.id} className="p-2.5 text-xs flex items-start gap-2">
                    {log.status === 'success' ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <X size={14} className="text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span className="uppercase font-bold tracking-wider">
                          {log.type === 'push' ? 'Đẩy dữ liệu' : log.type === 'pull' ? 'Tải dữ liệu' : 'Kiểm tra'}
                        </span>
                        <span>{log.time}</span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}
