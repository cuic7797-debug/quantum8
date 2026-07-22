import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { generateRandomCombination } from '@quantum8/algorithm';
import type { PlayType } from '@quantum8/types';

const PLAY_TYPES: PlayType[] = ['选五','选六','选七','选八','选九','选十'];
const PRIZE_TABLE: Record<string, Record<number, number>> = {
  '选五': { 5: 1000, 4: 30, 3: 3 }, '选六': { 6: 3000, 5: 200, 4: 10, 3: 1 },
  '选七': { 7: 10000, 6: 800, 5: 50, 4: 5, 3: 1 }, '选八': { 8: 50000, 7: 3000, 6: 200, 5: 20, 4: 3 },
  '选九': { 9: 200000, 8: 3000, 7: 200, 6: 20, 5: 5, 4: 1 }, '选十': { 10: 500000, 9: 10000, 8: 500, 7: 30, 6: 5, 5: 1 },
};
interface BacktestRow { period: string; numbers: number[]; hitCount: number; prize: number; }
interface BacktestSummary { totalRounds: number; totalBets: number; totalHits: number; hitRate: number; totalCost: number; totalPrize: number; roi: number; rows: BacktestRow[]; }

export default function BacktestPage() {
  const { draws } = useDraws(500);
  const [playType, setPlayType] = useState<PlayType>('选十');
  const [betCount, setBetCount] = useState(1);
  const [result, setResult] = useState<BacktestSummary | null>(null);
  const [running, setRunning] = useState(false);
  const pickCount = PLAY_TYPES.indexOf(playType) + 5;

  function handleBacktest() {
    if (draws.length < 10) return;
    setRunning(true);
    setTimeout(() => {
      const table = PRIZE_TABLE[playType] || {};
      const testDraws = draws.slice(1);
      const rows: BacktestRow[] = [];
      let totalHits = 0, totalPrize = 0;
      for (let i = 0; i < testDraws.length; i++) {
        const target = testDraws[i].numbers;
        let bestHit = 0;
        for (let b = 0; b < betCount; b++) {
          const pick = generateRandomCombination(pickCount);
          const hit = pick.filter((n) => target.includes(n)).length;
          if (hit > bestHit) bestHit = hit;
        }
        const prize = table[bestHit] || 0;
        totalHits += bestHit > 0 ? 1 : 0;
        totalPrize += prize;
        if (i < 30) rows.push({ period: testDraws[i].draw_number, numbers: target, hitCount: bestHit, prize });
      }
      const totalBets = testDraws.length * betCount;
      const totalCost = totalBets * 2;
      setResult({ totalRounds: testDraws.length, totalBets, totalHits, hitRate: parseFloat(((totalHits / testDraws.length) * 100).toFixed(2)), totalCost, totalPrize, roi: totalCost > 0 ? parseFloat((((totalPrize - totalCost) / totalCost) * 100).toFixed(2)) : 0, rows });
      setRunning(false);
    }, 200);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">策略回测</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">⚠️ 回测结果基于历史数据模拟，不代表未来表现，仅供参考。</div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
        <div><h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">玩法</h3><div className="flex flex-wrap gap-2">{PLAY_TYPES.map((pt) => (<button key={pt} onClick={() => setPlayType(pt)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${playType === pt ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-white'}`}>{pt}</button>))}</div></div>
        <div><h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">每期注数</h3><div className="flex gap-2">{[1, 3, 5, 10].map((n) => (<button key={n} onClick={() => setBetCount(n)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${betCount === n ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-white'}`}>{n}注</button>))}</div></div>
        <button onClick={handleBacktest} disabled={running || draws.length < 10} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-colors">{running ? '回测中...' : `开始回测（最近 ${Math.min(draws.length - 1, 500)} 期）`}</button>
      </div>
      {result && (<>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5"><h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">回测结果</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-xl font-bold">{result.totalRounds}</div><div className="text-xs text-[var(--color-muted)]">测试期数</div></div><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-xl font-bold">{result.hitRate}%</div><div className="text-xs text-[var(--color-muted)]">命中率</div></div><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-xl font-bold font-mono">¥{result.totalCost}</div><div className="text-xs text-[var(--color-muted)]">总投入</div></div><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className={`text-xl font-bold font-mono ${result.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{result.roi >= 0 ? '+' : ''}{result.roi}%</div><div className="text-xs text-[var(--color-muted)]">收益率</div></div></div></div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5"><h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">近期明细</h3><div className="space-y-2">{result.rows.map((row, i) => (<div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0 text-sm"><div className="flex items-center gap-2"><span className="font-mono text-xs text-[var(--color-muted)] w-20">{row.period}</span><div className="flex gap-0.5">{row.numbers.slice(0, 10).map((n) => <NumberBall key={n} number={n} size="sm" />)}{row.numbers.length > 10 && <span className="text-xs text-[var(--color-muted)]">...+{row.numbers.length - 10}</span>}</div></div><div className="flex items-center gap-3 shrink-0"><span className={`font-mono font-bold ${row.hitCount >= 5 ? 'text-emerald-400' : row.hitCount >= 3 ? 'text-amber-400' : 'text-[var(--color-muted)]'}`}>中{row.hitCount}</span><span className="font-mono text-xs">{row.prize > 0 ? `¥${row.prize}` : '-'}</span></div></div>))}</div></div>
      </>)}
    </div>
  );
}
