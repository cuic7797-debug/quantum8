import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import type { ScoreResult, PlayType } from '@quantum8/types';

const PT: PlayType[] = ['选一','选二','选三','选四','选五','选六','选七','选八','选九','选十'];
const STRATS = [
  { name: '稳健模式', hot: 4, cold: 4, balance: 2, desc: '均衡冷热号' },
  { name: '均衡模式', hot: 6, cold: 3, balance: 1, desc: '偏热号为主' },
  { name: '激进模式', hot: 8, cold: 1, balance: 1, desc: '追热号趋势' },
];
export default function SelectionPage() {
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [pt, setPt] = useState<PlayType>('选十');
  const [si, setSi] = useState(1);
  const [res, setRes] = useState<ScoreResult[]>([]);
  const [gen, setGen] = useState(false);
  const pc = PT.indexOf(pt) + 1;
  function go() {
    if (!stats.length || !draws.length) return;
    setGen(true);
    setTimeout(() => {
      const s = STRATS[si];
      const cfg = { hotCount: s.hot, coldCount: s.cold, balanceCount: s.balance, zoneBalance: true, sumRange: [400, 1200] as [number, number], oddEvenRange: [5, 15] as [number, number], maxConsecutive: 3 };
      const c = generateBatch(pc, 2000);
      const f = applyFilters(c, cfg);
      setRes(f.slice(0, 50).map(x => scoreCombination(x, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10));
      setGen(false);
    }, 100);
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">智能选号</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">⚠️ 仅供参考，不构成投注建议。</div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">第一步：选择玩法</h3>
        <div className="flex flex-wrap gap-2">{PT.map(p => <button key={p} onClick={() => setPt(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pt === p ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-white'}`}>{p}</button>)}</div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">第二步：选择策略</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{STRATS.map((s, i) => <button key={s.name} onClick={() => setSi(i)} className={`text-left p-4 rounded-xl border transition-all ${si === i ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}><div className="font-semibold mb-1">{s.name}</div><div className="text-xs text-[var(--color-muted)]">{s.desc}</div></button>)}</div>
      </div>
      <button onClick={go} disabled={gen || !stats.length} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-lg hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-colors">{gen ? '生成中...' : `生成 ${pt} 推荐`}</button>
      {res.length > 0 && <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">AI 推荐 {pt}</h3>
        <div className="space-y-3">{res.map((r, i) => <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0"><div><div className="flex items-center gap-2 mb-1"><span className="text-xs text-[var(--color-muted)]">#{i + 1}</span><div className="flex gap-1">{r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div></div><div className="flex gap-3 text-[10px] text-[var(--color-muted)]">{r.reasons.map((reason, ri) => <span key={ri}>✓ {reason}</span>)}</div></div><div className="text-right shrink-0"><div className="text-lg font-bold font-mono">{r.totalScore}</div><div className={`text-xs font-medium ${r.riskLevel === '低' ? 'text-emerald-400' : r.riskLevel === '中' ? 'text-amber-400' : 'text-red-400'}`}>{r.riskLevel}风险</div></div></div>)}</div>
      </div>}
    </div>
  );
}
