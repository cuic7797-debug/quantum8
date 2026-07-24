import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

interface Props { count?: number; }

export default function NumberTrendMini({ count = 10 }: Props) {
  const { draws } = useDraws(count + 5);
  if (draws.length < 2) return null;

  const recent = draws.slice(0, count);

  // Calculate which numbers appear most and least in recent draws
  const freq = new Map<number, number>();
  recent.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
  const sorted = [...freq.entries()].sort((a, b) => b[1] - a[1]);

  // Get average sum
  const sums = recent.map(d => d.sum_value);
  const avgSum = Math.round(sums.reduce((a, b) => a + b, 0) / sums.length);

  // Odd/Even ratio trend
  const oddTrend = recent.map(d => d.odd_count);

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">近 {count} 期走势概览</h3>

      {/* Sum mini chart */}
      <div className="mb-4">
        <div className="text-xs text-[var(--color-muted)] mb-1">和值走势</div>
        <div className="flex items-end gap-0.5 h-12">
          {sums.slice().reverse().map((s, i) => {
            const min = Math.min(...sums);
            const max = Math.max(...sums);
            const range = max - min || 1;
            const h = ((s - min) / range) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-amber-500/70 rounded-t" style={{ height: `${Math.max(8, h)}%` }} />
              </div>
            );
          })}
        </div>
        <div className="text-xs text-[var(--color-muted)] mt-1">均值 {avgSum}</div>
      </div>

      {/* Odd/Even mini chart */}
      <div className="mb-4">
        <div className="text-xs text-[var(--color-muted)] mb-1">奇偶分布</div>
        <div className="flex gap-0.5 h-6">
          {oddTrend.slice().reverse().map((o, i) => (
            <div key={i} className="flex-1 flex rounded overflow-hidden">
              <div className="bg-blue-500" style={{ width: `${(o / 20) * 100}%` }} />
              <div className="bg-rose-500" style={{ width: `${((20 - o) / 20) * 100}%` }} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[var(--color-muted)] mt-1">
          <span>奇</span><span>偶</span>
        </div>
      </div>

      {/* Most/Least frequent */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-[var(--color-muted)] mb-1">最热号码</div>
          <div className="flex flex-wrap gap-1">
            {sorted.slice(0, 5).map(([n, c]) => (
              <div key={n} className="flex items-center gap-1">
                <NumberBall number={n} size="sm" />
                <span className="text-xs text-[var(--color-muted)]">×{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--color-muted)] mb-1">最冷号码</div>
          <div className="flex flex-wrap gap-1">
            {sorted.slice(-5).reverse().map(([n, c]) => (
              <div key={n} className="flex items-center gap-1">
                <NumberBall number={n} size="sm" />
                <span className="text-xs text-[var(--color-muted)]">×{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
