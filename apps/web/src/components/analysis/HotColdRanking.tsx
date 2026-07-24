import type { NumberStat } from '@/hooks/useNumberStats';
import { formatNumber, getHotColor, getMissColor } from '@/utils/format';
import { t } from '@/hooks/useI18n';

interface Props { stats: NumberStat[]; }

export default function HotColdRanking({ stats }: Props) {
  const hotTop10 = [...stats].sort((a, b) => b.hotScore - a.hotScore).slice(0, 10);
  const coldTop10 = [...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 10);
  const maxHot = hotTop10[0]?.hotScore || 100;
  const maxMiss = coldTop10[0]?.currentMiss || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="glass-card">
        <h3 className="text-base font-semibold mb-4">{t('hot_top10')}</h3>
        <div className="space-y-2.5">
          {hotTop10.map((s, i) => (
            <div key={s.number} className="flex items-center gap-3 text-sm">
              <span className="text-sm text-[var(--color-muted)] w-5">{i + 1}</span>
              <span className="font-mono font-bold w-7 text-base">{formatNumber(s.number)}</span>
              <div className="flex-1 h-5 glass-inset overflow-hidden">
                <div className="h-full bg-red-500/70 rounded" style={{ width: `${(s.hotScore / maxHot) * 100}%` }} />
              </div>
              <span className="text-sm text-[var(--color-muted)] w-14 text-right">{t('recent_10')} {s.recent10Rate}%</span>
              <span className={`font-mono font-bold w-10 text-right text-base ${getHotColor(s.hotScore)}`}>{s.hotScore}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card">
        <h3 className="text-base font-semibold mb-4">{t('cold_top10')}</h3>
        <div className="space-y-2.5">
          {coldTop10.map((s, i) => (
            <div key={s.number} className="flex items-center gap-3 text-sm">
              <span className="text-sm text-[var(--color-muted)] w-5">{i + 1}</span>
              <span className="font-mono font-bold w-7 text-base">{formatNumber(s.number)}</span>
              <div className="flex-1 h-5 glass-inset overflow-hidden">
                <div className="h-full bg-blue-500/70 rounded" style={{ width: `${(s.currentMiss / maxMiss) * 100}%` }} />
              </div>
              <span className="text-sm text-[var(--color-muted)] w-14 text-right">{t('missed')} {s.currentMiss}{t('periods')}</span>
              <span className={`font-mono font-bold w-10 text-right text-base ${getMissColor(s.currentMiss)}`}>{s.missRatio || '-'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
