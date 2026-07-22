import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { generateRandomCombination } from '@quantum8/algorithm';
import type { PlayType } from '@quantum8/types';
const PT: PlayType[] = ['选五','选六','选七','选八','选九','选十'];
const PRIZE: Record<string, Record<number, number>> = { '选五':{5:1000,4:30,3:3},'选六':{6:3000,5:200,4:10,3:1},'选七':{7:10000,6:800,5:50,4:5,3:1},'选八':{8:50000,7:3000,6:200,5:20,4:3},'选九':{9:200000,8:3000,7:200,6:20,5:5,4:1},'选十':{10:500000,9:10000,8:500,7:30,6:5,5:1} };
interface Row { p: string; n: number[]; h: number; pr: number; }
interface Sum { r: number; b: number; hi: number; hr: number; c: number; pr: number; roi: number; rows: Row[]; }
export default function BacktestPage() {
  const { draws } = useDraws(500);
  const [pt, setPt] = useState<PlayType>('选十');
  const [bc, setBc] = useState(1);
  const [res, setRes] = useState<Sum | null>(null);
  const [run, setRun] = useState(false);
  const pc = PT.indexOf(pt) + 5;
  function go() {
    if (draws.length < 10) return;
    setRun(true);
    setTimeout(() => {
      const t = PRIZE[pt] || {}; const td = draws.slice(1); const rows: Row[] = [];
      let th = 0, tp = 0;
      for (let i = 0; i < td.length; i++) { const tgt = td[i].numbers; let bh = 0;
        for (let b = 0; b < bc; b++) { const p = generateRandomCombination(pc); const h = p.filter(n => tgt.includes(n)).length; if (h > bh) bh = h; }
        const pr = t[bh] || 0; th += bh > 0 ? 1 : 0; tp += pr;
        if (i < 30) rows.push({ p: td[i].draw_number, n: tgt, h: bh, pr }); }
      const tb = td.length * bc; const tc = tb * 2;
      setRes({ r: td.length, b: tb, hi: th, hr: parseFloat(((th/td.length)*100).toFixed(2)), c: tc, pr: tp, roi: tc > 0 ? parseFloat((((tp-tc)/tc)*100).toFixed(2)) : 0, rows });
      setRun(false);
    }, 200);
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">策略回测</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">⚠️ 回测结果仅代表历史模拟。</div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
        <div><h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">玩法</h3><div className="flex flex-wrap gap-2">{PT.map(p => <button key={p} onClick={() => setPt(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${pt === p ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-white'}`}>{p}</button>)}</div></div>
        <div><h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">每期注数</h3><div className="flex gap-2">{[1,3,5,10].map(n => <button key={n} onClick={() => setBc(n)} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${bc === n ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-white'}`}>{n}注</button>)}</div></div>
        <button onClick={go} disabled={run || draws.length < 10} className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 disabled:opacity-50">{run ? '回测中...' : `开始回测（近${Math.min(draws.length-1,500)}期）`}</button>
      </div>
      {res && <>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5"><div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-xl font-bold">{res.r}</div><div className="text-xs text-[var(--color-muted)]">测试期数</div></div><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-xl font-bold">{res.hr}%</div><div className="text-xs text-[var(--color-muted)]">命中率</div></div><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-xl font-bold font-mono">¥{res.c}</div><div className="text-xs text-[var(--color-muted)]">总投入</div></div><div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className={`text-xl font-bold font-mono ${res.roi>=0?'text-emerald-400':'text-red-400'}`}>{res.roi>=0?'+':''}{res.roi}%</div><div className="text-xs text-[var(--color-muted)]">收益率</div></div></div></div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5"><h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">近期明细</h3><div className="space-y-2">{res.rows.map((r,i) => <div key={i} className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0 text-sm"><div className="flex items-center gap-2"><span className="font-mono text-xs text-[var(--color-muted)] w-20">{r.p}</span><div className="flex gap-0.5">{r.n.slice(0,10).map(num => <NumberBall key={num} number={num} size="sm"/>)}</div></div><div className="flex items-center gap-3 shrink-0"><span className={`font-mono font-bold ${r.h>=5?'text-emerald-400':r.h>=3?'text-amber-400':'text-[var(--color-muted)]'}`}>{'中'}{r.h}</span><span className="font-mono text-xs">{r.pr>0?`¥${r.pr}`:'-'}</span></div></div>)}</div></div>
      </>}
    </div>
  );
}
