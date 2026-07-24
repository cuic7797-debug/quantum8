import { useMemo, useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { ensembleScoring, markovTransition, bayesianInference, calculateEntropy, trendRegression } from '@quantum8/algorithm';

export default function PredictionScorePage() {
  const { draws, loading: ld } = useDraws(100);
  const { stats, loading: ls } = useNumberStats();
  const [sortBy, setSortBy] = useState<'ensemble' | 'markov' | 'bayesian' | 'entropy' | 'trend'>('ensemble');
  if (ld || ls) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><span className="text-base text-[var(--color-muted)]">加载中...</span></div></div>;
  const [showCount, setShowCount] = useState(40);

  const scores = useMemo(() => {
    if (!draws.length || !stats.length) return [];
    const drawArr = draws.map(d => ({ numbers: d.numbers }));

    const markovResults = Array.from({ length: 80 }, (_, i) => {
      try { return markovTransition(i + 1, drawArr); }
      catch { return { number: i + 1, predictedProb: 0.25 }; }
    });

    const bayesianResults = Array.from({ length: 80 }, (_, i) => {
      try { return bayesianInference(i + 1, drawArr); }
      catch { return { number: i + 1, posteriorProb: 0.25 }; }
    });

    const entropyResults = Array.from({ length: 80 }, (_, i) => {
      try { return calculateEntropy(i + 1, drawArr); }
      catch { return { number: i + 1, entropy: 1, stability: 0, predictability: 0 }; }
    });

    const trendResults = Array.from({ length: 80 }, (_, i) => {
      try { return trendRegression(i + 1, drawArr); }
      catch { return { number: i + 1, slope: 0, r2: 0, predicted: 0.25, trend: '平稳' as const }; }
    });

    const ensembleResults = ensembleScoring(
      drawArr,
      stats.map(s => ({
        number: s.number,
        hotScore: s.hotScore,
        currentMiss: s.currentMiss,
        avgMiss: s.avgMiss,
        missRatio: s.missRatio,
        recent10Rate: s.recent10Rate,
      }))
    );

    return Array.from({ length: 80 }, (_, i) => {
      const n = i + 1;
      const ensemble = ensembleResults.find(e => e.number === n);
      const markov = markovResults.find(m => m.number === n);
      const bayesian = bayesianResults.find(b => b.number === n);
      const entropy = entropyResults.find(e => e.number === n);
      const trend = trendResults.find(t => t.number === n);

      return {
        number: n,
        ensembleScore: ensemble?.ensembleScore || 0,
        markovScore: (markov?.predictedProb || 0.25) * 100,
        bayesianScore: (bayesian?.posteriorProb || 0.25) * 100,
        entropyScore: (entropy?.stability || 0) * 100,
        trendScore: (trend?.predicted || 0.25) * 100,
        trend: trend?.trend || '平稳',
        slope: trend?.slope || 0,
        r2: trend?.r2 || 0,
        rank: ensemble?.rank || n,
      };
    });
  }, [draws, stats]);

  const sorted = useMemo(() => {
    const key = sortBy === 'ensemble' ? 'ensembleScore' :
                sortBy === 'markov' ? 'markovScore' :
                sortBy === 'bayesian' ? 'bayesianScore' :
                sortBy === 'entropy' ? 'entropyScore' : 'trendScore';
    return [...scores].sort((a, b) => b[key] - a[key]);
  }, [scores, sortBy]);

  function getGrade(score: number): { label: string; color: string } {
    if (score >= 70) return { label: 'A+', color: 'text-emerald-400 bg-emerald-500/15' };
    if (score >= 60) return { label: 'A', color: 'text-emerald-400 bg-emerald-500/10' };
    if (score >= 50) return { label: 'B', color: 'text-blue-400 bg-blue-500/10' };
    if (score >= 40) return { label: 'C', color: 'text-amber-400 bg-amber-500/10' };
    if (score >= 30) return { label: 'D', color: 'text-orange-400 bg-orange-500/10' };
    return { label: 'F', color: 'text-red-400 bg-red-500/10' };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold gradient-text-primary">🎯 号码预测评分</h2>
        <div className="flex gap-2">
          {(['ensemble', 'markov', 'bayesian', 'entropy', 'trend'] as const).map(key => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${sortBy === key ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold' : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'}`}>
              {key === 'ensemble' ? '🎯 集成' : key === 'markov' ? '🔗 马尔可夫' : key === 'bayesian' ? '🧮 贝叶斯' : key === 'entropy' ? '📊 熵值' : '📈 趋势'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-3 text-center">
          <div className="text-lg">🏆</div>
          <div className="text-sm text-[var(--color-muted)] mb-1">TOP 1 号码</div>
          {sorted.length > 0 && (
            <>
              <div className="font-bold text-lg">{sorted[0].number.toString().padStart(2, '0')}</div>
              <div className="text-sm text-[var(--color-muted)]">得分 {sorted[0].ensembleScore.toFixed(1)}</div>
            </>
          )}
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg">📈</div>
          <div className="text-sm text-[var(--color-muted)] mb-1">上升趋势</div>
          <div className="font-bold text-lg text-emerald-400">{scores.filter(s => s.trend === '上升').length}</div>
          <div className="text-sm text-[var(--color-muted)]">个号码</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg">📉</div>
          <div className="text-sm text-[var(--color-muted)] mb-1">下降趋势</div>
          <div className="font-bold text-lg text-red-400">{scores.filter(s => s.trend === '下降').length}</div>
          <div className="text-sm text-[var(--color-muted)]">个号码</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-lg">⚖️</div>
          <div className="text-sm text-[var(--color-muted)] mb-1">平稳趋势</div>
          <div className="font-bold text-lg text-amber-400">{scores.filter(s => s.trend === '平稳').length}</div>
          <div className="text-sm text-[var(--color-muted)]">个号码</div>
        </div>
      </div>

      {/* Score Table */}
      <Collapsible title="📊 全部号码评分" step={1} defaultOpen badge={`${showCount}个`}>
        <div className="flex gap-2 mb-3">
          <select value={showCount} onChange={e => setShowCount(+e.target.value)}
            className="text-xs glass-inset px-2 py-1 rounded border border-[var(--glass-border)] bg-transparent">
            <option value={20}>TOP 20</option>
            <option value={40}>TOP 40</option>
            <option value={60}>TOP 60</option>
            <option value={80}>全部 80</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--glass-border)]">
                <th className="py-2 px-2 text-left text-[var(--color-muted)] font-normal">#</th>
                <th className="py-2 px-2 text-center text-[var(--color-muted)] font-normal">号码</th>
                <th className="py-2 px-2 text-center text-[var(--color-muted)] font-normal">等级</th>
                <th className="py-2 px-2 text-center text-[var(--color-muted)] font-normal">集成</th>
                <th className="py-2 px-2 text-center text-[var(--color-muted)] font-normal">马尔可夫</th>
                <th className="py-2 px-2 text-center text-[var(--color-muted)] font-normal">贝叶斯</th>
                <th className="py-2 px-2 text-center text-[var(--color-muted)] font-normal">熵值</th>
                <th className="py-2 px-2 text-center text-[var(--color-muted)] font-normal">趋势</th>
              </tr>
            </thead>
            <tbody>
              {sorted.slice(0, showCount).map((s, i) => {
                const grade = getGrade(s.ensembleScore);
                return (
                  <tr key={s.number} className="border-b border-[var(--glass-border)]/30 hover:bg-white/[0.02]">
                    <td className="py-2 px-2 text-[var(--color-muted)]">{i + 1}</td>
                    <td className="py-2 px-2 text-center"><NumberBall number={s.number} size="sm" /></td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${grade.color}`}>{grade.label}</span>
                    </td>
                    <td className="py-2 px-2 text-center font-mono">{s.ensembleScore.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center font-mono">{s.markovScore.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center font-mono">{s.bayesianScore.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center font-mono">{s.entropyScore.toFixed(1)}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`text-xs ${s.trend === '上升' ? 'text-emerald-400' : s.trend === '下降' ? 'text-red-400' : 'text-amber-400'}`}>
                        {s.trend === '上升' ? '📈' : s.trend === '下降' ? '📉' : '➡️'} {s.trend}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Collapsible>

      {/* Radar Chart for TOP 10 */}
      <Collapsible title="🕸️ TOP 10 号码多维度雷达" step={2} defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {sorted.slice(0, 10).map(s => (
            <div key={s.number} className="glass-card p-3 text-center">
              <NumberBall number={s.number} size="lg" />
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">集成</span><span className="font-mono">{s.ensembleScore.toFixed(0)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">马尔可夫</span><span className="font-mono">{s.markovScore.toFixed(0)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">贝叶斯</span><span className="font-mono">{s.bayesianScore.toFixed(0)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">熵值</span><span className="font-mono">{s.entropyScore.toFixed(0)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-[var(--color-muted)]">趋势</span><span className="font-mono">{s.trendScore.toFixed(0)}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}
