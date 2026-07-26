import { useState } from 'react';
import type { Draw } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import ShareButton from '@/components/common/ShareButton';
import { t } from '@/hooks/useI18n';

interface Props {
  draw: Draw;
  onRefresh?: () => void;
  syncing?: boolean;
  syncMsg?: string;
}

export default function LatestDrawCard({ draw, onRefresh, syncing, syncMsg }: Props) {
  const { stats } = useNumberStats();
  const [showDetail, setShowDetail] = useState(false);

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm text-[var(--color-muted)]">{t('latest')}</span>
          <h3 className="text-xl font-bold font-mono">{draw.draw_number}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-muted)]">{draw.draw_date}</span>
          {onRefresh && (
            <button onClick={onRefresh} disabled={syncing}
              className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25 disabled:opacity-50 transition-all font-medium flex items-center gap-1.5">
              {syncing ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  同步中...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  刷新数据
                </>
              )}
            </button>
          )}
          <ShareButton numbers={draw.numbers} title={`第${draw.draw_number}期开奖号码`} />
          <button onClick={() => setShowDetail(!showDetail)}
            className="text-sm text-[var(--color-primary)] hover:underline font-medium">
            {showDetail ? '收起' : '详情'}
          </button>
        </div>
      </div>

      {syncMsg && (
        <div className={`text-sm text-center py-2 rounded-lg mb-3 ${syncMsg.includes('失败') || syncMsg.includes('❌') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {syncMsg}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {draw.numbers.map((n) => {
          const stat = stats.find(s => s.number === n);
          return (
            <div key={n} className="relative group">
              <NumberBall number={n} size="lg" />
              {showDetail && stat && (
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-sm text-[var(--color-muted)] font-mono whitespace-nowrap">
                  {stat.totalAppearances}次
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showDetail && <div className="h-4" />}

      <div className="grid grid-cols-4 gap-3 text-center">
        <div className="glass-inset p-3">
          <div className="text-sm text-[var(--color-muted)]">{t('sum')}</div>
          <div className="text-lg font-bold font-mono">{draw.sum_value}</div>
        </div>
        <div className="glass-inset p-3">
          <div className="text-sm text-[var(--color-muted)]">{t('odd_even')}</div>
          <div className="text-lg font-bold font-mono">{draw.odd_count}:{draw.even_count}</div>
        </div>
        <div className="glass-inset p-3">
          <div className="text-sm text-[var(--color-muted)]">{t('big_small')}</div>
          <div className="text-lg font-bold font-mono">{draw.big_count}:{draw.small_count}</div>
        </div>
        <div className="glass-inset p-3">
          <div className="text-sm text-[var(--color-muted)]">{t('streaks')}</div>
          <div className="text-lg font-bold font-mono">{draw.consecutive_count}</div>
        </div>
      </div>

      {showDetail && (
        <div className="mt-4 grid grid-cols-4 gap-3 text-center">
          <div className="glass-inset p-3">
            <div className="text-sm text-[var(--color-muted)]">{t('zone1')}</div>
            <div className="text-lg font-bold font-mono text-blue-400">{draw.zone1_count}</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-sm text-[var(--color-muted)]">{t('zone2')}</div>
            <div className="text-lg font-bold font-mono text-emerald-400">{draw.zone2_count}</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-sm text-[var(--color-muted)]">{t('zone3')}</div>
            <div className="text-lg font-bold font-mono text-amber-400">{draw.zone3_count}</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-sm text-[var(--color-muted)]">{t('zone4')}</div>
            <div className="text-lg font-bold font-mono text-rose-400">{draw.zone4_count}</div>
          </div>
        </div>
      )}
    </div>
  );
}
