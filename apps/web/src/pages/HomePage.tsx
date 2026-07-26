import SmartAlerts from '@/components/alerts/SmartAlerts';
import StatsOverview from '@/components/dashboard/StatsOverview';
import NumberTrendMini from '@/components/analysis/NumberTrendMini';
import { useState, useEffect, useCallback } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import LatestDrawCard from '@/components/draws/LatestDrawCard';
import DrawHistory from '@/components/draws/DrawHistory';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';
import { SkeletonCard, SkeletonGrid } from '@/components/common/Skeleton';
import { supabase } from '@/utils/supabase';
import { fetchFromCWL, cacheDraws, getDataFreshness } from '@/utils/dataFetch';
import { t } from '@/hooks/useI18n';

export default function HomePage() {
  const { draws, loading: drawsLoading, refetch: refetchDraws } = useDraws(20);
  const { stats, loading: statsLoading, refetch: refetchStats } = useNumberStats();
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Auto-sync: check on page load and every 10 minutes
  const handleSync = useCallback(async (silent = false) => {
    if (syncing) return;
    setSyncing(true);
    if (!silent) setSyncMsg('正在从福彩官网获取最新数据...');
    try {
      const result = await fetchFromCWL(20);
      if (result.error || result.draws.length === 0) {
        if (!silent) setSyncMsg('❌ ' + (result.error || '未获取到数据'));
        setSyncing(false);
        if (!silent) setTimeout(() => setSyncMsg(''), 5000);
        return;
      }
      const { data: existing } = await supabase.from('draws').select('draw_number');
      const existSet = new Set((existing || []).map((d: any) => d.draw_number));
      let inserted = 0;
      for (const draw of result.draws) {
        if (existSet.has(draw.draw_number)) continue;
        const { error } = await supabase.from('draws').insert(draw);
        if (!error) inserted++;
      }
      // Always cache locally
      cacheDraws(result.draws);
      if (inserted > 0) {
        if (!silent) setSyncMsg(`✅ 新增 ${inserted} 期数据（最新: ${result.draws[0].draw_number}）`);
        refetchDraws();
        refetchStats();
      } else {
        if (!silent) setSyncMsg(`✅ 数据已是最新（最新期号: ${result.draws[0]?.draw_number || '未知'}）`);
      }
    } catch (err) {
      if (!silent) setSyncMsg('❌ 同步失败: ' + (err instanceof Error ? err.message : '网络错误'));
    }
    setSyncing(false);
    if (!silent) setTimeout(() => setSyncMsg(''), 8000);
  }, [syncing, refetchDraws, refetchStats]);

  // Auto-sync on page load
  useEffect(() => {
    const freshness = getDataFreshness();
    // Sync if data is stale (>6 hours old) or no cache
    if (freshness.status !== 'fresh') {
      handleSync(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic check every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const freshness = getDataFreshness();
      if (freshness.status !== 'fresh') {
        handleSync(true);
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [handleSync]);

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
      <div className="text-base text-[var(--color-muted)]">{t('no_data')}</div>
      <button onClick={() => handleSync(false)} disabled={syncing}
        className="btn-primary">
        {syncing ? '同步中...' : '同步数据'}
      </button>
      {syncMsg && <div className="text-sm text-[var(--color-muted)]">{syncMsg}</div>}
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
      <div className="text-sm text-[var(--color-muted)] glass-card" style={{ padding: '12px 16px' }}>
        {t('disclaimer')}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '总数据量', value: draws.length, sub: '期', icon: '📊', color: 'text-blue-400' },
          { label: '近10期均和', value: avgSum, sub: '和值', icon: '📈', color: 'text-amber-400' },
          { label: '近10热号', value: hotNumbers.slice(0, 3).map(([n]) => n.toString().padStart(2, '0')).join(' '), sub: '', icon: '🔥', color: 'text-red-400', isNums: true },
          { label: '最新开奖奇偶', value: latestDraw.odd_count + ':' + latestDraw.even_count, sub: '奇:偶', icon: '⚖️', color: 'text-blue-400' },
        ].map(item => (
          <div key={item.label} className="glass-card text-center hover:border-[var(--color-primary)]/30 transition-colors" style={{ padding: '16px 12px' }}>
            <div className="text-xl mb-2">{item.icon}</div>
            <div className="text-sm text-[var(--color-muted)] mb-1">{item.label}</div>
            {(item as any).isNums ? (
              <div className="flex justify-center gap-1">
                {(item.value as string).split(' ').map((n, i) => (
                  <span key={i} className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold font-mono">{n}</span>
                ))}
              </div>
            ) : (
              <div className="text-2xl font-bold font-mono">{item.value}</div>
            )}
            {item.sub && <div className="text-sm text-[var(--color-muted)]">{item.sub}</div>}
          </div>
        ))}
      </div>

      {/* Latest draw card with refresh button */}
      <LatestDrawCard
        draw={latestDraw}
        onRefresh={() => handleSync(false)}
        syncing={syncing}
        syncMsg={syncMsg}
      />

      <NumberTrendMini count={10} />
      {stats.length > 0 && <NumberGrid stats={stats} />}
      {stats.length > 0 && <HotColdRanking stats={stats} />}
      <DrawHistory draws={draws.slice(1)} />

      <footer className="text-center text-sm text-[var(--color-muted)] py-4">
        Quantum8 v5.0 · 数据分析工具 · 不构成投注建议
      </footer>
    </div>
  );
}
