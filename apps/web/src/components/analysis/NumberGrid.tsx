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
          // Map hotScore 0-100 to color: blue(cold) -> yellow(warm) -> red(hot)
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
            <div key={s.number} className={`flex flex-col items-center p-1.5 rounded-lg transition-all hover:scale-110 cursor-default ${bg}`}
              title={`#${s.number} hot:${s.hotScore} miss:${s.currentMiss}`}>
              <span className="text-xs font-mono font-bold">{formatNumber(s.number)}</span>
              <span className="text-[10px] text-white/70">{s.currentMiss}d</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[10px] text-[var(--color-muted)]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-800 inline-block" /> 冷</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500 inline-block" /> 温</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500 inline-block" /> 热</span>
        <span>数字=号码 下方=遗漏期数</span>
      </div>
    </div>
  );
}
