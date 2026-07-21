import type { NumberStat } from '@/hooks/useNumberStats';
import { formatNumber, getHotColor, getMissColor } from '@/utils/format';

interface Props { stats: NumberStat[]; }

export default function HotColdRanking({ stats }: Props) {
  const hotTop10 = [...stats].sort((a, b) => b.hotScore - a.hotScore).slice(0, 10);
  const coldTop10 = [...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 10);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold mb-3">🔥 Hot Numbers TOP 10</h3>
        <div className="space-y-1.5">
          {hotTop10.map((s, i) => (
            <div key={s.number} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-muted)] w-4">{i + 1}</span>
                <span className="font-mono font-bold">{formatNumber(s.number)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-muted)]">Last 10: {s.recent10Rate}%</span>
                <span className={`font-mono font-bold ${getHotColor(s.hotScore)}`}>{s.hotScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold mb-3">❄️ Cold Numbers TOP 10</h3>
        <div className="space-y-1.5">
          {coldTop10.map((s, i) => (
            <div key={s.number} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--color-muted)] w-4">{i + 1}</span>
                <span className="font-mono font-bold">{formatNumber(s.number)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-muted)]">Missed {s.currentMiss}d</span>
                <span className={`font-mono font-bold ${getMissColor(s.currentMiss)}`}>{s.missRatio}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
