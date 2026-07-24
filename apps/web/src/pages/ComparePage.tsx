import { useState, useMemo } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { autocorrelation, movingAverage, clusterNumbers } from '@quantum8/algorithm';
import { t } from '@/hooks/useI18n';

export default function ComparePage() {
  const { draws, loading: ld } = useDraws(100);
  const { stats, loading: ls } = useNumberStats();
  const [selected, setSelected] = useState<number[]>([1, 40, 80]);


  const clusterSummary = useMemo(() => clusterNumbers(draws, 50), [draws]);

  const comparisonData = useMemo(() => {
    return selected.map(num => {
      const stat = stats.find(s => s.number === num);
      
      // Appearance history (last 50 draws)
      const history: number[] = [];
      let miss = 0;
      for (let i = draws.length - 1; i >= 0 && history.length < 50; i--) {
        if (draws[i].numbers.includes(num)) {
          history.unshift(miss);
          miss = 0;
        } else {
          miss++;
        }
      }
      history.unshift(miss);

      // Gap analysis
      const appearances: number[] = [];
      draws.forEach((d, i) => { if (d.numbers.includes(num)) appearances.push(i); });
      const gaps: number[] = [];
      for (let i = 1; i < appearances.length; i++) gaps.push(appearances[i] - appearances[i - 1]);
      const avgGap = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

      // Co-occurrence with other selected numbers
      const coAppear = new Map<number, number>();
      draws.forEach(d => {
        if (d.numbers.includes(num)) {
          d.numbers.forEach(n => {
            if (n !== num && selected.includes(n)) {
              coAppear.set(n, (coAppear.get(n) || 0) + 1);
            }
          });
        }
      });

      // Trend (last 10 vs last 20)
      const recent10 = draws.slice(0, 10).filter(d => d.numbers.includes(num)).length;
      const recent20 = draws.slice(0, 20).filter(d => d.numbers.includes(num)).length;
      const trend = recent10 / 10 - recent20 / 20;

      // Cluster
      const cluster = clusterSummary.hot.includes(num) ? 'hot'
        : clusterSummary.warm.includes(num) ? 'warm'
        : clusterSummary.cool.includes(num) ? 'cool' : 'cold';

      return {
        num,
        stat,
        history: history.slice(-30),
        avgGap: avgGap.toFixed(1),
        maxGap: gaps.length > 0 ? Math.max(...gaps) : 0,
        totalAppear: appearances.length,
        coAppear: [...coAppear.entries()].sort((a, b) => b[1] - a[1]),
        trend,
        cluster,
        recent10,
        recent20,
      };
    });
  }, [selected, draws, stats, clusterSummary]);

  const clusterColors: Record<string, { bg: string; text: string; label: string }> = {
    hot: { bg: 'bg-red-500/15', text: 'text-red-400', label: '🔥 热' },
    warm: { bg: 'bg-amber-500/15', text: 'text-amber-400', label: '🌡️ 温' },
    cool: { bg: 'bg-blue-500/15', text: 'text-blue-400', label: '❄️ 冷' },
    cold: { bg: 'bg-slate-500/15', text: 'text-slate-400', label: '🧊 冰' },
  };

  const chartW = 200;
  const chartH = 60;

  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length || !stats.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  function toggleNum(n: number) {
    setSelected(prev =>
      prev.includes(n) ? prev.filter(x => x !== n) : prev.length < 6 ? [...prev, n] : prev
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold gradient-text-primary">⚖️ 号码对比分析</h2>
      <div className="text-sm text-[var(--color-muted)]">选择 2-6 个号码进行深度对比</div>

      {/* Number Selector */}
      <div className="glass-card p-4">
        <div className="text-sm text-[var(--color-muted)] mb-2">选择号码（已选 {selected.length}/6）:</div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 80 }, (_, i) => i + 1).map(n => {
            const idx = selected.indexOf(n);
            return (
              <button key={n} onClick={() => toggleNum(n)}
                className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${
                  idx >= 0
                    ? `bg-[var(--color-primary)] text-white shadow-lg scale-105 ring-2 ring-[var(--color-primary)]/50`
                    : 'glass-inset text-[var(--color-muted)] hover:bg-white/10'
                }`}>
                {n}
              </button>
            );
          })}
        </div>
        {selected.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {selected.map(n => (
              <NumberBall key={n} number={n} size="md" />
            ))}
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {comparisonData.length >= 2 && (
        <Collapsible title="📊 核心指标对比" step={1}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--glass-border)]">
                  <th className="text-left py-2 px-3 text-[var(--color-muted)] font-medium">指标</th>
                  {comparisonData.map(d => (
                    <th key={d.num} className="text-center py-2 px-3">
                      <NumberBall number={d.num} size="sm" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: '分类', fn: (d: typeof comparisonData[0]) => <span className={`${clusterColors[d.cluster].text} font-bold`}>{clusterColors[d.cluster].label}</span> },
                  { label: '总出现', fn: (d: typeof comparisonData[0]) => <span className="font-mono">{d.totalAppear}次</span> },
                  { label: '出现率', fn: (d: typeof comparisonData[0]) => <span className="font-mono">{((d.totalAppear / draws.length) * 100).toFixed(1)}%</span> },
                  { label: '当前遗漏', fn: (d: typeof comparisonData[0]) => <span className="font-mono">{d.stat?.currentMiss || 0}期</span> },
                  { label: '平均间隔', fn: (d: typeof comparisonData[0]) => <span className="font-mono">{d.avgGap}期</span> },
                  { label: '最大遗漏', fn: (d: typeof comparisonData[0]) => <span className="font-mono">{d.maxGap}期</span> },
                  { label: '热度分', fn: (d: typeof comparisonData[0]) => <span className="font-mono">{d.stat?.hotScore || 0}</span> },
                  { label: '近10期', fn: (d: typeof comparisonData[0]) => <span className="font-mono">{d.recent10}次</span> },
                  { label: '趋势', fn: (d: typeof comparisonData[0]) => (
                    <span className={`font-mono ${d.trend > 0 ? 'text-emerald-400' : d.trend < 0 ? 'text-red-400' : 'text-[var(--color-muted)]'}`}>
                      {d.trend > 0 ? '↑' : d.trend < 0 ? '↓' : '→'} {Math.abs(d.trend * 100).toFixed(0)}%
                    </span>
                  )},
                ].map(row => (
                  <tr key={row.label} className="border-b border-[var(--glass-border)]/50">
                    <td className="py-2 px-3 text-[var(--color-muted)] font-medium">{row.label}</td>
                    {comparisonData.map(d => (
                      <td key={d.num} className="text-center py-2 px-3">{row.fn(d)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>
      )}

      {/* Mini Charts */}
      {comparisonData.length >= 2 && (
        <Collapsible title="📈 遗漏趋势对比" step={2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonData.map(d => (
              <div key={d.num} className="glass-inset p-3">
                <div className="flex items-center gap-2 mb-2">
                  <NumberBall number={d.num} size="sm" />
                  <span className="text-xs font-bold">号码 {d.num.toString().padStart(2, '0')}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${clusterColors[d.cluster].bg} ${clusterColors[d.cluster].text}`}>
                    {clusterColors[d.cluster].label}
                  </span>
                </div>
                <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full">
                  <line x1={0} y1={chartH / 2} x2={chartW} y2={chartH / 2} stroke="rgba(148,163,184,0.1)" />
                  <path d={d.history.map((v, i) => {
                    const maxMiss = Math.max(...d.history, 1);
                    const x = (i / (d.history.length - 1)) * chartW;
                    const y = chartH - (v / maxMiss) * (chartH - 10) - 5;
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  }).join(' ')} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
                  {d.history.map((v, i) => {
                    const maxMiss = Math.max(...d.history, 1);
                    const x = (i / (d.history.length - 1)) * chartW;
                    const y = chartH - (v / maxMiss) * (chartH - 10) - 5;
                    return v === 0 ? <circle key={i} cx={x} cy={y} r={3} fill="#10b981" /> : null;
                  })}
                </svg>
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Co-occurrence between selected numbers */}
      {comparisonData.length >= 2 && (
        <Collapsible title="🔗 号码共现关系" step={3}>
          <div className="space-y-3">
            {comparisonData.map(d => (
              <div key={d.num} className="glass-inset p-3">
                <div className="flex items-center gap-2 mb-2">
                  <NumberBall number={d.num} size="sm" />
                  <span className="text-xs font-semibold">与其它选中号码的共现</span>
                </div>
                {d.coAppear.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {d.coAppear.map(([other, count]) => (
                      <span key={other} className="flex items-center gap-1 glass-card px-2 py-1 text-xs">
                        <NumberBall number={other} size="sm" />
                        <span className="text-[var(--color-primary)] font-mono">{count}次</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-[var(--color-muted)]">无共现记录</div>
                )}
              </div>
            ))}
          </div>
        </Collapsible>
      )}

      {/* Recommendation */}
      {comparisonData.length >= 2 && (
        <Collapsible title="🤖 对比结论" step={4}>
          <div className="glass-inset p-4 space-y-3">
            {(() => {
              const sorted = [...comparisonData].sort((a, b) => (b.stat?.hotScore || 0) - (a.stat?.hotScore || 0));
              const best = sorted[0];
              const worst = sorted[sorted.length - 1];
              const rising = comparisonData.filter(d => d.trend > 0.1);
              const falling = comparisonData.filter(d => d.trend < -0.1);
              const overdue = comparisonData.filter(d => (d.stat?.currentMiss || 0) > 10);

              return (
                <>
                  <div className="text-sm text-[var(--color-muted)] leading-relaxed">
                    <p>• <strong>最活跃:</strong> <NumberBall number={best.num} size="sm" /> 热度分 {best.stat?.hotScore}，近10期出现 {best.recent10} 次</p>
                    <p>• <strong>最冷门:</strong> <NumberBall number={worst.num} size="sm" /> 热度分 {worst.stat?.hotScore}，当前遗漏 {worst.stat?.currentMiss} 期</p>
                    {rising.length > 0 && <p>• <strong>上升趋势:</strong> {rising.map(d => <NumberBall key={d.num} number={d.num} size="sm" />)}  近期频率上升</p>}
                    {falling.length > 0 && <p>• <strong>下降趋势:</strong> {falling.map(d => <NumberBall key={d.num} number={d.num} size="sm" />)}  近期频率下降</p>}
                    {overdue.length > 0 && <p>• <strong>深度遗漏:</strong> {overdue.map(d => <NumberBall key={d.num} number={d.num} size="sm" />)}  遗漏超过10期，存在回补可能</p>}
                  </div>
                </>
              );
            })()}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
