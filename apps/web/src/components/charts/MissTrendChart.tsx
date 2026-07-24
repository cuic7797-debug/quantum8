import { useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

interface Props { draws: Draw[]; numbers?: number[]; }

export default function MissTrendChart({ draws, numbers }: Props) {
  const data = useMemo(() => {
    if (!draws.length) return [];
    const targets = numbers || [1, 10, 20, 30, 40, 50, 60, 70, 80];
    const lookback = Math.min(50, draws.length);

    return targets.map(num => {
      const missTrend: number[] = [];
      let miss = 0;
      for (let i = lookback - 1; i >= 0; i--) {
        if (draws[i].numbers.includes(num)) {
          missTrend.push(miss);
          miss = 0;
        } else {
          miss++;
        }
      }
      missTrend.push(miss);
      missTrend.reverse();

      const maxMiss = Math.max(...missTrend, 1);
      const currentMiss = missTrend[missTrend.length - 1];
      const avgMiss = (missTrend.reduce((a, b) => a + b, 0) / missTrend.length).toFixed(1);

      return { num, missTrend, maxMiss, currentMiss, avgMiss };
    });
  }, [draws, numbers]);

  if (!data.length) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">📉 遗漏趋势（近{Math.min(50, draws.length)}期）</h3>
      <div className="space-y-3">
        {data.map(({ num, missTrend, maxMiss, currentMiss, avgMiss }) => (
          <div key={num} className="flex items-center gap-3 group">
            <NumberBall number={num} size="sm" />
            <div className="flex-1 h-8 glass-inset rounded-lg overflow-hidden relative">
              <svg viewBox={`0 0 ${missTrend.length * 4} ${maxMiss + 2}`} className="w-full h-full" preserveAspectRatio="none">
                <polyline
                  points={missTrend.map((v, i) => `${i * 4},${maxMiss - v + 1}`).join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.8"
                  className="text-[var(--color-primary)]"
                />
                {missTrend.map((v, i) => (
                  <circle key={i} cx={i * 4} cy={maxMiss - v + 1} r="1"
                    className={v === 0 ? 'fill-emerald-400' : v >= maxMiss * 0.8 ? 'fill-red-400' : 'fill-[var(--color-primary)]/50'} />
                ))}
              </svg>
            </div>
            <div className="text-right shrink-0 w-20">
              <div className="text-xs font-mono font-bold">{currentMiss}期</div>
              <div className="text-[9px] text-[var(--color-muted)]">均{avgMiss}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> 出现</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" /> 遗漏中</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> 高遗漏</span>
      </div>
    </div>
  );
}
