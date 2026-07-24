import { useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

interface Props { draws: Draw[]; }

export default function ColdHotTransition({ draws }: Props) {
  const alerts = useMemo(() => {
    if (draws.length < 20) return [];
    const recent10 = draws.slice(0, 10);
    const prev10 = draws.slice(10, 20);

    const getAppearances = (ds: Draw[]) => {
      const freq = new Map<number, number>();
      ds.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
      return freq;
    };

    const recentFreq = getAppearances(recent10);
    const prevFreq = getAppearances(prev10);

    const transitions: { number: number; type: 'cold2hot' | 'hot2cold'; prevCount: number; recentCount: number }[] = [];

    for (let n = 1; n <= 80; n++) {
      const rc = recentFreq.get(n) || 0;
      const pc = prevFreq.get(n) || 0;
      if (pc <= 1 && rc >= 4) transitions.push({ number: n, type: 'cold2hot', prevCount: pc, recentCount: rc });
      if (pc >= 4 && rc <= 1) transitions.push({ number: n, type: 'hot2cold', prevCount: pc, recentCount: rc });
    }

    return transitions;
  }, [draws]);

  if (!alerts.length) return null;

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">⚡ 冷热转换预警</h3>
      <div className="space-y-2">
        {alerts.map(a => (
          <div key={a.number} className={`flex items-center gap-3 p-2 rounded-lg ${a.type === 'cold2hot' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            <NumberBall number={a.number} size="sm" />
            <div className="flex-1">
              <div className="text-sm font-bold">
                {a.type === 'cold2hot' ? '❄️ → 🔥 冷转热' : '🔥 → ❄️ 热转冷'}
              </div>
              <div className="text-xs text-[var(--color-muted)]">
                前10期 {a.prevCount}次 → 近10期 {a.recentCount}次
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.type === 'cold2hot' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              {a.type === 'cold2hot' ? '关注' : '谨慎'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
