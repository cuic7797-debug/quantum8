import { useState, useMemo } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { ensembleScoring, markovTransition, bayesianInference, calculateEntropy, trendRegression } from '@quantum8/algorithm';

interface StrategyPreset {
  name: string;
  icon: string;
  description: string;
  config: {
    hotRatio: number;
    coldRatio: number;
    balanceRatio: number;
    preferTrend: 'rising' | 'stable' | 'mixed';
    riskLevel: 'conservative' | 'moderate' | 'aggressive';
  };
}

const PRESETS: StrategyPreset[] = [
  {
    name: '稳健防守',
    icon: '🛡️',
    description: '以冷号回补+均衡选号为主，降低风险',
    config: { hotRatio: 0.2, coldRatio: 0.4, balanceRatio: 0.4, preferTrend: 'stable', riskLevel: 'conservative' },
  },
  {
    name: '趋势追踪',
    icon: '📈',
    description: '追踪热号趋势+上升期号码，抓住连热期',
    config: { hotRatio: 0.5, coldRatio: 0.1, balanceRatio: 0.4, preferTrend: 'rising', riskLevel: 'moderate' },
  },
  {
    name: '冷热均衡',
    icon: '⚖️',
    description: '热号30%+冷号30%+均衡40%，经典策略',
    config: { hotRatio: 0.3, coldRatio: 0.3, balanceRatio: 0.4, preferTrend: 'mixed', riskLevel: 'moderate' },
  },
  {
    name: '激进进攻',
    icon: '🚀',
    description: '集中热号+高概率号码，追求高命中率',
    config: { hotRatio: 0.6, coldRatio: 0.05, balanceRatio: 0.35, preferTrend: 'rising', riskLevel: 'aggressive' },
  },
  {
    name: '冷号猎手',
    icon: '❄️',
    description: '专注长期遗漏号码的回补机会',
    config: { hotRatio: 0.1, coldRatio: 0.6, balanceRatio: 0.3, preferTrend: 'mixed', riskLevel: 'moderate' },
  },
  {
    name: 'AI 全能',
    icon: '🤖',
    description: '综合马尔可夫/贝叶斯/集成评分等全部算法',
    config: { hotRatio: 0.25, coldRatio: 0.25, balanceRatio: 0.5, preferTrend: 'mixed', riskLevel: 'moderate' },
  },
];

export default function AIPlaybookPage() {
  const { draws } = useDraws(100);
  const { stats } = useNumberStats();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customHot, setCustomHot] = useState(30);
  const [customCold, setCustomCold] = useState(30);
  const [customBalance, setCustomBalance] = useState(40);
  const [selectCount, setSelectCount] = useState(8);
  const [groupCount, setGroupCount] = useState(5);
  const [generated, setGenerated] = useState<number[][]>([]);

  const aiScores = useMemo(() => {
    if (!draws.length || !stats.length) return [];
    try {
      return ensembleScoring(
        draws.map(d => ({ numbers: d.numbers })),
        stats.map(s => ({
          number: s.number,
          hotScore: s.hotScore,
          currentMiss: s.currentMiss,
          avgMiss: s.avgMiss,
          missRatio: s.missRatio,
          recent10Rate: s.recent10Rate,
        }))
      );
    } catch { return []; }
  }, [draws, stats]);

  const markovScores = useMemo(() => {
    if (!draws.length) return [];
    return Array.from({ length: 80 }, (_, i) => {
      try { return markovTransition(i + 1, draws.map(d => ({ numbers: d.numbers }))); }
      catch { return { number: i + 1, predictedProb: 0.25 }; }
    }).sort((a, b) => b.predictedProb - a.predictedProb);
  }, [draws]);

  const bayesianScores = useMemo(() => {
    if (!draws.length) return [];
    return Array.from({ length: 80 }, (_, i) => {
      try { return bayesianInference(i + 1, draws.map(d => ({ numbers: d.numbers }))); }
      catch { return { number: i + 1, posteriorProb: 0.25 }; }
    }).sort((a, b) => b.posteriorProb - a.posteriorProb);
  }, [draws]);

  const trendScores = useMemo(() => {
    if (!draws.length) return [];
    return Array.from({ length: 80 }, (_, i) => {
      try { return trendRegression(i + 1, draws.map(d => ({ numbers: d.numbers }))); }
      catch { return { number: i + 1, predicted: 0.25, trend: '平稳' as const }; }
    }).sort((a, b) => b.predicted - a.predicted);
  }, [draws]);

  function generate() {
    if (!aiScores.length || selectedPreset === null) return;
    const preset = PRESETS[selectedPreset];
    const hotN = Math.floor(selectCount * preset.config.hotRatio);
    const coldN = Math.floor(selectCount * preset.config.coldRatio);
    const balN = selectCount - hotN - coldN;

    // Build candidate pools
    const hotPool = aiScores.filter(s => s.markovScore > 50 || s.frequencyScore > 50).map(s => s.number);
    const coldPool = aiScores.filter(s => s.missScore > 50).map(s => s.number);
    const trendPool = trendScores.filter(s => s.trend === '上升').map(s => s.number);

    // Also add markov and bayesian top picks
    const markovTop = markovScores.slice(0, 15).map(s => s.number);
    const bayesTop = bayesianScores.slice(0, 15).map(s => s.number);

    const allScores = new Map<number, number>();
    aiScores.forEach(s => allScores.set(s.number, s.ensembleScore));

    const groups: number[][] = [];
    for (let g = 0; g < groupCount; g++) {
      const selected = new Set<number>();

      // Pick hot numbers
      const hotCandidates = hotPool.filter(n => !selected.has(n)).sort((a, b) => (allScores.get(b) || 0) - (allScores.get(a) || 0));
      for (let i = 0; i < hotN && i < hotCandidates.length; i++) selected.add(hotCandidates[i]);

      // Pick cold numbers
      const coldCandidates = coldPool.filter(n => !selected.has(n)).sort((a, b) => (allScores.get(b) || 0) - (allScores.get(a) || 0));
      for (let i = 0; i < coldN && i < coldCandidates.length; i++) selected.add(coldCandidates[i]);

      // Pick trend numbers
      const trendCandidates = trendPool.filter(n => !selected.has(n));
      for (let i = 0; i < balN && i < trendCandidates.length; i++) selected.add(trendCandidates[i]);

      // Fill remaining with ensemble top picks
      const remaining = aiScores.filter(s => !selected.has(s.number)).sort((a, b) => b.ensembleScore - a.ensembleScore);
      while (selected.size < selectCount && remaining.length > 0) {
        selected.add(remaining.shift()!.number);
      }

      // Shuffle and take exactly selectCount
      const nums = [...selected].sort(() => Math.random() - 0.5).slice(0, selectCount).sort((a, b) => a - b);
      if (nums.length === selectCount) groups.push(nums);
    }

    setGenerated(groups);
  }

  function copyGroup(nums: number[]) {
    navigator.clipboard.writeText(nums.map(n => n.toString().padStart(2, '0')).join(' '));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-primary">🧠 AI 策略生成器</h2>
        <div className="text-sm text-[var(--color-muted)]">基于 {draws.length} 期数据</div>
      </div>

      {/* Strategy Presets */}
      <Collapsible title="📋 选择策略模板" step={1} defaultOpen>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => setSelectedPreset(i)}
              className={`glass-card p-3 text-left transition-all hover:scale-[1.02] ${
                selectedPreset === i ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10' : ''
              }`}>
              <div className="text-2xl mb-2">{p.icon}</div>
              <div className="font-semibold text-sm mb-1">{p.name}</div>
              <div className="text-sm text-[var(--color-muted)] leading-tight">{p.description}</div>
              <div className="flex gap-1 mt-2">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  p.config.riskLevel === 'conservative' ? 'bg-emerald-500/15 text-emerald-400' :
                  p.config.riskLevel === 'moderate' ? 'bg-amber-500/15 text-amber-400' :
                  'bg-red-500/15 text-red-400'
                }`}>
                  {p.config.riskLevel === 'conservative' ? '低风险' : p.config.riskLevel === 'moderate' ? '中风险' : '高风险'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </Collapsible>

      {/* Custom Config */}
      <Collapsible title="⚙️ 自定义参数" step={2} defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">热号比例: {customHot}%</label>
            <input type="range" min={0} max={80} value={customHot} onChange={e => { setCustomHot(+e.target.value); setCustomBalance(100 - +e.target.value - customCold); }}
              className="w-full accent-[var(--color-primary)]" />
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">冷号比例: {customCold}%</label>
            <input type="range" min={0} max={80} value={customCold} onChange={e => { setCustomCold(+e.target.value); setCustomBalance(100 - customHot - +e.target.value); }}
              className="w-full accent-[var(--color-primary)]" />
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">均衡比例: {customBalance}%</label>
            <div className="text-sm text-[var(--color-muted)]">（热+冷+均衡=100%）</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">每组选号数</label>
            <select value={selectCount} onChange={e => setSelectCount(+e.target.value)}
              className="w-full glass-inset px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-transparent">
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>选{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">生成组数 (最多10)</label>
            <input type="number" min={1} max={10} value={groupCount} onChange={e => setGroupCount(Math.min(10, Math.max(1, +e.target.value)))}
              className="w-full glass-inset px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-transparent" />
          </div>
        </div>
      </Collapsible>

      {/* AI Algorithm Scores */}
      <Collapsible title="📊 AI 算法评分面板" step={3} defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <div className="glass-card p-3 text-center">
            <div className="text-lg">🔗</div>
            <div className="text-sm text-[var(--color-muted)]">马尔可夫链</div>
            <div className="text-xs font-bold text-blue-400">{markovScores.length > 0 ? '✓ 已计算' : '无数据'}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg">🧮</div>
            <div className="text-sm text-[var(--color-muted)]">贝叶斯推断</div>
            <div className="text-xs font-bold text-purple-400">{bayesianScores.length > 0 ? '✓ 已计算' : '无数据'}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg">📈</div>
            <div className="text-sm text-[var(--color-muted)]">趋势回归</div>
            <div className="text-xs font-bold text-emerald-400">{trendScores.length > 0 ? '✓ 已计算' : '无数据'}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-lg">🎯</div>
            <div className="text-sm text-[var(--color-muted)]">集成评分</div>
            <div className="text-xs font-bold text-amber-400">{aiScores.length > 0 ? '✓ 已计算' : '无数据'}</div>
          </div>
        </div>
        {aiScores.length > 0 && (
          <div className="space-y-1">
            <div className="text-sm text-[var(--color-muted)] mb-2">AI 推荐 TOP 15：</div>
            {aiScores.slice(0, 15).map((s, i) => (
              <div key={s.number} className="flex items-center gap-2 py-1">
                <span className="text-sm text-[var(--color-muted)] w-6 text-right">{i + 1}</span>
                <NumberBall number={s.number} size="sm" />
                <div className="flex-1 h-3 glass-inset overflow-hidden rounded">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded" style={{ width: `${s.ensembleScore}%` }} />
                </div>
                <span className="text-xs font-mono w-10 text-right">{s.ensembleScore}分</span>
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* Generate Button */}
      <div className="flex justify-center">
        <button onClick={generate} disabled={selectedPreset === null || !aiScores.length}
          className="btn-primary px-8 py-3 text-base font-bold disabled:opacity-40 hover:scale-[1.02] transition-transform">
          🎯 生成推荐号码
        </button>
      </div>

      {/* Results */}
      {generated.length > 0 && (
        <Collapsible title={`🎯 生成结果（${generated.length}组）`} step={4} defaultOpen badge={`${generated.length}组`}>
          <div className="space-y-3">
            {generated.map((group, gi) => (
              <div key={gi} className="glass-card p-3 flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/15 flex items-center justify-center text-sm font-bold text-[var(--color-primary)] shrink-0">
                  {gi + 1}
                </div>
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {group.map(n => <NumberBall key={n} number={n} size="md" />)}
                </div>
                <button onClick={() => copyGroup(group)} className="text-xs text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors px-2 py-1 rounded hover:bg-white/5 shrink-0">
                  📋 复制
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-4">
            <button onClick={() => {
              const all = generated.map(g => g.map(n => n.toString().padStart(2, '0')).join(' ')).join('\n');
              navigator.clipboard.writeText(all);
            }} className="btn-secondary text-sm">📋 全部复制</button>
            <button onClick={generate} className="btn-secondary text-sm">🔄 重新生成</button>
          </div>
        </Collapsible>
      )}
    </div>
  );
}
