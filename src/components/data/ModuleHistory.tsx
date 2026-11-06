import { useMemo, useState } from 'react';
import { History } from 'lucide-react';
import { actionLabels, useModuleAuditStore, type AuditModule } from '@/stores/moduleAuditStore';
import { Button } from '@/components/ui/Button';
import { exportToExcel } from '@/lib/export';
import { toast } from 'sonner';

export function ModuleHistory({ module }: { module: AuditModule }) {
  const logs = useModuleAuditStore((state) => state.logs);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const filtered = useMemo(() => logs.filter((log) => {
    const localDate = new Date(log.timestamp);
    const day = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;
    return log.module === module && (!action || log.action === action) && (!date || date === day)
      && `${log.record} ${log.performer} ${log.performerCode} ${log.changes.map((c) => `${c.field} ${c.before} ${c.after}`).join(' ')}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'));
  }), [logs, module, search, action, date]);
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const current = Math.min(page, pages);
  const inputClass = 'h-9 rounded-md border border-border bg-background px-3 text-xs';
  async function exportLogs() {
    try {
      await exportToExcel(filtered.map((log) => ({
        'Thời gian': new Date(log.timestamp).toLocaleString('vi-VN'),
        'Thao tác': actionLabels[log.action], 'Bản ghi': log.record,
        'Người thực hiện': log.performer, 'Mã nhân viên': log.performerCode,
        'Thay đổi': log.changes.map((c) => `${c.field}: ${c.before} → ${c.after}`).join('\n'),
      })), `Lich_su_${module}`);
      toast.success('Đã xuất lịch sử thao tác');
    } catch { toast.error('Không thể xuất lịch sử. Vui lòng thử lại.'); }
  }
  return (
    <section className="flex flex-col flex-1 min-h-0 bg-background" aria-label="Lịch sử thao tác">
      <div className="p-3 sm:p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-2 font-semibold text-sm"><History size={16} /> Lịch sử thao tác <span className="text-muted-foreground">({filtered.length})</span></div>
        <div className="flex flex-wrap gap-2">
          <input aria-label="Tìm lịch sử" placeholder="Tìm mã, tên, nhân viên, nội dung..." className={`${inputClass} flex-1 min-w-48`} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
          <select aria-label="Lọc thao tác" className={inputClass} value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
            <option value="">Tất cả thao tác</option>
            {Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <input type="date" aria-label="Lọc ngày" className={inputClass} value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
          {(search || action || date) && <Button variant="outline" size="sm" onClick={() => { setSearch(''); setAction(''); setDate(''); setPage(1); }}>Xóa lọc</Button>}
          <Button variant="outline" size="sm" disabled={!filtered.length} onClick={exportLogs}>Xuất Excel</Button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4 space-y-2">
        {!filtered.length && <p className="py-12 text-center text-sm text-muted-foreground">{search || action || date ? 'Không có lịch sử phù hợp bộ lọc.' : 'Chưa có lịch sử. Các thay đổi mới sẽ được ghi lại tại đây.'}</p>}
        {filtered.slice((current - 1) * 20, current * 20).map((log) => (
          <details key={log.id} className="rounded-lg border border-border bg-card p-3 text-xs">
            <summary className="cursor-pointer space-y-1 break-words">
              <span className={`font-semibold ${log.action === 'delete' ? 'text-rose-600' : 'text-primary'}`}>{actionLabels[log.action]}</span>{' · '}<span className="font-medium">{log.record}</span>
              <div className="text-muted-foreground mt-1">{new Date(log.timestamp).toLocaleString('vi-VN')} · {log.performer} {log.performerCode && `(${log.performerCode})`}</div>
            </summary>
            <div className="mt-3 border-t border-border pt-2 space-y-2">
              {log.changes.map((change) => <div key={change.field} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-3 break-words">
                <span className="font-medium">{change.field}</span><span className="text-muted-foreground whitespace-pre-wrap">Trước: {change.before}</span><span className="whitespace-pre-wrap">Sau: {change.after}</span>
              </div>)}
            </div>
          </details>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 p-3 border-t border-border text-xs">
        <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>Trước</Button>
        <span>Trang {current}/{pages}</span>
        <Button variant="outline" size="sm" disabled={current === pages} onClick={() => setPage(current + 1)}>Sau</Button>
      </div>
    </section>
  );
}
