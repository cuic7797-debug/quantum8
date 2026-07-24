import { useState } from 'react';
import type { NumberStat } from '@/hooks/useNumberStats';
import { formatNumber } from '@/utils/format';
import { t } from '@/hooks/useI18n';
import NumberBall from '@/components/common/NumberBall';

interface Props { stats: NumberStat[]; }

export default function NumberGrid({ stats }: Props) {
  const [selected, setSelected] = useState<NumberStat | null>(null);

  return (
    <>
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('heat_map')}</h3>
        <div className="grid grid-cols-10 gap-1.5">
          {stats.map((s) => {
            const h = s.hotScore;
            let bg = 'bg-slate-700';
            if (h >= 80) bg = 'bg-red-500';
            else if (h >= 65) bg = 'bg-orange-500';
            else if (h >= 50) bg = 'bg-amber-500';
            else if (h >= 35) bg = 'bg-yellow-600';
            else if (h >= 20) bg = 'bg-sky-600';
            else if (h >= 10) bg = 'bg-blue-600';
            else bg = 'bg-blue-800';
            return (
              <button key={s.number}
                onClick={() => setSelected(s)}
                className={`flex flex-col items-center p-1.5 rounded-lg transition-all hover:scale-110 cursor-pointer ${bg}`}
                title={`#${s.number} hot:${s.hotScore} miss:${s.currentMiss}`}>
                <span className="text-sm font-mono font-bold">{formatNumber(s.number)}</span>
                <span className="text-xs text-white/70">{s.currentMiss}d</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-sm text-[var(--color-muted)]">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-800 inline-block" /> 冷</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> 温</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> 热</span>
          <span>点击号码查看详情</span>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelected(null)}>
          <div className="glass-card p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <NumberBall number={selected.number} size="lg" />
                <div>
                  <h3 className="font-bold text-lg">{t('number_detail')}</h3>
                  <p className="text-sm text-[var(--color-muted)]">#{formatNumber(selected.number)}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[var(--color-muted)] hover:text-white text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-inset p-3 text-center">
                  <div className="text-sm text-[var(--color-muted)]">{t('appearances')}</div>
                  <div className="text-xl font-bold font-mono">{selected.totalAppearances}</div>
                </div>
                <div className="glass-inset p-3 text-center">
                  <div className="text-sm text-[var(--color-muted)]">{t('hot_score')}</div>
                  <div className={`text-xl font-bold font-mono ${selected.hotScore >= 60 ? 'text-red-400' : selected.hotScore >= 40 ? 'text-amber-400' : 'text-blue-400'}`}>{selected.hotScore}</div>
                </div>
              </div>
              <div className="glass-inset p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t('recent_10_rate')}</span>
                  <span className="font-mono">{selected.recent10Rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t('recent_20_rate')}</span>
                  <span className="font-mono">{selected.recent20Rate}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t('recent_50_rate')}</span>
                  <span className="font-mono">{selected.recent50Rate}%</span>
                </div>
              </div>
              <div className="glass-inset p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t('current_miss')}</span>
                  <span className="font-mono">{selected.currentMiss}{t('periods')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t('avg_miss')}</span>
                  <span className="font-mono">{selected.avgMiss}{t('periods')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted)]">{t('max_miss')}</span>
                  <span className="font-mono">{selected.maxMiss}{t('periods')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
