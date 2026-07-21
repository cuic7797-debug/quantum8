import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import type { ScoreResult, PlayType } from '@quantum8/types';

const PLAY_TYPES: PlayType[] = ['Pick 1','Pick 2','Pick 3','Pick 4','Pick 5','Pick 6','Pick 7','Pick 8','Pick 9','Pick 10'];
const STRATEGIES = [
  { name: 'Conservative', hot: 4, cold: 4, balance: 2, desc: 'Balanced hot/cold, low risk' },
  { name: 'Balanced', hot: 6, cold: 3, balance: 1, desc: 'Lean hot, catch cold rebound' },
  { name: 'Aggressive', hot: 8, cold: 1, balance: 1, desc: 'Follow hot trends, high risk' },
];

export default function SelectionPage() {
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [playType, setPlayType] = useState<PlayType>('Pick 10');
  const [strategyIdx, setStrategyIdx] = useState(1);
  const [results, setResults] = useState<ScoreResult[]>([]);
  const [generating, setGenerating] = useState(false);

  const pickCount = PLAY_TYPES.indexOf(playType) + 1;

  function handleGenerate() {
    if (stats.length === 0 || draws.length === 0) return;
    setGenerating(true);
    setTimeout(() => {
      const strat = STRATEGIES[strategyIdx];
      const config = { hotCount: strat.hot, coldCount: strat.cold, balanceCount: strat.balance, zoneBalance: true, sumRange: [400, 1200] as [number, number], oddEvenRange: [5, 15] as [number, number], maxConsecutive: 3 };
      const candidates = generateBatch(pickCount, 2000);
      const filtered = applyFilters(candidates, config);
      const scored = filtered.slice(0, 50).map((c) => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
      setResults(scored);
      setGenerating(false);
    }, 100);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Smart Pick</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        ⚠️ Results are based on historical data analysis. For reference only, not betting advice.
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">Step 1: Pick Type</h3>
        <div className="flex flex-wrap gap-2">
          {PLAY_TYPES.map((pt) => (
            <button key={pt} onClick={() => setPlayType(pt)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${playType === pt ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-white'}`}>
              {pt}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">Step 2: Strategy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STRATEGIES.map((s, i) => (
            <button key={s.name} onClick={() => setStrategyIdx(i)}
              className={`text-left p-4 rounded-xl border transition-all ${strategyIdx === i ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}>
              <div className="font-semibold mb-1">{s.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <button onClick={handleGenerate} disabled={generating || stats.length === 0}
        className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-lg hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-colors">
        {generating ? 'Generating...' : `Generate ${playType}`}
      </button>
      {results.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">AI Picks for {playType}</h3>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-[var(--color-muted)]">#{i + 1}</span>
                    <div className="flex gap-1">{r.numbers.map((n) => <NumberBall key={n} number={n} size="sm" />)}</div>
                  </div>
                  <div className="flex gap-3 text-[10px] text-[var(--color-muted)]">
                    {r.reasons.map((reason, ri) => <span key={ri}>✓ {reason}</span>)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold font-mono">{r.totalScore}</div>
                  <div className={`text-xs font-medium ${r.riskLevel === 'Low' ? 'text-emerald-400' : r.riskLevel === 'Med' ? 'text-amber-400' : 'text-red-400'}`}>{r.riskLevel} Risk</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
