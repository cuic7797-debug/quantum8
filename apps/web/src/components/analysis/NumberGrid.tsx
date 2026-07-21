import type { NumberStat } from '@/hooks/useNumberStats';
import { formatNumber } from '@/utils/format';

interface Props { stats: NumberStat[]; }

export default function NumberGrid({ stats }: Props) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">Number Heat Map</h3>
      <div className="grid grid-cols-10 gap-1.5">
        {stats.map((s) => {
          const intensity = Math.min(1, s.hot_score / 100);
          return (
            <div key={s.number} className="flex flex-col items-center p-1.5 rounded-lg transition-all hover:scale-105 cursor-default"
              style={{ backgroundColor: `rgba(239, 68, 68, ${intensity * 0.3})` }}
              title={`#${s.number} Hot:${s.hot_score} Miss:${s.current_miss}`}>
              <span className="text-xs font-mono font-bold">{formatNumber(s.number)}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{s.current_miss}d</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-[10px] text-[var(--color-muted)]">
        <span>Red = Hot (frequent recently)</span>
        <span>White = Cold (infrequent)</span>
      </div>
    </div>
  );
}
