import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** Tab đang chọn, đồng bộ với tham số `?tab=` trên URL (giống bản gốc). */
export function useTabParam<T extends string>(allowed: readonly T[], fallback: T, removeOnFallback = false) {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get('tab');
  const [tab, setTab] = useState<T>(() => (allowed.includes(fromUrl as T) ? (fromUrl as T) : fallback));

  useEffect(() => {
    if (allowed.includes(fromUrl as T)) setTab(fromUrl as T);
    else if (!fromUrl) setTab(fallback);
  }, [fromUrl, allowed, fallback]);

  const change = (next: T) => {
    if (!allowed.includes(next)) return;
    setTab(next);
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      if (removeOnFallback && next === fallback) p.delete('tab');
      else p.set('tab', next);
      return p;
    });
  };

  return [tab, change] as const;
}
