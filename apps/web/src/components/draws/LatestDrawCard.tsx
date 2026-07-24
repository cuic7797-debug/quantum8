import { useState } from 'react';
import type { Draw } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import ShareButton from '@/components/common/ShareButton';
import { t } from '@/hooks/useI18n';

interface Props { draw: Draw; }

export default function LatestDrawCard({ draw }: Props) {
  const { stats } = useNumberStats();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs text-[var(--color-muted)]">{t('latest')}</span>
          <h3 className="text-lg font-bold font-mono">{draw.draw_number}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-muted)]">{draw.draw_date}</span>
          <ShareButton numbers={draw.numbers} title={`第${draw.draw_number}期开奖号码`} />
          <button onClick={() => setShowDetail(!showDetail)}
            className="text-xs text-[var(--color-primary)] hover:underline">
            {showDetail ? '收起' : '详情'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {draw.numbers.map((n) => {
          const stat = stats.find(s => s.number === n);
          return (
            <div key={n} className="relative group">
              <NumberBall number={n} size="lg" />
              {showDetail && stat && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-[var(--color-muted)] font-mono whitespace-nowrap">
                  {stat.totalAppearances}次
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showDetail && <div className="h-4" />}

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="glass-inset p-2">
          <div className="text-xs text-[var(--color-muted)]">{t('sum')}</div>
          <div className="font-bold font-mono">{draw.sum_value}</div>
        </div>
        <div className="glass-inset p-2">
          <div className="text-xs text-[var(--color-muted)]">{t('odd_even')}</div>
          <div className="font-bold font-mono">{draw.odd_count}:{draw.even_count}</div>
        </div>
        <div className="glass-inset p-2">
          <div className="text-xs text-[var(--color-muted)]">{t('big_small')}</div>
          <div className="font-bold font-mono">{draw.big_count}:{draw.small_count}</div>
        </div>
        <div className="glass-inset p-2">
          <div className="text-xs text-[var(--color-muted)]">{t('streaks')}</div>
          <div className="font-bold font-mono">{draw.consecutive_count}</div>
        </div>
      </div>

      {showDetail && (
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div className="glass-inset p-2">
            <div className="text-xs text-[var(--color-muted)]">{t('zone1')}</div>
            <div className="font-bold font-mono text-blue-400">{draw.zone1_count}</div>
          </div>
          <div className="glass-inset p-2">
            <div className="text-xs text-[var(--color-muted)]">{t('zone2')}</div>
            <div className="font-bold font-mono text-emerald-400">{draw.zone2_count}</div>
          </div>
          <div className="glass-inset p-2">
            <div className="text-xs text-[var(--color-muted)]">{t('zone3')}</div>
            <div className="font-bold font-mono text-amber-400">{draw.zone3_count}</div>
          </div>
          <div className="glass-inset p-2">
            <div className="text-xs text-[var(--color-muted)]">{t('zone4')}</div>
            <div className="font-bold font-mono text-rose-400">{draw.zone4_count}</div>
          </div>
        </div>
      )}
    </div>
  );
}
