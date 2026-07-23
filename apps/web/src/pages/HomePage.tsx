import SmartAlerts from '@/components/alerts/SmartAlerts';
import StatsOverview from '@/components/dashboard/StatsOverview';
import NumberTrendMini from '@/components/analysis/NumberTrendMini';
import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import LatestDrawCard from '@/components/draws/LatestDrawCard';
import DrawHistory from '@/components/draws/DrawHistory';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';
import { SkeletonCard, SkeletonGrid } from '@/components/common/Skeleton';
import { supabase } from '@/utils/supabase';
import { fetchFromCWL, cacheDraws, getCacheTime } from '@/utils/dataFetch';
import { t } from '@/hooks/useI18n';

export default function HomePage() {
  const { draws, loading: drawsLoading, refetch: refetchDraws } = useDraws(20);
  const { stats, loading: statsLoading, refetch: refetchStats } = useNumberStats();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('正在从福彩官网获取数据...');

    // Method 1: Try Edge Function
    try {
      const resp = await fetch('https://gomowvpstlmwcvvgnujo.supabase.co/functions/v1/sync-draws', {
        method: 'POST',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });
      const data = await resp.json();
      if (!data.error) {
        setSyncMsg(`✅ 同步完成: 新增 ${data.inserted} 期，跳过 ${data.skipped} 期`);
        refetchDraws();
        refetchStats();
        setSyncing(false);
        setTimeout(() => setSyncMsg(''), 5000);
        return;
      }
    } catch {}

    // Method 2: Direct CWL API fetch + cache locally
    setSyncMsg('Edge Function 不可用，尝试直接抓取...');
    const result = await fetchFromCWL(200);
    if (result.error) {
      setSyncMsg(`❌ 同步失败: ${result.error}`);
    } else {
      cacheDraws(result.draws);
      setSyncMsg(`✅ 获取到 ${result.count} 期数据（已缓存到本地）`);
      // Try to insert into Supabase
      let inserted = 0;
      const { data: existing } = await supabase.from('draws').select('draw_number');
      const existingSet = new Set((existing || []).map((d: any) => d.draw_number));
      for (const draw of result.draws) {
        if (existingSet.has(draw.draw_number)) continue;
        const { error } = await supabase.from('draws').insert(draw);
        if (!error) inserted++;
      }
      if (inserted > 0) {
        setSyncMsg(`✅ 获取 ${result.count} 期，新增 ${inserted} 期到数据库`);
        refetchDraws();
        refetchStats();
      } else {
        setSyncMsg(`✅ 获取 ${result.count} 期数据（已缓存到本地）`);
      }
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(''), 5000);
  }

  if (drawsLoading || statsLoading)
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonGrid />
        <SkeletonCard />
      </div>
    );

  if (draws.length === 0)
    return <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="text-4xl">Q8</div>
      <div className="text-[var(--color-muted)]">{t('no_data')}</div>
      <button onClick={handleSync} disabled={syncing}
        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/80 disabled:opacity-50">
        {syncing ? '同步中...' : '🔄 同步数据'}
      </button>
      {syncMsg && <div className="text-xs text-[var(--color-muted)]">{syncMsg}</div>}
    </div>;

  const latestDraw = draws[0];
  const recent10 = draws.slice(0, 10);
  const freqMap = new Map<number, number>();
  recent10.forEach(d => d.numbers.forEach(n => freqMap.set(n, (freqMap.get(n) || 0) + 1)));
  const hotNumbers = [...freqMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const sumTrend = recent10.map(d => d.sum_value);
  const avgSum = Math.round(sumTrend.reduce((a, b) => a + b, 0) / sumTrend.length);
  const cacheTime = getCacheTime();

  return (
    <div className="space-y-6">
      <div className="text-xs text-[var(--color-muted)] bg-[var(--color-surface)] rounded-lg px-4 py-2 border border-[var(--color-border)]">
        {t('disclaimer')}
      </div>

      {/* Data Status Bar */}
      <div className="flex items-center justify-between bg-[var(--color-surface)] rounded-lg px-4 py-2 border border-[var(--color-border)]">
        <div className="text-xs text-[var(--color-muted)]">
          数据截至: {latestDraw.draw_date} | 共 {draws.length} 期
          {cacheTime && <span className="ml-2">| 本地缓存: {new Date(cacheTime).toLocaleTimeString()}</span>}
        </div>
        <button onClick={handleSync} disabled={syncing}
          className="text-xs px-3 py-1 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/25 disabled:opacity-50 transition-all">
          {syncing ? '⏳ 同步中...' : '🔄 刷新数据'}
        </button>
      </div>

      {syncMsg && (
        <div className={`text-xs text-center py-2 rounded-lg ${syncMsg.includes('❌') ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {syncMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center hover:border-[var(--color-primary)]/30 transition-colors">
          <div className="text-lg mb-1">📊</div>
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('total_draws')}</div>
          <div className="text-2xl font-bold">{draws.length}</div>
          <div className="text-xs text-[var(--color-muted)]">{t('periods')}</div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center hover:border-amber-500/30 transition-colors">
          <div className="text-lg mb-1">📈</div>
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('avg_sum_10')}</div>
          <div className="text-2xl font-bold font-mono">{avgSum}</div>
          <div className="text-xs text-[var(--color-muted)]">{t('sum')}</div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center hover:border-red-500/30 transition-colors">
          <div className="text-lg mb-1">🔥</div>
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('hot_numbers_10')}</div>
          <div className="flex justify-center gap-1">
            {hotNumbers.slice(0, 3).map(([n]) => (
              <span key={n} className="w-7 h-7 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold">{n.toString().padStart(2, '0')}</span>
            ))}
          </div>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center hover:border-blue-500/30 transition-colors">
          <div className="text-lg mb-1">⚖️</div>
          <div className="text-xs text-[var(--color-muted)] mb-1">{t('odd_even_ratio')}</div>
          <div className="text-2xl font-bold font-mono">{latestDraw.odd_count}:{latestDraw.even_count}</div>
          <div className="text-xs text-[var(--color-muted)]">{t('latest_draw')}</div>
        </div>
      </div>

      <LatestDrawCard draw={latestDraw} />
      <NumberTrendMini count={10} />
      {stats.length > 0 && <NumberGrid stats={stats} />}
      {stats.length > 0 && <HotColdRanking stats={stats} />}
      <DrawHistory draws={draws.slice(1)} />

      <footer className="text-center text-[10px] text-[var(--color-muted)] py-4">
        Quantum8 v1.0 · 数据分析工具 · 不构成投注建议
      </footer>
    </div>
  );
}
