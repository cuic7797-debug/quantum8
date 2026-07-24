import { useState } from 'react';
import type { NumberStat } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

interface Props { stats: NumberStat[]; }

export default function MissTrend({ stats }: Props) {
  const [selected, setSelected] = useState<number[]>([1, 2, 3, 4, 5]);

  const topMiss = [...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 20);
  const maxMiss = Math.max(...topMiss.map(s => s.currentMiss), 1);

  function toggle(n: number) {
    setSelected(prev => prev.includes(n) ? prev.filter(x => x !== n) : prev.length < 8 ? [...prev, n] : prev);
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">遗漏值趋势（点击号码切换）</h3>
      <div className="flex flex-wrap gap-1 mb-3">
        {topMiss.map(s => (
          <button key={s.number} onClick={() => toggle(s.number)}
            className={`transition-all ${selected.includes(s.number) ? 'opacity-100' : 'opacity-30'}`}>
            <NumberBall number={s.number} size="sm" />
          </button>
        ))}
      </div>
      <div className="space-y-1">
        {selected.map(num => {
          const s = stats.find(x => x.number === num);
          if (!s) return null;
          const w = (s.currentMiss / maxMiss) * 100;
          return (
            <div key={num} className="flex items-center gap-2 text-sm">
              <NumberBall number={num} size="sm" />
              <div className="flex-1 h-5 glass-inset overflow-hidden relative">
                <div className={`h-full rounded ${s.currentMiss >= 15 ? 'bg-red-500' : s.currentMiss >= 8 ? 'bg-amber-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.max(2, w)}%` }} />
                <span className="absolute right-1 top-0 h-full flex items-center text-sm font-mono text-white/80">
                  {s.currentMiss}期
                </span>
              </div>
              <span className="text-xs text-[var(--color-muted)] w-16 text-right">均{s.avgMiss}期</span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-[var(--color-muted)]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block" /> 正常(1-7)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block" /> 偏高(8-14)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500 inline-block" /> 过高(15+)</span>
      </div>
    </div>
  );
}
