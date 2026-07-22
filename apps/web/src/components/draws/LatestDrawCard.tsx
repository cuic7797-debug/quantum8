import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
interface Props { draw: Draw; }
export default function LatestDrawCard({ draw }: Props) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-[var(--color-muted)]">最新一期</span>
          <h3 className="text-lg font-bold font-mono">{draw.draw_number}</h3>
        </div>
        <span className="text-xs text-[var(--color-muted)]">{draw.draw_date}</span>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {draw.numbers.map((n) => <NumberBall key={n} number={n} size="lg" />)}
      </div>
      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="bg-[var(--color-bg)] rounded-lg p-2"><div className="text-xs text-[var(--color-muted)]">和值</div><div className="font-bold font-mono">{draw.sum_value}</div></div>
        <div className="bg-[var(--color-bg)] rounded-lg p-2"><div className="text-xs text-[var(--color-muted)]">奇偶</div><div className="font-bold font-mono">{draw.odd_count}:{draw.even_count}</div></div>
        <div className="bg-[var(--color-bg)] rounded-lg p-2"><div className="text-xs text-[var(--color-muted)]">大小</div><div className="font-bold font-mono">{draw.big_count}:{draw.small_count}</div></div>
        <div className="bg-[var(--color-bg)] rounded-lg p-2"><div className="text-xs text-[var(--color-muted)]">连号</div><div className="font-bold font-mono">{draw.consecutive_count}</div></div>
      </div>
    </div>
  );
}
