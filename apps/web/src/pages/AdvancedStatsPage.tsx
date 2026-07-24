import { useMemo, useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import Collapsible from '@/components/common/Collapsible';
import NumberBall from '@/components/common/NumberBall';
import RadarChart from '@/components/charts/RadarChart';
import { clusterNumbers, getClusterDetails, autocorrelation, movingAverage } from '@quantum8/algorithm';
import { t } from '@/hooks/useI18n';

export default function AdvancedStatsPage() {
  const { draws, loading: ld } = useDraws(100);
  const { stats, loading: ls } = useNumberStats();
  const [selectedNum, setSelectedNum] = useState(1);

  // Chi-square test for uniform distribution
  const chiSquare = useMemo(() => {
    const expected = draws.length * 20 / 80; // each number should appear ~25% of time
    let chi2 = 0;
    for (let n = 1; n <= 80; n++) {
      const observed = stats.find(s => s.number === n)?.totalAppearances || 0;
      chi2 += Math.pow(observed - expected, 2) / expected;
    }
    // Degrees of freedom = 79, critical value at 0.05 = 101.88
    const isUniform = chi2 < 101.88;
    const pValue = Math.max(0, Math.min(1, 1 - chi2 / 200)); // rough approximation
    return { chi2: chi2.toFixed(2), isUniform, pValue: (pValue * 100).toFixed(1) };
  }, [draws, stats]);

  // Linear regression on sum values
  const regression = useMemo(() => {
    const sums = draws.slice(0, 50).map((d, i) => ({ x: i, y: d.sum_value }));
    const n = sums.length;
    const sumX = sums.reduce((a, s) => a + s.x, 0);
    const sumY = sums.reduce((a, s) => a + s.y, 0);
    const sumXY = sums.reduce((a, s) => a + s.x * s.y, 0);
    const sumX2 = sums.reduce((a, s) => a + s.x * s.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predicted = sums.map(s => slope * s.x + intercept);
    const ssRes = sums.reduce((a, s, i) => a + Math.pow(s.y - predicted[i], 2), 0);
    const mean = sumY / n;
    const ssTot = sums.reduce((a, s) => a + Math.pow(s.y - mean, 2), 0);
    const r2 = ssTot > 0 ? (1 - ssRes / ssTot) : 0;
    return { slope, intercept, r2, direction: slope > 0 ? '上升' : slope < 0 ? '下降' : '平稳' };
  }, [draws]);

  // Clustering
  const clusters = useMemo(() => clusterNumbers(draws, 50), [draws]);
  const clusterDetails = useMemo(() => getClusterDetails(draws, 50), [draws]);

  // Selected number radar chart
  const selectedStat = stats.find(s => s.number === selectedNum);
  const selectedCluster = clusterDetails.find(c => c.number === selectedNum);

  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length || !stats.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  const radarData = selectedStat && selectedCluster ? [
    { label: '热度', value: selectedStat.hotScore, maxValue: 100 },
    { label: '频率', value: (selectedStat.totalAppearances / draws.length) * 100, maxValue: 100 },
    { label: '近10期', value: selectedStat.recent10Rate * 100, maxValue: 100 },
    { label: '趋势', value: Math.max(0, (selectedStat.recent10Rate - selectedStat.recent20Rate) * 200 + 50), maxValue: 100 },
    { label: '稳定性', value: Math.max(0, 100 - selectedCluster.features.volatility * 200), maxValue: 100 },
    { label: '回补', value: Math.min(100, selectedStat.currentMiss * 5), maxValue: 100 },
  ] : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold gradient-text-primary">🧪 高级统计分析</h2>

      {/* Hypothesis Testing */}
      <Collapsible title="📊 卡方检验（号码均匀性检验）" step={1}>
        <div className="glass-inset p-4 space-y-3">
          <div className="text-xs text-[var(--color-muted)] leading-relaxed">
            <p><strong>零假设 H₀:</strong> 号码出现服从均匀分布（每个号码出现概率相等）</p>
            <p><strong>检验统计量:</strong> χ² = {chiSquare.chi2}</p>
            <p><strong>自由度:</strong> 79 · <strong>显著性水平:</strong> α = 0.05 · <strong>临界值:</strong> 101.88</p>
          </div>
          <div className={`p-3 rounded-lg ${chiSquare.isUniform ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
            <div className={`text-sm font-bold ${chiSquare.isUniform ? 'text-emerald-400' : 'text-red-400'}`}>
              {chiSquare.isUniform ? '✅ 不拒绝零假设' : '❌ 拒绝零假设'}
            </div>
            <div className="text-xs text-[var(--color-muted)] mt-1">
              {chiSquare.isUniform
                ? `χ² = ${chiSquare.chi2} < 101.88，号码分布与均匀分布无显著差异`
                : `χ² = ${chiSquare.chi2} > 101.88，号码分布与均匀分布有显著差异，某些号码出现频率偏高/偏低`}
            </div>
          </div>
        </div>
      </Collapsible>

      {/* Regression Analysis */}
      <Collapsible title="📈 回归分析（和值趋势）" step={2}>
        <div className="glass-inset p-4 space-y-3">
          <div className="text-xs text-[var(--color-muted)] leading-relaxed">
            <p><strong>模型:</strong> 和值 = {regression.intercept.toFixed(1)} + ({regression.slope.toFixed(3)}) × 期序</p>
            <p><strong>R²:</strong> {regression.r2.toFixed(4)} · <strong>趋势:</strong> {regression.direction}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-3 text-center">
              <div className="text-xs text-[var(--color-muted)]">斜率</div>
              <div className={`font-bold font-mono ${regression.slope > 0 ? 'text-emerald-400' : regression.slope < 0 ? 'text-red-400' : 'text-[var(--color-muted)]'}`}>
                {regression.slope > 0 ? '+' : ''}{regression.slope.toFixed(3)}
              </div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-xs text-[var(--color-muted)]">R² 拟合度</div>
              <div className="font-bold font-mono text-[var(--color-primary)]">{regression.r2.toFixed(4)}</div>
            </div>
            <div className="glass-card p-3 text-center">
              <div className="text-xs text-[var(--color-muted)]">趋势方向</div>
              <div className={`font-bold ${regression.direction === '上升' ? 'text-emerald-400' : regression.direction === '下降' ? 'text-red-400' : 'text-[var(--color-muted)]'}`}>
                {regression.direction === '上升' ? '📈 上升' : regression.direction === '下降' ? '📉 下降' : '➡️ 平稳'}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-[var(--color-muted)]">
            R² 接近 1 表示拟合良好，接近 0 表示无明显线性趋势。当前 R² = {regression.r2.toFixed(4)}，{regression.r2 > 0.3 ? '存在一定线性趋势' : '线性趋势不明显'}
          </div>
        </div>
      </Collapsible>

      {/* Clustering Summary */}
      <Collapsible title="🎯 号码聚类分析" step={3}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '🔥 热号', nums: clusters.hot, color: 'text-red-400', bg: 'bg-red-500/10' },
              { label: '🌡️ 温号', nums: clusters.warm, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: '❄️ 冷号', nums: clusters.cool, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: '🧊 冰号', nums: clusters.cold, color: 'text-slate-400', bg: 'bg-slate-500/10' },
            ].map(c => (
              <div key={c.label} className={`glass-inset p-3 ${c.bg}`}>
                <div className="text-xs font-bold mb-1">{c.label} ({c.nums.length}个)</div>
                <div className="flex flex-wrap gap-0.5">
                  {c.nums.slice(0, 12).map(n => (
                    <span key={n} className="w-6 h-6 rounded text-[9px] font-bold font-mono flex items-center justify-center"
                      style={{ background: `${c.color === 'text-red-400' ? '#ef4444' : c.color === 'text-amber-400' ? '#f59e0b' : c.color === 'text-blue-400' ? '#3b82f6' : '#64748b'}20`, color: c.color.replace('text-', '') }}>
                      {n.toString().padStart(2, '0')}
                    </span>
                  ))}
                  {c.nums.length > 12 && <span className="text-[9px] text-[var(--color-muted)] self-center">+{c.nums.length - 12}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Collapsible>

      {/* Number Radar */}
      <Collapsible title="🎯 号码多维画像" step={4}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setSelectedNum(n)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  selectedNum === n
                    ? 'bg-[var(--color-primary)] text-white shadow'
                    : 'glass-inset text-[var(--color-muted)] hover:bg-white/10'
                }`}>
                {n.toString().padStart(2, '0')}
              </button>
            ))}
          </div>
          <div className="flex justify-center">
            <RadarChart data={radarData} size={280} title={`号码 ${selectedNum.toString().padStart(2, '0')} 多维画像`} />
          </div>
          {selectedStat && (
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="glass-inset p-2">
                <div className="text-[var(--color-muted)]">出现率</div>
                <div className="font-bold font-mono">{((selectedStat.totalAppearances / draws.length) * 100).toFixed(1)}%</div>
              </div>
              <div className="glass-inset p-2">
                <div className="text-[var(--color-muted)]">当前遗漏</div>
                <div className="font-bold font-mono">{selectedStat.currentMiss}期</div>
              </div>
              <div className="glass-inset p-2">
                <div className="text-[var(--color-muted)]">热度分</div>
                <div className="font-bold font-mono">{selectedStat.hotScore}</div>
              </div>
            </div>
          )}
        </div>
      </Collapsible>
    </div>
  );
}
