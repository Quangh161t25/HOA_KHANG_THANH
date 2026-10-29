import { useRef, useState, type DragEvent } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Pin,
  RotateCcw,
  WrapText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnAlign, ColumnDef } from '@/stores/createListStore';
import { Tooltip } from '@/components/ui/Tooltip';

interface ColumnSettingsProps {
  columns: ColumnDef[];
  onToggleColumn: (id: string) => void;
  onReorderColumns: (from: number, to: number) => void;
  onResetColumns: () => void;
  onUpdateColumn?: (id: string, updates: Partial<ColumnDef>) => void;
}

/**
 * Bảng tùy chỉnh hiển thị, căn lề, xuống dòng, kích thước và ghim cột cho tất cả các module.
 */
export function ColumnSettings({
  columns,
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
  onUpdateColumn,
}: ColumnSettingsProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragEl = useRef<HTMLElement | null>(null);

  const sorted = [...columns].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const visibleCount = sorted.filter((c) => c.visible).length;

  const onDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    setDragIndex(index);
    dragEl.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (dragEl.current) dragEl.current.style.opacity = '0.4';
    }, 0);
  };

  const onDragEnter = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  };

  const onDragEnd = () => {
    if (dragEl.current) dragEl.current.style.opacity = '1';
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      onReorderColumns(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
    dragEl.current = null;
  };

  const handleAlignChange = (id: string, align: ColumnAlign) => {
    onUpdateColumn?.(id, { align });
  };

  const handleWrapToggle = (id: string, currentWrap?: boolean) => {
    onUpdateColumn?.(id, { wrap: !currentWrap });
  };

  const handlePinToggle = (id: string, currentPinned?: boolean) => {
    onUpdateColumn?.(id, { pinned: !currentPinned });
  };

  const handleWidthChange = (id: string, valStr: string) => {
    const num = parseInt(valStr, 10);
    if (!isNaN(num) && num >= 40 && num <= 800) {
      onUpdateColumn?.(id, { width: num });
    }
  };

  const handleShowAll = () => {
    sorted.forEach((c) => {
      if (!c.visible) onToggleColumn(c.id);
    });
  };

  const handleHideAll = () => {
    sorted.forEach((c) => {
      if (c.visible && c.id !== 'actions') onToggleColumn(c.id);
    });
  };

  return (
    <div className="w-[390px] sm:w-[430px] max-w-[calc(100vw-24px)] overflow-hidden text-xs select-none">
      {/* Header */}
      <div className="px-3.5 py-2.5 border-b border-border bg-muted/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-bold text-foreground">Tùy chỉnh cột hiển thị</h4>
          <span className="text-[11px] tabular-nums font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            {visibleCount}/{sorted.length} hiển thị
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Khôi phục cài đặt cột mặc định" placement="bottom">
            <button
              type="button"
              onClick={onResetColumns}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-2 py-1 rounded-md transition-all active:scale-95"
            >
              <RotateCcw size={11} />
              <span>Mặc định</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Subheader Toolbar & Legend */}
      <div className="px-3.5 py-1.5 bg-muted/20 border-b border-border/60 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-2">
          <span>Tên cột (kéo đổi vị trí)</span>
        </div>
        <div className="flex items-center gap-3 pr-1">
          <span className="flex items-center gap-0.5" title="Căn lề cột (Trái, Giữa, Phải)">
            <AlignLeft size={11} className="text-primary" /> Căn lề
          </span>
          <span className="flex items-center gap-0.5" title="Cho phép nội dung xuống dòng">
            <WrapText size={11} className="text-primary" /> Dòng
          </span>
          <span className="flex items-center gap-0.5" title="Ghim cột cố định khi cuộn ngang">
            <Pin size={11} className="text-amber-500" /> Ghim
          </span>
          <span className="flex items-center gap-0.5" title="Độ rộng cột (pixel)">
            Rộng (px)
          </span>
        </div>
      </div>

      {/* Column list */}
      <div className="p-1.5 max-h-[380px] overflow-y-auto custom-scrollbar divide-y divide-border/30">
        {sorted.map((col, index) => {
          const isActionsCol = col.id === 'actions';
          const align = col.align || (isActionsCol ? 'center' : 'left');
          const isPinned = col.pinned === true;
          const isWrap = col.wrap === true;
          const colWidth = col.width ?? col.minWidth ?? 120;

          return (
            <div
              key={col.id}
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragEnter={() => onDragEnter(index)}
              onDragOver={(e) => e.preventDefault()}
              onDragEnd={onDragEnd}
              className={cn(
                'flex items-center gap-2 px-2 py-2 rounded-lg transition-all group',
                overIndex === index && 'bg-primary/10 border border-primary/30 border-dashed',
                dragIndex === index ? 'opacity-40' : 'hover:bg-muted/50',
                !col.visible && 'opacity-60 bg-muted/10',
              )}
            >
              {/* Drag handle */}
              <div
                className="cursor-grab active:cursor-grabbing text-muted-foreground/40 group-hover:text-muted-foreground shrink-0 transition-colors"
                title="Kéo thả để sắp xếp thứ tự cột"
              >
                <GripVertical size={13} />
              </div>

              {/* Checkbox */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleColumn(col.id);
                }}
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer',
                  col.visible
                    ? 'bg-primary border-primary text-white shadow-2xs'
                    : 'border-border bg-background group-hover:border-primary/50',
                )}
                title={col.visible ? 'Bấm để ẩn cột này' : 'Bấm để hiện cột này'}
              >
                {col.visible && <Check size={10} className="stroke-[3.5px]" />}
              </div>

              {/* Column label */}
              <span
                onClick={() => onToggleColumn(col.id)}
                className={cn(
                  'text-xs flex-1 truncate cursor-pointer font-medium select-none',
                  col.visible ? 'text-foreground' : 'text-muted-foreground line-through decoration-muted-foreground/50',
                )}
                title={col.label}
              >
                {col.label}
              </span>

              {/* Column options (only interactive if visible) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* 1. Căn lề dạng icon (3 nút Trái - Giữa - Phải) */}
                <div
                  className={cn(
                    'flex items-center bg-muted/60 p-0.5 rounded-md border border-border/70',
                    !col.visible && 'pointer-events-none opacity-40',
                  )}
                  title={`Căn lề: ${align === 'left' ? 'Trái' : align === 'center' ? 'Giữa' : 'Phải'}`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlignChange(col.id, 'left');
                    }}
                    className={cn(
                      'p-1 rounded text-muted-foreground hover:text-foreground transition-all',
                      align === 'left' && 'bg-background text-primary shadow-xs font-bold border border-border/50',
                    )}
                    title="Căn trái"
                  >
                    <AlignLeft size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlignChange(col.id, 'center');
                    }}
                    className={cn(
                      'p-1 rounded text-muted-foreground hover:text-foreground transition-all',
                      align === 'center' && 'bg-background text-primary shadow-xs font-bold border border-border/50',
                    )}
                    title="Căn giữa"
                  >
                    <AlignCenter size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAlignChange(col.id, 'right');
                    }}
                    className={cn(
                      'p-1 rounded text-muted-foreground hover:text-foreground transition-all',
                      align === 'right' && 'bg-background text-primary shadow-xs font-bold border border-border/50',
                    )}
                    title="Căn phải"
                  >
                    <AlignRight size={11} />
                  </button>
                </div>

                {/* 2. Xuống dòng dạng icon */}
                <Tooltip
                  content={isWrap ? 'Xuống dòng: BẬT (Hiển thị nhiều hàng khi dài)' : 'Xuống dòng: TẮT (Cắt gọn 1 dòng)'}
                  placement="top"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWrapToggle(col.id, isWrap);
                    }}
                    disabled={!col.visible}
                    className={cn(
                      'p-1.5 rounded-md border transition-all',
                      !col.visible && 'pointer-events-none opacity-40',
                      isWrap
                        ? 'bg-primary/10 text-primary border-primary/40 font-bold shadow-xs'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <WrapText size={12} />
                  </button>
                </Tooltip>

                {/* 3. Ghim cột dạng icon */}
                <Tooltip
                  content={isPinned ? 'Ghim cột: ĐANG GHIM bên trái' : 'Ghim cột: Bấm để ghim cố định bên trái khi cuộn'}
                  placement="top"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePinToggle(col.id, isPinned);
                    }}
                    disabled={!col.visible}
                    className={cn(
                      'p-1.5 rounded-md border transition-all',
                      !col.visible && 'pointer-events-none opacity-40',
                      isPinned
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 font-bold shadow-xs'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <Pin size={12} className={isPinned ? 'fill-amber-500/40 rotate-45' : ''} />
                  </button>
                </Tooltip>

                {/* 4. Kích thước cột (Width input in px) */}
                <div
                  className={cn(
                    'flex items-center border border-border rounded-md bg-background px-1.5 py-0.5 w-[62px]',
                    !col.visible && 'pointer-events-none opacity-40',
                  )}
                  title="Nhập kích thước cột (pixel)"
                >
                  <input
                    type="number"
                    min={40}
                    max={800}
                    step={10}
                    value={colWidth}
                    disabled={!col.visible}
                    onChange={(e) => handleWidthChange(col.id, e.target.value)}
                    className="w-full text-[11px] font-mono text-right bg-transparent text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <span className="text-[9px] text-muted-foreground/70 ml-0.5 select-none font-mono">px</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer bar */}
      <div className="px-3.5 py-2 border-t border-border bg-muted/30 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShowAll}
            className="flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <Eye size={12} />
            <span>Hiện tất cả</span>
          </button>
          <span className="text-border">•</span>
          <button
            type="button"
            onClick={handleHideAll}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <EyeOff size={12} />
            <span>Ẩn tất cả</span>
          </button>
        </div>
        <span className="text-[10px] text-muted-foreground italic">
          * Tự động lưu cấu hình
        </span>
      </div>
    </div>
  );
}
