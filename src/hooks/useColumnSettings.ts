import { useState, useEffect, useCallback } from 'react';
import type { ColumnDef } from '@/stores/createListStore';

/**
 * Hook quản lý tùy chỉnh cột dùng chung cho tất cả các module:
 * - Ẩn / hiện cột (visible)
 * - Căn lề (align: 'left' | 'center' | 'right')
 * - Xuống dòng (wrap: boolean)
 * - Ghim cột cố định (pinned: boolean)
 * - Kích thước cột (width: number)
 * - Thứ tự cột (reorder)
 * - Tự động ghi nhớ cấu hình vào localStorage theo từng module
 */
export function useColumnSettings(storageKey: string, initialColumns: ColumnDef[]) {
  const [columns, setColumns] = useState<ColumnDef[]>(() => {
    try {
      const saved = localStorage.getItem(`hkt_cols_${storageKey}`);
      if (saved) {
        const parsed: ColumnDef[] = JSON.parse(saved);
        const initialMap = new Map(initialColumns.map((c) => [c.id, c]));

        // Hợp nhất dữ liệu đã lưu với cấu hình cột mặc định (giữ label và thuộc tính mới, loại bỏ các cột đã bị xóa)
        const merged: ColumnDef[] = parsed
          .filter((p) => initialMap.has(p.id))
          .map((p) => {
            const init = initialMap.get(p.id)!;
            return {
              ...init,
              ...p,
              label: init.label, // luôn dùng nhãn mới nhất
            };
          });

        // Bổ sung các cột mới trong code nếu storage chưa có
        const parsedIds = new Set(parsed.map((p) => p.id));
        for (const init of initialColumns) {
          if (!parsedIds.has(init.id)) {
            merged.push(init);
          }
        }

        // Đảm bảo thứ tự order hợp lệ
        merged.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return merged;
      }
    } catch {
      // Fallback khi parse lỗi
    }
    return initialColumns;
  });

  // Tự động lưu cấu hình cột vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(`hkt_cols_${storageKey}`, JSON.stringify(columns));
    } catch {
      // Bỏ qua nếu storage đầy/bị chặn
    }
  }, [storageKey, columns]);

  const handleToggleColumn = useCallback((id: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
    );
  }, []);

  const handleUpdateColumn = useCallback((id: string, updates: Partial<ColumnDef>) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }, []);

  const handleReorderColumns = useCallback((from: number, to: number) => {
    setColumns((prev) => {
      const sorted = [...prev].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const [moved] = sorted.splice(from, 1);
      sorted.splice(to, 0, moved);
      return sorted.map((c, i) => ({ ...c, order: i }));
    });
  }, []);

  const handleResetColumns = useCallback(() => {
    setColumns(initialColumns);
    try {
      localStorage.removeItem(`hkt_cols_${storageKey}`);
    } catch {
      // ignore
    }
  }, [storageKey, initialColumns]);

  return {
    columns,
    setColumns,
    handleToggleColumn,
    handleUpdateColumn,
    handleReorderColumns,
    handleResetColumns,
  };
}
