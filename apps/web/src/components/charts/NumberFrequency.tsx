import { useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';

interface Props { draws: Draw[]; top?: number; }

interface FreqData {
  items: [number, number][];
  maxFreq: number;
  total: number;
}

export default function NumberFrequency({ draws, top = 20 }: Props) {
  const data = useMemo((): FreqData | null => {
    if (!draws.length) return null;
    const freq = new Map<number, number>();
    draws.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
    const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, top);
    const maxFreq = sorted[0]?.[1] || 1;
    return { items: sorted, maxFreq, total: draws.length };
  }, [draws, top]);

  if (!data) return null;
  const { items, maxFreq, total } = data;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">🔥 频率排行 TOP {top}</h3>
        <span className="text-xs text-[var(--color-muted)]">{total}期数据</span>
      </div>
      <div className="space-y-1.5">
        {items.map(([num, count]: [number, number], i: number) => {
          const pct = (count / maxFreq) * 100;
          const rate = ((count / total) * 100).toFixed(1);
          return (
            <div key={num} className="flex items-center gap-2 group">
              <span className="text-xs text-[var(--color-muted)] w-4 text-right shrink-0">{i + 1}</span>
              <span className="w-7 h-7 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] flex items-center justify-center text-sm font-bold font-mono shrink-0">
                {num.toString().padStart(2, '0')}
              </span>
              <div className="flex-1 h-5 glass-inset rounded overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded transition-all duration-500"
                  style={{ width: `${pct}%` }} />
                <span className="absolute inset-0 flex items-center justify-end pr-2 text-sm font-mono text-[var(--color-muted)] group-hover:text-[var(--color-text)] transition-colors">
                  {count}次 ({rate}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
