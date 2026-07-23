import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import CopyButton from '@/components/common/CopyButton';
import Collapsible from '@/components/common/Collapsible';
import { scoreCombination } from '@quantum8/algorithm';

function comb(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
  return Math.round(r);
}

function getCombinations(arr: number[], k: number): number[][] {
  if (k === 0 || arr.length < k) return k === 0 ? [[]] : [];
  const result: number[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    for (const rest of getCombinations(arr.slice(i + 1), k - 1)) {
      result.push([arr[i], ...rest]);
    }
  }
  return result;
}

// Greedy algorithm for rotation matrix
function greedyMatrix(pool: number[], pickCount: number, maxBets: number, stats: any[], totalDraws: number): { bets: number[][]; coverage: number; totalPairs: number; coveredPairs: number } {
  const allCombos = getCombinations(pool, pickCount);
  if (allCombos.length === 0) return { bets: [], coverage: 0, totalPairs: 0, coveredPairs: 0 };

  // Generate all C(pool, 2) pairs for coverage calculation
  const allPairs = new Set<string>();
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      allPairs.add(`${pool[i]}-${pool[j]}`);
    }
  }

  const selected: number[][] = [];
  const coveredPairs = new Set<string>();
  const remaining = [...allCombos];

  // Score each combination
  const scored = remaining.map(c => ({
    combo: c,
    score: scoreCombination(c, stats, totalDraws).totalScore,
  })).sort((a, b) => b.score - a.score);

  // Greedy selection
  while (selected.length < maxBets && scored.length > 0) {
    let bestIdx = 0;
    let bestGain = -1;

    for (let i = 0; i < Math.min(scored.length, 200); i++) {
      const combo = scored[i].combo;
      // Calculate how many new pairs this combo would cover
      let newPairs = 0;
      for (let a = 0; a < combo.length; a++) {
        for (let b = a + 1; b < combo.length; b++) {
          const key = `${combo[a]}-${combo[b]}`;
          if (!coveredPairs.has(key)) newPairs++;
        }
      }
      // Greedy: maximize new pairs + score bonus
      const gain = newPairs + scored[i].score * 0.01;
      if (gain > bestGain) {
        bestGain = gain;
        bestIdx = i;
      }
    }

    const best = scored.splice(bestIdx, 1)[0];
    selected.push(best.combo);

    // Mark covered pairs
    for (let a = 0; a < best.combo.length; a++) {
      for (let b = a + 1; b < best.combo.length; b++) {
        coveredPairs.add(`${best.combo[a]}-${best.combo[b]}`);
      }
    }
  }

  const coverage = allPairs.size > 0 ? (coveredPairs.size / allPairs.size * 100) : 0;
  return {
    bets: selected,
    coverage: parseFloat(coverage.toFixed(1)),
    totalPairs: allPairs.size,
    coveredPairs: coveredPairs.size,
  };
}

export default function MatrixPage() {
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [pool, setPool] = useState<number[]>([]);
  const [pickCount, setPickCount] = useState(8);
  const [maxBets, setMaxBets] = useState(20);
  const [result, setResult] = useState<ReturnType<typeof greedyMatrix> | null>(null);
  const [generating, setGenerating] = useState(false);

  const STORAGE_KEY = 'quantum8_killed_numbers';
  let killedNums: number[] = [];
  try { killedNums = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch {}
  const availableNums = Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !killedNums.includes(n));

  function togglePool(n: number) {
    setPool(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b));
    setResult(null);
  }

  function autoSelectPool() {
    if (!stats.length) return;
    // AI selects best numbers excluding killed ones
    const sorted = [...stats].filter(s => !killedNums.includes(s.number)).sort((a, b) => b.hotScore - a.hotScore);
    const count = Math.max(pickCount, Math.min(20, pickCount + 6));
    setPool(sorted.slice(0, count).map(s => s.number));
    setResult(null);
  }

  function generate() {
    if (pool.length < pickCount || !stats.length || !draws.length) return;
    setGenerating(true);
    setTimeout(() => {
      const r = greedyMatrix(pool, pickCount, maxBets, stats, draws.length);
      setResult(r);
      setGenerating(false);
    }, 100);
  }

  const totalCombos = pool.length >= pickCount ? comb(pool.length, pickCount) : 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">🎰 旋转矩阵</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        ⚠ 通过贪心算法优化号码组合，以最少注数覆盖最多号码对
      </div>

      {/* 选号池 */}
      <Collapsible title="选择号码池" step={1} badge={pool.length + '个号'}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--color-muted)]">已选 {pool.length} 个号，至少需要 {pickCount} 个</span>
          <button onClick={autoSelectPool} className="text-xs text-[var(--color-primary)] hover:underline">🤖 AI推荐号码池</button>
        </div>
        <div className="grid grid-cols-10 gap-1.5">
          {availableNums.map(n => (
            <button key={n} onClick={() => togglePool(n)}
              className={'aspect-square rounded-lg text-xs font-bold transition-all ' + (
                pool.includes(n) ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
              )}>
              {n}
            </button>
          ))}
        </div>
      </Collapsible>

      {/* 参数设置 */}
      <Collapsible title="矩阵参数" step={2} badge={'选' + pickCount + ' ' + maxBets + '注'}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--color-muted)] block mb-1">每注选号数</label>
            <div className="flex gap-1">
              {[5, 6, 7, 8, 9, 10].map(n => (
                <button key={n} onClick={() => { setPickCount(n); setResult(null); }}
                  className={'flex-1 py-1.5 rounded text-xs font-bold ' + (pickCount === n ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] block mb-1">最大注数</label>
            <div className="flex gap-1">
              {[10, 20, 50, 100].map(n => (
                <button key={n} onClick={() => { setMaxBets(n); setResult(null); }}
                  className={'flex-1 py-1.5 rounded text-xs font-bold ' + (maxBets === n ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-3 glass-inset p-2 text-xs text-[var(--color-muted)]">
          号码池 {pool.length} 个号 → C({pool.length},{pickCount}) = {totalCombos} 种组合 → 矩阵优化为 {maxBets} 注
        </div>
      </Collapsible>

      {/* 生成 */}
      <button onClick={generate} disabled={generating || pool.length < pickCount || !stats.length}
        className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-base hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow-lg shadow-[var(--color-primary)]/25">
        {generating ? '生成中...' : '🎯 生成旋转矩阵'}
      </button>

      {/* 结果 */}
      {result && (
        <Collapsible title={'矩阵结果（' + result.bets.length + '注）'} step={3} badge={'覆盖率 ' + result.coverage + '%'} defaultOpen={true}>
          <div className="space-y-3">
            {/* Coverage stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="glass-inset p-2.5 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">总号码对</div>
                <div className="font-bold font-mono text-sm">{result.totalPairs}</div>
              </div>
              <div className="glass-inset p-2.5 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">已覆盖</div>
                <div className="font-bold font-mono text-sm text-emerald-400">{result.coveredPairs}</div>
              </div>
              <div className="glass-inset p-2.5 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">覆盖率</div>
                <div className="font-bold font-mono text-sm text-amber-400">{result.coverage}%</div>
              </div>
            </div>

            {/* Coverage bar */}
            <div className="glass-inset p-2">
              <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all" style={{ width: result.coverage + '%' }} />
              </div>
              <div className="flex justify-between text-[9px] text-[var(--color-muted)] mt-1">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>

            {/* Bets list */}
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {result.bets.map((bet, i) => (
                <div key={i} className="flex items-center gap-2 glass-inset px-3 py-1.5">
                  <span className="text-[10px] text-[var(--color-muted)] w-5 font-mono">{i + 1}</span>
                  <div className="flex gap-0.5 flex-wrap flex-1">
                    {bet.map(n => <NumberBall key={n} number={n} size="sm" />)}
                  </div>
                </div>
              ))}
            </div>

            <CopyButton text={result.bets.map(b => b.join(' ')).join('\n')} label="📋 复制全部矩阵号码" className="w-full justify-center py-2 glass-inset" />
          </div>
        </Collapsible>
      )}
    </div>
  );
}
