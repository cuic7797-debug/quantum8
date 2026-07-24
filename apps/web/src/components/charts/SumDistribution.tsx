import { useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';

interface Props { draws: Draw[]; }

export default function SumDistribution({ draws }: Props) {
  const data = useMemo(() => {
    if (!draws.length) return null;
    const sums = draws.map(d => d.sum_value);
    const min = Math.min(...sums);
    const max = Math.max(...sums);
    const bucketSize = Math.max(10, Math.round((max - min) / 12));
    const buckets: { label: string; count: number; min: number; max: number }[] = [];

    for (let start = min; start <= max; start += bucketSize) {
      const end = Math.min(start + bucketSize - 1, max);
      const count = sums.filter(s => s >= start && s <= end).length;
      buckets.push({ label: `${start}-${end}`, count, min: start, max: end });
    }

    const maxCount = Math.max(...buckets.map(b => b.count), 1);
    const avgSum = Math.round(sums.reduce((a, b) => a + b, 0) / sums.length);

    return { buckets, maxCount, avgSum, total: sums.length };
  }, [draws]);

  if (!data) return null;
  const { buckets, maxCount, avgSum, total } = data;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">📊 和值分布</h3>
        <span className="text-xs text-[var(--color-muted)]">均值: <span className="font-mono text-[var(--color-text)]">{avgSum}</span></span>
      </div>
      <div className="flex items-end gap-1 h-40">
        {buckets.map((b, i) => {
          const h = (b.count / maxCount) * 100;
          const isAvg = avgSum >= b.min && avgSum <= b.max;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="text-xs text-[var(--color-muted)] opacity-0 group-hover:opacity-100 transition-opacity">{b.count}</div>
              <div className={`w-full rounded-t transition-all duration-300 ${isAvg ? 'bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-accent)]' : 'bg-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/60'}`}
                style={{ height: `${h}%`, minHeight: 2 }} />
              <div className="text-[8px] text-[var(--color-muted)] truncate w-full text-center">{b.label}</div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-[var(--color-muted)] mt-2 text-center">
        共 {total} 期 · 均值 {avgSum} · 区间 {buckets[0]?.label} ~ {buckets[buckets.length - 1]?.label}
      </div>
    </div>
  );
}
