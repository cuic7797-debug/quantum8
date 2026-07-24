import { useMemo } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import Collapsible from '@/components/common/Collapsible';
import { t } from '@/hooks/useI18n';

export default function DataQualityPage() {
  const { draws, loading: ld } = useDraws(200);
  const { stats, loading: ls } = useNumberStats();

  const quality = useMemo(() => {
    if (!draws.length) return null;

    const totalExpected = 80;
    const numbersSeen = new Set<number>();
    draws.forEach(d => d.numbers.forEach(n => numbersSeen.add(n)));
    const coverage = (numbersSeen.size / totalExpected) * 100;

    const dates = draws.map(d => d.draw_date).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const drawNums = draws.map(d => parseInt(d.draw_number.replace(/\D/g, ''))).sort((a, b) => a - b);
    let gaps = 0;
    for (let i = 1; i < drawNums.length; i++) {
      if (drawNums[i] - drawNums[i - 1] > 1) gaps++;
    }

    const now = new Date();
    const lastDrawDate = new Date(lastDate);
    const hoursSinceLastDraw = Math.round((now.getTime() - lastDrawDate.getTime()) / (1000 * 60 * 60));
    const freshness = hoursSinceLastDraw < 24 ? 'fresh' : hoursSinceLastDraw < 72 ? 'stale' : 'old';

    const freq = new Map<number, number>();
    draws.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
    const freqValues = [...freq.values()];
    const avgFreq = freqValues.reduce((a, b) => a + b, 0) / freqValues.length;
    const stdFreq = Math.sqrt(freqValues.reduce((s, f) => s + Math.pow(f - avgFreq, 2), 0) / freqValues.length);
    const cv = (stdFreq / avgFreq) * 100;

    const missing = Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !numbersSeen.has(n));

    return {
      totalDraws: draws.length,
      coverage,
      firstDate,
      lastDate,
      gaps,
      hoursSinceLastDraw,
      freshness,
      avgFreq: avgFreq.toFixed(1),
      cv: cv.toFixed(1),
      missing,
      numbersSeen: numbersSeen.size,
    };
  }, [draws]);

  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;
  if (!quality) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">暂无数据</div>;

  const freshnessConfig: Record<string, { color: string; bg: string; label: string; desc: string }> = {
    fresh: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', label: '✅ 数据新鲜', desc: '数据在24小时内' },
    stale: { color: 'text-amber-400', bg: 'bg-amber-500/15', label: '⚠️ 数据较旧', desc: '数据超过24小时' },
    old: { color: 'text-red-400', bg: 'bg-red-500/15', label: '❌ 数据过期', desc: '数据超过72小时' },
  };
  const fConfig = freshnessConfig[quality.freshness] || freshnessConfig.fresh;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold gradient-text-primary">📊 数据质量仪表盘</h2>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--color-muted)]">数据状态总览</h3>
          <span className={`text-xs px-3 py-1 rounded-full ${fConfig.bg} ${fConfig.color} font-bold`}>{fConfig.label}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '总期数', value: quality.totalDraws, icon: '📊', color: 'text-blue-400' },
            { label: '号码覆盖', value: quality.coverage.toFixed(0) + '%', icon: '🎯', color: quality.coverage >= 95 ? 'text-emerald-400' : 'text-amber-400' },
            { label: '缺失期数', value: quality.gaps, icon: '🔍', color: quality.gaps === 0 ? 'text-emerald-400' : 'text-red-400' },
            { label: '数据更新', value: quality.hoursSinceLastDraw + 'h', icon: '⏰', color: fConfig.color },
          ].map(item => (
            <div key={item.label} className="glass-inset p-3 text-center">
              <div className="text-lg">{item.icon}</div>
              <div className={`font-bold font-mono text-lg mt-1 ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-[var(--color-muted)]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <Collapsible title="📋 数据详情" step={1}>
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-inset p-3">
            <div className="text-[10px] text-[var(--color-muted)]">起始日期</div>
            <div className="font-mono text-sm font-bold">{quality.firstDate}</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-[10px] text-[var(--color-muted)]">最新日期</div>
            <div className="font-mono text-sm font-bold">{quality.lastDate}</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-[10px] text-[var(--color-muted)]">覆盖号码</div>
            <div className="font-mono text-sm font-bold">{quality.numbersSeen}/80</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-[10px] text-[var(--color-muted)]">频率变异系数</div>
            <div className="font-mono text-sm font-bold">{quality.cv}%</div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="⚖️ 号码分布均衡性" step={2}>
        <div className="text-xs text-[var(--color-muted)] mb-2">
          变异系数 (CV) = {quality.cv}% {parseFloat(quality.cv) < 15 ? '✅ 分布较均衡' : parseFloat(quality.cv) < 25 ? '⚠️ 分布略有偏态' : '❌ 分布不均衡'}
        </div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 80 }, (_, i) => i + 1).map(n => {
            const freqCount = draws.reduce((count, d) => count + (d.numbers.includes(n) ? 1 : 0), 0);
            const maxFreqCount = Math.max(...Array.from({ length: 80 }, (_, i) => draws.reduce((count, d) => count + (d.numbers.includes(i + 1) ? 1 : 0), 0)));
            const intensity = maxFreqCount > 0 ? freqCount / maxFreqCount : 0;
            return (
              <div key={n} className="aspect-square rounded flex items-center justify-center text-[8px] font-mono"
                style={{
                  background: `rgba(59, 130, 246, ${intensity * 0.8})`,
                  color: intensity > 0.5 ? 'white' : 'var(--color-muted)',
                }}
                title={`${n.toString().padStart(2, '0')}: ${freqCount}次`}>
                {n}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1">
          <span>浅色 = 低频</span>
          <span>深色 = 高频</span>
        </div>
      </Collapsible>

      {quality.missing.length > 0 && (
        <Collapsible title={`❌ 未出现号码 (${quality.missing.length}个)`} step={3}>
          <div className="text-xs text-[var(--color-muted)] mb-2">以下号码在 {quality.totalDraws} 期数据中从未出现:</div>
          <div className="flex flex-wrap gap-1">
            {quality.missing.map(n => (
              <span key={n} className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center text-xs font-bold font-mono">
                {n.toString().padStart(2, '0')}
              </span>
            ))}
          </div>
        </Collapsible>
      )}

      <Collapsible title="⏰ 数据新鲜度" step={4}>
        <div className="glass-inset p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`text-4xl ${fConfig.color}`}>{quality.freshness === 'fresh' ? '🟢' : quality.freshness === 'stale' ? '🟡' : '🔴'}</div>
            <div>
              <div className={`text-sm font-bold ${fConfig.color}`}>{fConfig.label}</div>
              <div className="text-xs text-[var(--color-muted)]">{fConfig.desc}</div>
            </div>
          </div>
          <div className="text-xs text-[var(--color-muted)] space-y-1">
            <p>• 最新一期: {quality.lastDate} {quality.hoursSinceLastDraw}小时前</p>
            <p>• 数据范围: {quality.firstDate} ~ {quality.lastDate}</p>
            <p>• 建议: {quality.freshness === 'fresh' ? '数据正常，可放心使用' : '建议刷新数据以获取最新分析'}</p>
          </div>
        </div>
      </Collapsible>
    </div>
  );
}
