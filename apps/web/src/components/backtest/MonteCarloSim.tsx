import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { generateBatch, applyFilters, scoreCombination } from '@quantum8/algorithm';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import type { PlayType } from '@quantum8/types';

const PRIZE: Record<string, Record<number, number>> = {
  '选五': { 5: 1000, 4: 30, 3: 3 },
  '选六': { 6: 3000, 5: 200, 4: 10, 3: 1 },
  '选七': { 7: 10000, 6: 800, 5: 50, 4: 5, 3: 1 },
  '选八': { 8: 50000, 7: 3000, 6: 200, 5: 20, 4: 3 },
  '选九': { 9: 200000, 8: 3000, 7: 200, 6: 20, 5: 5, 4: 1 },
  '选十': { 10: 500000, 9: 10000, 8: 500, 7: 30, 6: 5, 5: 1 },
};

interface SimResult {
  median: number;
  p10: number;
  p90: number;
  maxProfit: number;
  maxLoss: number;
  winRate: number;
  avgReturn: number;
  distribution: number[];
}

export default function MonteCarloSim() {
  const { draws } = useDraws(100);
  const { stats } = useNumberStats();
  const [pt, setPt] = useState<PlayType>('选十');
  const [simCount, setSimCount] = useState(1000);
  const [rounds, setRounds] = useState(50);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [progress, setProgress] = useState(0);

  const pc = ['选一','选二','选三','选四','选五','选六','选七','选八','选九','选十'].indexOf(pt) + 1;
  const prizeTable = PRIZE[pt] || {};
  const costPerBet = pc * 2;

  function run() {
    if (draws.length < 10 || !stats.length) return;
    setRunning(true);
    setProgress(0);
    setResult(null);

    const profits: number[] = [];
    let completed = 0;

    function batch() {
      const batchEnd = Math.min(completed + 50, simCount);
      for (let i = completed; i < batchEnd; i++) {
        let totalProfit = 0;
        for (let r = 0; r < rounds; r++) {
          const drawIdx = Math.floor(Math.random() * Math.min(80, draws.length));
          const drawNums = draws[drawIdx].numbers;
          const cfg = { hotCount: Math.min(6, pc), coldCount: Math.min(3, pc), balanceCount: Math.min(1, pc),
            zoneBalance: pc >= 4, sumRange: [pc * 10, pc * 55] as [number, number],
            oddEvenRange: [Math.max(0, Math.round(pc * 0.2)), Math.min(pc, Math.round(pc * 0.8))] as [number, number],
            maxConsecutive: pc <= 3 ? 1 : 2 };
          const combos = applyFilters(generateBatch(pc, 50), cfg);
          if (!combos.length) continue;
          const scored = combos.slice(0, 5).map(c => scoreCombination(c, stats, draws.length));
          const best = scored.sort((a, b) => b.totalScore - a.totalScore)[0];
          const hits = best.numbers.filter(n => drawNums.includes(n)).length;
          const prize = prizeTable[hits] || 0;
          totalProfit += prize - costPerBet;
        }
        profits.push(totalProfit);
      }
      completed = batchEnd;
      setProgress(Math.round((completed / simCount) * 100));
      if (completed < simCount) {
        setTimeout(batch, 0);
      } else {
        profits.sort((a, b) => a - b);
        const median = profits[Math.floor(profits.length * 0.5)];
        const p10 = profits[Math.floor(profits.length * 0.1)];
        const p90 = profits[Math.floor(profits.length * 0.9)];
        const winRate = (profits.filter(p => p > 0).length / profits.length) * 100;
        const avgReturn = profits.reduce((a, b) => a + b, 0) / profits.length;
        const distribution = new Array(21).fill(0);
        const minP = profits[0], maxP = profits[profits.length - 1];
        const step = (maxP - minP) / 20 || 1;
        profits.forEach(p => {
          const idx = Math.min(20, Math.floor((p - minP) / step));
          distribution[idx]++;
        });
        setResult({ median, p10, p90, maxProfit: maxP, maxLoss: profits[0], winRate, avgReturn, distribution });
        setRunning(false);
      }
    }
    batch();
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <div>
        <h3 className="font-semibold">🎲 蒙特卡洛模拟</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">通过大量随机模拟评估策略的长期期望收益</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-[var(--color-muted)] block mb-1">玩法</label>
          <select value={pt} onChange={e => setPt(e.target.value as PlayType)}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
            {['选五','选六','选七','选八','选九','选十'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--color-muted)] block mb-1">模拟次数</label>
          <select value={simCount} onChange={e => setSimCount(+e.target.value)}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
            <option value={500}>500次</option>
            <option value={1000}>1000次</option>
            <option value={3000}>3000次</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--color-muted)] block mb-1">每轮期数</label>
          <select value={rounds} onChange={e => setRounds(+e.target.value)}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
            <option value={20}>20期</option>
            <option value={50}>50期</option>
            <option value={100}>100期</option>
          </select>
        </div>
      </div>

      <button onClick={run} disabled={running || !draws.length}
        className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all">
        {running ? `模拟中... ${progress}%` : '开始模拟'}
      </button>

      {running && (
        <div className="w-full h-2 bg-[var(--color-bg)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '中位收益', value: `${result.median > 0 ? '+' : ''}${result.median.toFixed(0)}元`, color: result.median >= 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: '胜率', value: `${result.winRate.toFixed(1)}%`, color: result.winRate >= 50 ? 'text-emerald-400' : 'text-amber-400' },
              { label: '最大盈利', value: `+${result.maxProfit.toFixed(0)}元`, color: 'text-emerald-400' },
              { label: '最大亏损', value: `${result.maxLoss.toFixed(0)}元`, color: 'text-red-400' },
            ].map(item => (
              <div key={item.label} className="bg-[var(--color-bg)] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">{item.label}</div>
                <div className={`font-bold font-mono text-sm mt-1 ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-xs text-[var(--color-muted)] mb-2">收益分布</div>
            <div className="flex items-end gap-0.5 h-20">
              {result.distribution.map((count, i) => {
                const max = Math.max(...result.distribution);
                const h = max > 0 ? (count / max) * 100 : 0;
                const midpoint = result.distribution.length / 2;
                const color = i < midpoint ? 'bg-red-500/60' : i === Math.floor(midpoint) ? 'bg-amber-500' : 'bg-emerald-500/60';
                return <div key={i} className={`flex-1 ${color} rounded-t`} style={{ height: `${Math.max(2, h)}%` }} />;
              })}
            </div>
            <div className="flex justify-between text-[10px] text-[var(--color-muted)] mt-1">
              <span>亏损 {Math.abs(result.maxLoss).toFixed(0)}</span>
              <span>0</span>
              <span>盈利 +{result.maxProfit.toFixed(0)}</span>
            </div>
          </div>

          <div className="bg-[var(--color-bg)] rounded-lg p-3">
            <div className="text-xs text-[var(--color-muted)] mb-1">置信区间</div>
            <div className="text-xs">
              10%分位: <span className="font-mono text-red-400">{result.p10 > 0 ? '+' : ''}{result.p10.toFixed(0)}元</span>
              {' · '}90%分位: <span className="font-mono text-emerald-400">+{result.p90.toFixed(0)}元</span>
              {' · '}期望值: <span className="font-mono">{result.avgReturn > 0 ? '+' : ''}{result.avgReturn.toFixed(0)}元/轮</span>
            </div>
          </div>

          <div className="text-[10px] text-[var(--color-muted)] text-center">
            ⚠ 模拟结果基于历史数据，不代表未来收益。{costPerBet}元/注 × {rounds}期 = 每轮投入{costPerBet * rounds}元
          </div>
        </div>
      )}
    </div>
  );
}
