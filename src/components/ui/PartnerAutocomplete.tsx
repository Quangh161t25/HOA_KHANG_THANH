import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export interface PartnerOption {
  id: string;
  name: string;
  code?: string;
  phone?: string;
  address?: string;
  currentDebt?: number;
  subtext?: string;
}

export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

interface PartnerAutocompleteProps {
  value: string; // Tên đối tác hiện tại đang hiển thị
  selectedId?: string; // ID đối tác (nếu đã chọn từ danh sách)
  options: PartnerOption[];
  onChange: (partner: {
    id?: string;
    name: string;
    code?: string;
    phone?: string;
    address?: string;
    isCustom?: boolean;
  }) => void;
  placeholder?: string;
  allowCustom?: boolean;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function PartnerAutocomplete({
  value,
  selectedId,
  options,
  onChange,
  placeholder = 'Gõ tên hoặc mã để tìm kiếm...',
  allowCustom = true,
  className = '',
  inputClassName = '',
  disabled = false,
  autoFocus = false,
}: PartnerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Đồng bộ search term khi value từ bên ngoài đổi
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Khi blur ra ngoài, nếu term khác với value hiện tại:
        // Nếu cho phép custom và term không rỗng, giữ nguyên term làm custom partner
        if (allowCustom && searchTerm.trim() && searchTerm.trim() !== value.trim()) {
          const exactMatch = options.find(
            (o) => o.name.trim().toLowerCase() === searchTerm.trim().toLowerCase(),
          );
          if (exactMatch) {
            onChange({
              id: exactMatch.id,
              name: exactMatch.name,
              code: exactMatch.code,
              phone: exactMatch.phone,
              address: exactMatch.address,
              isCustom: false,
            });
          } else {
            onChange({
              name: searchTerm.trim(),
              isCustom: true,
            });
          }
        } else if (!searchTerm.trim() && value) {
          // Nếu xóa sạch
          onChange({ name: '', isCustom: true });
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchTerm, value, options, allowCustom, onChange]);

  // Lọc gợi ý theo từ khóa (hỗ trợ cả tiếng Việt có dấu và không dấu)
  const filteredOptions = useMemo(() => {
    const raw = searchTerm.trim();
    if (!raw) return options.slice(0, 50);

    const norm = removeVietnameseTones(raw);
    const results: PartnerOption[] = [];

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const optName = opt.name || '';
      const optCode = opt.code || '';
      const optPhone = opt.phone || '';

      const matchRaw =
        optName.toLowerCase().includes(raw.toLowerCase()) ||
        optCode.toLowerCase().includes(raw.toLowerCase()) ||
        optPhone.includes(raw);

      if (matchRaw) {
        results.push(opt);
        if (results.length >= 50) break;
        continue;
      }

      // Khớp không dấu
      const nameNorm = removeVietnameseTones(optName);
      const codeNorm = removeVietnameseTones(optCode);
      if (nameNorm.includes(norm) || codeNorm.includes(norm)) {
        results.push(opt);
        if (results.length >= 50) break;
      }
    }

    return results;
  }, [options, searchTerm]);

  const handleSelectOption = (opt: PartnerOption) => {
    setSearchTerm(opt.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange({
      id: opt.id,
      name: opt.name,
      code: opt.code,
      phone: opt.phone,
      address: opt.address,
      isCustom: false,
    });
  };

  const handleSelectCustom = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setIsOpen(false);
    setHighlightedIndex(-1);
    onChange({
      name: trimmed,
      isCustom: true,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    const maxIndex = filteredOptions.length + (allowCustom && searchTerm.trim() ? 0 : -1);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < maxIndex ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : maxIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex]);
      } else if (allowCustom && searchTerm.trim()) {
        handleSelectCustom();
      } else if (filteredOptions.length > 0) {
        handleSelectOption(filteredOptions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchTerm(value || '');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange({ name: '', isCustom: true });
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const hasExactMatch = useMemo(() => {
    const raw = searchTerm.trim().toLowerCase();
    return options.some((o) => o.name.trim().toLowerCase() === raw);
  }, [options, searchTerm]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full h-8 pl-2.5 pr-14 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none transition-all ${inputClassName} ${
            disabled ? 'opacity-60 cursor-not-allowed bg-muted' : ''
          }`}
        />

        <div className="absolute right-1.5 flex items-center gap-0.5">
          {searchTerm && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Xóa tìm kiếm"
              tabIndex={-1}
            >
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setIsOpen((prev) => !prev);
              inputRef.current?.focus();
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Xem danh sách"
            tabIndex={-1}
          >
            <ChevronDown size={14} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-card shadow-2xl z-50 py-1 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100"
        >
          {filteredOptions.length > 0 ? (
            <div className="divide-y divide-border/30">
              {filteredOptions.map((opt, idx) => {
                const isSelected = selectedId === opt.id || value === opt.name;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 transition-colors ${
                      isHighlighted
                        ? 'bg-primary/10 text-primary'
                        : isSelected
                        ? 'bg-primary/5 font-semibold text-foreground'
                        : 'text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-foreground truncate">{opt.name}</span>
                        {opt.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground shrink-0">
                            {opt.code}
                          </span>
                        )}
                      </div>
                      {(opt.phone || opt.address || opt.subtext || opt.currentDebt !== undefined) && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 flex-wrap">
                          {opt.phone && <span>📞 {opt.phone}</span>}
                          {opt.address && <span className="truncate max-w-[200px]">📍 {opt.address}</span>}
                          {opt.currentDebt !== undefined && (
                            <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                              Nợ: {opt.currentDebt.toLocaleString('vi-VN')}
                            </span>
                          )}
                          {opt.subtext && <span>{opt.subtext}</span>}
                        </div>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0 stroke-[3px]" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">
              Không tìm thấy đối tác nào phù hợp
            </div>
          )}

          {/* Tuỳ chọn nhập tên mới tự do nếu không trùng khớp */}
          {allowCustom && searchTerm.trim() && !hasExactMatch && (
            <div className="border-t border-border/60 p-1.5 bg-muted/40">
              <button
                type="button"
                onClick={handleSelectCustom}
                className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 flex items-center justify-between transition-colors"
              >
                <span className="truncate">
                  ➕ Sử dụng: <strong className="underline font-bold">"{searchTerm.trim()}"</strong> (Tự nhập tên)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase font-mono">
                  Mới
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
