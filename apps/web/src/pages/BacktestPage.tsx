import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { generateRandomCombination } from '@quantum8/algorithm';
import type { PlayType } from '@quantum8/types';
import { t } from '@/hooks/useI18n';

const PT = [t('play5'), t('play6'), t('play7'), t('play8'), t('play9'), t('play10')];
const PRIZE: Record<string, Record<number, number>> = {
  [t('play5')]: { 5: 1000, 4: 30, 3: 3 },
  [t('play6')]: { 6: 3000, 5: 200, 4: 10, 3: 1 },
  [t('play7')]: { 7: 10000, 6: 800, 5: 50, 4: 5, 3: 1 },
  [t('play8')]: { 8: 50000, 7: 3000, 6: 200, 5: 20, 4: 3 },
  [t('play9')]: { 9: 200000, 8: 3000, 7: 200, 6: 20, 5: 5, 4: 1 },
  [t('play10')]: { 10: 500000, 9: 10000, 8: 500, 7: 30, 6: 5, 5: 1 },
};

interface Row { p: string; n: number[]; h: number; pr: number; hits: number[]; }
interface Sum { r: number; b: number; hi: number; hr: number; c: number; pr: number; roi: number; rows: Row[]; maxPrize: number; hitDistribution: Record<number, number>; }

export default function BacktestPage() {
  const { draws } = useDraws(500);
  const [pt, setPt] = useState<PlayType>(t('play10') as PlayType);
  const [bc, setBc] = useState(1);
  const [res, setRes] = useState<Sum | null>(null);
  const [run, setRun] = useState(false);
  const pc = PT.indexOf(pt) + 5;

  function go() {
    if (draws.length < 10) return;
    setRun(true);
    setTimeout(() => {
      const tbl = PRIZE[pt] || {};
      const td = draws.slice(1);
      const rows: Row[] = [];
      let th = 0, tp = 0, mp = 0;
      const hitDist: Record<number, number> = {};
      for (let i = 0; i < td.length; i++) {
        const tgt = td[i].numbers;
        let bh = 0, bhHits: number[] = [];
        for (let b = 0; b < bc; b++) {
          const p = generateRandomCombination(pc);
          const hits = p.filter(n => tgt.includes(n));
          if (hits.length > bh) { bh = hits.length; bhHits = hits; }
        }
        const pr = tbl[bh] || 0;
        th += bh > 0 ? 1 : 0; tp += pr;
        if (pr > mp) mp = pr;
        hitDist[bh] = (hitDist[bh] || 0) + 1;
        if (i < 30) rows.push({ p: td[i].draw_number, n: tgt, h: bh, pr, hits: bhHits });
      }
      const tb = td.length * bc, tc = tb * 2;
      setRes({ r: td.length, b: tb, hi: th, hr: parseFloat(((th / td.length) * 100).toFixed(2)),
        c: tc, pr: tp, roi: tc > 0 ? parseFloat((((tp - tc) / tc) * 100).toFixed(2)) : 0,
        rows, maxPrize: mp, hitDistribution: hitDist });
      setRun(false);
    }, 200);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('backtest')}</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">{t('backtest_ref')}</div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">{t('play_type')}</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PT.map(p => (
              <button key={p} onClick={() => setPt(p as PlayType)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${pt === p ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">{t('bets_per_draw')}</h3>
          <div className="flex gap-2">
            {[1, 3, 5, 10].map(n => (
              <button key={n} onClick={() => setBc(n)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${bc === n ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
                {n}{t('bets')}
              </button>
            ))}
          </div>
        </div>
        <button onClick={go} disabled={run || draws.length < 10}
          className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg hover:bg-[var(--color-primary)]/80 disabled:opacity-50 shadow-lg">
          {run ? t('backtesting') : `${t('run_backtest')}（${Math.min(draws.length - 1, 500)}期）`}
        </button>
      </div>

      {res && <>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
            <div className="text-2xl font-bold">{res.r}</div><div className="text-xs text-[var(--color-muted)]">{t('test_rounds')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{res.hr}%</div><div className="text-xs text-[var(--color-muted)]">{t('hit_rate')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
            <div className="text-2xl font-bold font-mono">¥{res.c}</div><div className="text-xs text-[var(--color-muted)]">{t('total_cost')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
            <div className={`text-2xl font-bold font-mono ${res.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {res.roi >= 0 ? '+' : ''}{res.roi}%
            </div><div className="text-xs text-[var(--color-muted)]">{t('roi')}</div>
          </div>
          <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 text-center">
            <div className="text-2xl font-bold font-mono text-amber-400">{res.maxPrize > 0 ? `¥${res.maxPrize}` : '-'}</div>
            <div className="text-xs text-[var(--color-muted)]">{t('max_prize')}</div>
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('hit_distribution')}</h3>
          <div className="flex items-end gap-2 h-32">
            {Object.entries(res.hitDistribution).sort((a, b) => Number(a[0]) - Number(b[0])).map(([hit, count]) => {
              const maxCount = Math.max(...Object.values(res.hitDistribution));
              const h = (count / maxCount) * 100;
              return (
                <div key={hit} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-mono">{count}</span>
                  <div className={`w-full rounded-t ${Number(hit) >= 5 ? 'bg-emerald-500' : Number(hit) >= 3 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ height: `${Math.max(4, h)}%` }} />
                  <span className="text-[10px] text-[var(--color-muted)]">{hit}中</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('prize_table')}（{pt}）</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(PRIZE[pt] || {}).reverse().map(([k, v]) => (
              <div key={k} className="bg-[var(--color-bg)] rounded-lg p-2 text-center">
                <div className="text-xs text-[var(--color-muted)]">{t('hit')}{k}{t('pcs')}</div>
                <div className="font-bold font-mono text-sm">¥{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('recent_detail')}</h3>
          <div className="space-y-2">
            {res.rows.map((r, i) => (
              <div key={i} className={`flex items-center justify-between py-3 px-3 rounded-lg border border-[var(--color-border)] last:border-0 text-sm ${r.h >= 3 ? 'bg-emerald-500/5 border-emerald-500/20' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-[var(--color-muted)] w-16">{r.p}</span>
                  <div className="flex gap-0.5">{r.n.slice(0, 10).map(num => <NumberBall key={num} number={num} size="sm" />)}</div>
                  {r.n.length > 10 && <span className="text-xs text-[var(--color-muted)]">...+{r.n.length - 10}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`font-mono font-bold text-sm ${r.h >= 5 ? 'text-emerald-400' : r.h >= 3 ? 'text-amber-400' : 'text-[var(--color-muted)]'}`}>
                    {t('hit')}{r.h}
                  </span>
                  <span className="font-mono text-xs">{r.pr > 0 ? `¥${r.pr}` : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>}
    </div>
  );
}
