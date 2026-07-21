import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

interface Props { draws: Draw[]; }

export default function DrawHistory({ draws }: Props) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">Draw History</h3>
      <div className="space-y-2">
        {draws.map((draw) => (
          <div key={draw.id} className="flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0">
            <div className="w-28 shrink-0">
              <div className="font-mono text-sm font-bold">{draw.draw_number}</div>
              <div className="text-xs text-[var(--color-muted)]">{draw.draw_date}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              {draw.numbers.map((n) => <NumberBall key={n} number={n} size="sm" />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
