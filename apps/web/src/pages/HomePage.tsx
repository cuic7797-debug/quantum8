import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import LatestDrawCard from '@/components/draws/LatestDrawCard';
import DrawHistory from '@/components/draws/DrawHistory';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';
import { t } from '@/hooks/useI18n';

export default function HomePage() {
  const { draws, loading: drawsLoading } = useDraws(20);
  const { stats, loading: statsLoading } = useNumberStats();

  if (drawsLoading || statsLoading)
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (draws.length === 0)
    return <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-4xl">Q8</div>
      <div className="text-[var(--color-muted)]">{t('no_data')}</div>
    </div>;

  const latestDraw = draws[0];
  const recent10 = draws.slice(0, 10);
  const freqMap = new Map<number, number>();
  recent10.forEach(d => d.numbers.forEach(n => freqMap.set(n, (freqMap.get(n) || 0) + 1)));
  const hotNumbers = [...freqMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sumTrend = recent10.map(d => d.sum_value);
  const avgSum = Math.round(sumTrend.reduce((a, b) => a + b, 0) / sumTrend.length);

  return (
    <div className="space-y-6">
      <div className="text-xs text-[var(--color-muted)] bg-[var(--color-surface)] rounded-lg px-4 py-2 border border-[var(--color-border)]">
        {t('disclaimer')}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('total_draws')}</div>
          <div className="text-2xl font-bold">{draws.length}</div>
          <div className="text-xs text-[var(--color-muted)]">{t('periods')}</div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('avg_sum_10')}</div>
          <div className="text-2xl font-bold font-mono">{avgSum}</div>
          <div className="text-xs text-[var(--color-muted)]">{t('sum')}</div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('hot_numbers_10')}</div>
          <div className="flex justify-center gap-1">
            {hotNumbers.slice(0, 3).map(([n]) => (
              <span key={n} className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">{n.toString().padStart(2, '0')}</span>
            ))}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('odd_even_ratio')}</div>
          <div className="text-2xl font-bold font-mono">{latestDraw.odd_count}:{latestDraw.even_count}</div>
          <div className="text-xs text-[var(--color-muted)]">{t('latest_draw')}</div>
        </div>
      </div>

      <LatestDrawCard draw={latestDraw} />
      {stats.length > 0 && <NumberGrid stats={stats} />}
      {stats.length > 0 && <HotColdRanking stats={stats} />}
      <DrawHistory draws={draws.slice(1)} />
    </div>
  );
}
