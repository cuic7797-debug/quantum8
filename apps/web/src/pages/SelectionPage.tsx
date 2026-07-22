import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import type { ScoreResult, PlayType } from '@quantum8/types';
import { t } from '@/hooks/useI18n';

const PT = [t('play1'),t('play2'),t('play3'),t('play4'),t('play5'),t('play6'),t('play7'),t('play8'),t('play9'),t('play10')];
const STRATS = [
  { name: t('strat_conservative'), hot: 4, cold: 4, balance: 2, desc: t('desc_conservative'), icon: '🛡️' },
  { name: t('strat_balanced'), hot: 6, cold: 3, balance: 1, desc: t('desc_balanced'), icon: '⚖️' },
  { name: t('strat_aggressive'), hot: 8, cold: 1, balance: 1, desc: t('desc_aggressive'), icon: '🔥' },
];
export default function SelectionPage() {
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [pt, setPt] = useState(t('play10') as PlayType);
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
      const c = generateBatch(pc, 3000);
      const f = applyFilters(c, cfg);
      setRes(f.slice(0, 80).map(x => scoreCombination(x, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10));
      setGen(false);
    }, 100);
  }

  // Save to localStorage
  function savePick(r: ScoreResult) {
    const key = 'quantum8_picks';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.unshift({ numbers: r.numbers, playType: pt, score: r.totalScore, risk: r.riskLevel, time: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('smart_pick')}</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">{t('pick_ref_only')}</div>

      {/* Step 1: Play Type */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('step1_play')}</h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {PT.map(p => (
            <button key={p} onClick={() => setPt(p as PlayType)}
              className={`px-2 py-2 rounded-lg text-sm font-medium transition-all ${pt === p ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Strategy */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('step2_strategy')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STRATS.map((s, i) => (
            <button key={s.name} onClick={() => setSi(i)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${si === i ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-lg' : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="font-semibold mb-1">{s.name}</div>
              <div className="text-xs text-[var(--color-muted)]">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <button onClick={go} disabled={gen || !stats.length}
        className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow-lg shadow-[var(--color-primary)]/25">
        {gen ? t('generating') : `${t('generate')} ${pt} ${t('recommend')}`}
      </button>

      {/* Results */}
      {res.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-4">AI {t('recommend')} {pt}（共{res.length}组）</h3>
          <div className="space-y-3">
            {res.map((r, i) => (
              <div key={i} className="bg-[var(--color-bg)] rounded-xl p-4 hover:bg-[var(--color-border)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i===0?'bg-amber-500 text-black':i<3?'bg-[var(--color-muted)] text-black':'bg-[var(--color-border)] text-[var(--color-muted)]'}`}>{i+1}</span>
                    <div className="flex gap-1 flex-wrap">
                      {r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-lg font-bold font-mono">{r.totalScore}</div>
                    <div className={`text-xs font-medium ${r.riskLevel==='低'?'text-emerald-400':r.riskLevel==='中'?'text-amber-400':'text-red-400'}`}>{r.riskLevel}风险</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {r.reasons.map((reason, ri) => (
                      <span key={ri} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">✓ {reason}</span>
                    ))}
                  </div>
                  <button onClick={() => savePick(r)} className="text-xs text-[var(--color-primary)] hover:underline ml-2 shrink-0">保存</button>
                </div>
                {/* Score breakdown */}
                <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                  <div className="text-center"><div className="text-[var(--color-muted)]">概率</div><div className="font-mono font-bold">{r.probabilityScore}</div></div>
                  <div className="text-center"><div className="text-[var(--color-muted)]">冷热</div><div className="font-mono font-bold">{r.hotColdScore}</div></div>
                  <div className="text-center"><div className="text-[var(--color-muted)]">结构</div><div className="font-mono font-bold">{r.structureScore}</div></div>
                  <div className="text-center"><div className="text-[var(--color-muted)]">遗漏</div><div className="font-mono font-bold">{r.historySimilarity}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
