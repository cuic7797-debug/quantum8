import type { NumberStat } from '@/hooks/useNumberStats';
import { formatNumber } from '@/utils/format';
import { t } from '@/hooks/useI18n';
interface Props { stats: NumberStat[]; }
export default function NumberGrid({ stats }: Props) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('heat_map')}</h3>
      <div className="grid grid-cols-10 gap-1.5">
        {stats.map((s) => {
          const intensity = Math.min(1, s.hotScore / 100);
          return (
            <div key={s.number} className="flex flex-col items-center p-1.5 rounded-lg transition-all hover:scale-105 cursor-default"
              style={{ backgroundColor: `rgba(239, 68, 68, ${intensity * 0.3})` }}
              title={`#${s.number}`}>
              <span className="text-xs font-mono font-bold">{formatNumber(s.number)}</span>
              <span className="text-[10px] text-[var(--color-muted)]">{s.currentMiss}{t('periods')}</span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3 text-[10px] text-[var(--color-muted)]">
        <span>{t('hot')}</span>
        <span>{t('cold')}</span>
      </div>
    </div>
  );
}
