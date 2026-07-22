import { useState } from 'react';
import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

interface Props { draws: Draw[]; }

export default function DrawHistory({ draws }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">{t('history')}</h3>
      <div className="space-y-2">
        {draws.map((draw) => {
          const isOpen = expanded === draw.id;
          return (
            <div key={draw.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : draw.id)}
                className="w-full flex items-center gap-3 py-2 border-b border-[var(--color-border)] last:border-0 text-left hover:bg-white/5 rounded px-2 transition-colors">
                <div className="w-28 shrink-0">
                  <div className="font-mono text-sm font-bold">{draw.draw_number}</div>
                  <div className="text-xs text-[var(--color-muted)]">{draw.draw_date}</div>
                </div>
                <div className="flex flex-wrap gap-1 flex-1">{draw.numbers.map((n) => <NumberBall key={n} number={n} size="sm" />)}</div>
                <span className="text-[var(--color-muted)] text-xs shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>
              {isOpen && (
                <div className="bg-[var(--color-bg)] rounded-lg p-4 mt-1 mb-2 space-y-3 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('sum')}</div>
                      <div className="font-bold font-mono">{draw.sum_value}</div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('odd_even')}</div>
                      <div className="font-bold font-mono">{draw.odd_count}:{draw.even_count}</div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('big_small')}</div>
                      <div className="font-bold font-mono">{draw.big_count}:{draw.small_count}</div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('streaks')}</div>
                      <div className="font-bold font-mono">{draw.consecutive_count}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('zone1')}</div>
                      <div className="font-bold font-mono text-blue-400">{draw.zone1_count}</div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('zone2')}</div>
                      <div className="font-bold font-mono text-emerald-400">{draw.zone2_count}</div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('zone3')}</div>
                      <div className="font-bold font-mono text-amber-400">{draw.zone3_count}</div>
                    </div>
                    <div className="bg-[var(--color-surface)] rounded-lg p-2">
                      <div className="text-[var(--color-muted)]">{t('zone4')}</div>
                      <div className="font-bold font-mono text-rose-400">{draw.zone4_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                    <span>跨度: <span className="font-mono text-white">{draw.span}</span></span>
                    <span>重复号: <span className="font-mono text-white">{draw.repeat_count}</span></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
