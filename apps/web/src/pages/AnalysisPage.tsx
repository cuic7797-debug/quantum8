import MissTrend from '@/components/analysis/MissTrend';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';
import NumberBall from '@/components/common/NumberBall';
import CorrelationMatrix from '@/components/analysis/CorrelationMatrix';
import NumberLifecycle from '@/components/analysis/NumberLifecycle';
import TrendAnalysis from '@/components/analysis/TrendAnalysis';
import PatternDetection from '@/components/analysis/PatternDetection';
import ProfessionalTrends from '@/components/analysis/ProfessionalTrends';
import MissDashboard from '@/components/analysis/MissDashboard';
import NumberCompare from '@/components/analysis/NumberCompare';
import NumberHeatmap from '@/components/analysis/NumberHeatmap';
import { t } from '@/hooks/useI18n';

export default function AnalysisPage() {
  const { draws, loading: ld } = useDraws(50);
  const { stats, loading: ls } = useNumberStats();
  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length || !stats.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  let h2 = 0, h3 = 0, n = 0;
  draws.forEach(d => {
    const nums = [...d.numbers].sort((a, b) => a - b);
    let mx = 1, s = 1;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === nums[i - 1] + 1) { s++; mx = Math.max(mx, s); } else s = 1;
    }
    if (mx >= 3) h3++; else if (mx >= 2) h2++; else n++;
  });

  const trend = draws.slice(0, 15).map(d => ({ k: d.draw_number.slice(-4), o: d.odd_count, e: d.even_count }));
  const zoneTrend = draws.slice(0, 15).map(d => ({ k: d.draw_number.slice(-4), z1: d.zone1_count, z2: d.zone2_count, z3: d.zone3_count, z4: d.zone4_count }));
  const sumTrend = draws.slice(0, 20).map(d => ({ k: d.draw_number.slice(-4), s: d.sum_value }));
  const topFreq = [...stats].sort((a, b) => b.totalAppearances - a.totalAppearances).slice(0, 20);
  const maxFreq = topFreq[0]?.totalAppearances || 1;
  const bigSmallTrend = draws.slice(0, 15).map(d => ({ k: d.draw_number.slice(-4), b: d.big_count, s: d.small_count }));
  const spanTrend = draws.slice(0, 15).map(d => ({ k: d.draw_number.slice(-4), s: d.span }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('trend_analysis')}</h2>
      <NumberGrid stats={stats} />
      <HotColdRanking stats={stats} />

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('freq_top20')}</h3>
        <div className="space-y-1.5">
          {topFreq.map(s => (
            <div key={s.number} className="flex items-center gap-2 text-sm">
              <NumberBall number={s.number} size="sm" />
              <div className="flex-1 h-5 bg-[var(--color-bg)] rounded overflow-hidden">
                <div className="h-full bg-blue-500 rounded" style={{ width: `${(s.totalAppearances / maxFreq) * 100}%` }} />
              </div>
              <span className="text-xs font-mono w-12 text-right">{s.totalAppearances}次</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('sum_trend')}</h3>
        <div className="flex items-end gap-1 h-32">
          {sumTrend.slice().reverse().map(t2 => {
            const min = Math.min(...sumTrend.map(x => x.s));
            const max = Math.max(...sumTrend.map(x => x.s));
            const range = max - min || 1;
            const h = ((t2.s - min) / range) * 100;
            return (
              <div key={t2.k} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-[var(--color-muted)]">{t2.s}</span>
                <div className="w-full bg-amber-500 rounded-t" style={{ height: `${Math.max(4, h)}%` }} />
                <span className="text-[10px] text-[var(--color-muted)]">{t2.k.slice(-2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('big_small_trend')}</h3>
        <div className="space-y-1">
          {bigSmallTrend.map(t2 => (
            <div key={t2.k} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-[var(--color-muted)] w-8">{t2.k.slice(-2)}</span>
              <div className="flex-1 flex h-4 rounded overflow-hidden">
                <div className="bg-blue-500" style={{ width: `${(t2.b / 20) * 100}%` }} />
                <div className="bg-rose-500" style={{ width: `${(t2.s / 20) * 100}%` }} />
              </div>
              <span className="text-xs font-mono w-10 text-right">{t2.b}:{t2.s}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[var(--color-muted)]">
          <span>{t('big')}</span><span>{t('small')}</span>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('zone_trend')}</h3>
        <div className="space-y-1.5">
          {zoneTrend.map(z => (
            <div key={z.k} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-[var(--color-muted)] w-8">{z.k.slice(-2)}</span>
              <div className="flex-1 flex h-4 rounded overflow-hidden">
                <div className="bg-blue-500" style={{ width: `${(z.z1 / 20) * 100}%` }} title={`${t('zone1')}:${z.z1}`} />
                <div className="bg-emerald-500" style={{ width: `${(z.z2 / 20) * 100}%` }} title={`${t('zone2')}:${z.z2}`} />
                <div className="bg-amber-500" style={{ width: `${(z.z3 / 20) * 100}%` }} title={`${t('zone3')}:${z.z3}`} />
                <div className="bg-rose-500" style={{ width: `${(z.z4 / 20) * 100}%` }} title={`${t('zone4')}:${z.z4}`} />
              </div>
              <span className="text-[10px] font-mono text-[var(--color-muted)] w-16 text-right">{z.z1}:{z.z2}:{z.z3}:{z.z4}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-2 text-[10px] text-[var(--color-muted)]">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500 inline-block" />{t('zone1')}(1-20)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500 inline-block" />{t('zone2')}(21-40)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500 inline-block" />{t('zone3')}(41-60)</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500 inline-block" />{t('zone4')}(61-80)</span>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('odd_even_trend')}</h3>
        <div className="space-y-1">
          {trend.map(t2 => (
            <div key={t2.k} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-[var(--color-muted)] w-8">{t2.k.slice(-2)}</span>
              <div className="flex-1 flex h-4 rounded overflow-hidden">
                <div className="bg-blue-500" style={{ width: `${(t2.o / 20) * 100}%` }} />
                <div className="bg-rose-500" style={{ width: `${(t2.e / 20) * 100}%` }} />
              </div>
              <span className="text-xs font-mono w-10 text-right">{t2.o}:{t2.e}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[var(--color-muted)]">
          <span>{t('odd')}</span><span>{t('even')}</span>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('span_trend')}</h3>
        <div className="flex items-end gap-1 h-24">
          {spanTrend.slice().reverse().map(t2 => {
            const min = Math.min(...spanTrend.map(x => x.s));
            const max = Math.max(...spanTrend.map(x => x.s));
            const range = max - min || 1;
            const h = ((t2.s - min) / range) * 100;
            return (
              <div key={t2.k} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-mono text-[var(--color-muted)]">{t2.s}</span>
                <div className="w-full bg-purple-500 rounded-t" style={{ height: `${Math.max(4, h)}%` }} />
                <span className="text-[10px] text-[var(--color-muted)]">{t2.k.slice(-2)}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('consec_stats')} ({draws.length})</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-2xl font-bold">{h2}</div>
            <div className="text-xs text-[var(--color-muted)]">{t('has_2consec')} {((h2 / draws.length) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-2xl font-bold">{h3}</div>
            <div className="text-xs text-[var(--color-muted)]">{t('has_3consec')} {((h3 / draws.length) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-xs text-[var(--color-muted)]">{t('no_consec')} {((n / draws.length) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      {stats.length > 0 && <MissTrend stats={stats} />}
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('miss_ranking')}</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {[...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 20).map((s, i) => (
            <div key={s.number} className="flex items-center gap-2 text-sm bg-[var(--color-bg)] rounded-lg p-2">
              <span className="text-xs text-[var(--color-muted)] w-4">{i + 1}</span>
              <NumberBall number={s.number} size="sm" />
              <span className="font-mono text-xs">{s.currentMiss}{t('periods')}</span>
            </div>
          ))}
        </div>
      </div>

      <ProfessionalTrends />

      <TrendAnalysis />

      <MissDashboard />

      <NumberHeatmap />

      <NumberCompare />

      <NumberLifecycle />

      <PatternDetection />

      <CorrelationMatrix />
    </div>
  );
}
