import { useState, useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

interface Props { draws: Draw[]; }

export default function DrawHistory({ draws }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const displayDraws = useMemo(() => {
    return showAll ? draws : draws.slice(0, 30);
  }, [draws, showAll]);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">{t('history')}</h3>
        {draws.length > 30 && (
          <button onClick={() => setShowAll(!showAll)}
            className="text-[11px] text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors">
            {showAll ? '收起' : `展开全部 ${draws.length} 期`}
          </button>
        )}
      </div>
      <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
        {displayDraws.map((draw) => {
          const isOpen = expanded === draw.id;
          return (
            <div key={draw.id}>
              <button
                onClick={() => setExpanded(isOpen ? null : draw.id)}
                className="w-full flex items-center gap-3 py-2 border-b border-[var(--glass-border)] last:border-0 text-left hover:bg-white/[0.03] rounded px-2 transition-colors">
                <div className="w-28 shrink-0">
                  <div className="font-mono text-sm font-bold">{draw.draw_number}</div>
                  <div className="text-xs text-[var(--color-muted)]">{draw.draw_date}</div>
                </div>
                <div className="flex flex-wrap gap-1 flex-1">{draw.numbers.map((n) => <NumberBall key={n} number={n} size="sm" />)}</div>
                <span className="text-[var(--color-muted)] text-xs shrink-0 transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </button>
              {isOpen && (
                <div className="glass-inset p-4 mt-1 mb-2 space-y-3">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('sum')}</div>
                      <div className="font-bold font-mono">{draw.sum_value}</div>
                    </div>
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('odd_even')}</div>
                      <div className="font-bold font-mono">{draw.odd_count}:{draw.even_count}</div>
                    </div>
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('big_small')}</div>
                      <div className="font-bold font-mono">{draw.big_count}:{draw.small_count}</div>
                    </div>
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('streaks')}</div>
                      <div className="font-bold font-mono">{draw.consecutive_count}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('zone1')}</div>
                      <div className="font-bold font-mono text-blue-400">{draw.zone1_count}</div>
                    </div>
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('zone2')}</div>
                      <div className="font-bold font-mono text-emerald-400">{draw.zone2_count}</div>
                    </div>
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('zone3')}</div>
                      <div className="font-bold font-mono text-amber-400">{draw.zone3_count}</div>
                    </div>
                    <div className="glass-card p-2">
                      <div className="text-[var(--color-muted)]">{t('zone4')}</div>
                      <div className="font-bold font-mono text-rose-400">{draw.zone4_count}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                    <span>跨度: <span className="font-mono text-[var(--color-text)]">{draw.span}</span></span>
                    <span>重复号: <span className="font-mono text-[var(--color-text)]">{draw.repeat_count}</span></span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {!showAll && draws.length > 30 && (
        <div className="text-center pt-3 border-t border-[var(--glass-border)] mt-3">
          <button onClick={() => setShowAll(true)}
            className="text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors">
            加载更多 ({draws.length - 30} 期)
          </button>
        </div>
      )}
    </div>
  );
}
