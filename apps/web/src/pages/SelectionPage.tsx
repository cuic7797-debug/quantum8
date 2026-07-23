import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import { useAuth } from '@/hooks/useAuth';
import { useUserPicks } from '@/hooks/useUserPicks';
import { supabase } from '@/utils/supabase';
import type { ScoreResult, PlayType } from '@quantum8/types';
import { t } from '@/hooks/useI18n';

const PT = [t('play1'), t('play2'), t('play3'), t('play4'), t('play5'), t('play6'), t('play7'), t('play8'), t('play9'), t('play10')];
const STRATS = [
  { name: t('strat_conservative'), hot: 4, cold: 4, balance: 2, desc: t('desc_conservative'), icon: '🛡️' },
  { name: t('strat_balanced'), hot: 6, cold: 3, balance: 1, desc: t('desc_balanced'), icon: '⚖️' },
  { name: t('strat_aggressive'), hot: 8, cold: 1, balance: 1, desc: t('desc_aggressive'), icon: '🔥' },
];

function getAdaptiveRanges(pickCount: number) {
  if (pickCount <= 1) {
    return {
      sumRange: [1, 80] as [number, number],
      oddEvenRange: [0, 1] as [number, number],
      maxConsecutive: 1,
    };
  }
  if (pickCount <= 2) {
    return {
      sumRange: [3, 155] as [number, number],
      oddEvenRange: [0, 2] as [number, number],
      maxConsecutive: 1,
    };
  }
  const minSum = Math.max(1, Math.round(pickCount * 10));
  const maxSum = Math.min(800, Math.round(pickCount * 55));
  const minOdd = Math.max(0, Math.round(pickCount * 0.2));
  const maxOdd = Math.min(pickCount, Math.round(pickCount * 0.8));
  return {
    sumRange: [minSum, maxSum] as [number, number],
    oddEvenRange: [minOdd, maxOdd] as [number, number],
    maxConsecutive: pickCount <= 3 ? 1 : pickCount <= 6 ? 2 : 3,
  };
}

export default function SelectionPage() {
  const { user } = useAuth();
  const { addPick } = useUserPicks();
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [pt, setPt] = useState(t('play10') as PlayType);
  const [si, setSi] = useState(1);
  const [custom, setCustom] = useState(false);
  const [res, setRes] = useState<ScoreResult[]>([]);
  const [gen, setGen] = useState(false);
  const [showSaveMsg, setShowSaveMsg] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const [cHot, setCHot] = useState(6);
  const [cCold, setCCold] = useState(3);
  const [cBalance, setCBalance] = useState(1);

  const pc = PT.indexOf(pt) + 1;
  const ranges = getAdaptiveRanges(pc);

  function go() {
    if (!stats.length || !draws.length) return;
    setGen(true);
    setTimeout(() => {
      let cfg;
      if (custom) {
        cfg = {
          hotCount: Math.min(cHot, pc), coldCount: Math.min(cCold, pc), balanceCount: Math.min(cBalance, pc),
          zoneBalance: pc >= 4,
          sumRange: ranges.sumRange,
          oddEvenRange: ranges.oddEvenRange,
          maxConsecutive: ranges.maxConsecutive,
        };
      } else {
        const s = STRATS[si];
        cfg = {
          hotCount: Math.min(s.hot, pc), coldCount: Math.min(s.cold, pc), balanceCount: Math.min(s.balance, pc),
          zoneBalance: pc >= 4,
          sumRange: ranges.sumRange,
          oddEvenRange: ranges.oddEvenRange,
          maxConsecutive: ranges.maxConsecutive,
        };
      }
      const batchSize = pc <= 3 ? 8000 : 3000;
      const c = generateBatch(pc, batchSize);
      const f = applyFilters(c, cfg);
      const scored = f.slice(0, 80).map(x => scoreCombination(x, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
      setRes(scored);
      setGen(false);
    }, 100);
  }

  async function savePick(r: ScoreResult, index: number) {
    if (user) {
      await addPick(r.numbers, custom ? '自定义策略' : STRATS[si].name, pt, `评分: ${r.totalScore}`);
    } else {
      const key = 'quantum8_picks';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        numbers: r.numbers, playType: pt, score: r.totalScore,
        risk: r.riskLevel, time: new Date().toISOString(),
        strategy: custom ? '自定义策略' : STRATS[si].name,
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    }
    setShowSaveMsg(index);
    setSavedCount(c => c + 1);
    setTimeout(() => setShowSaveMsg(null), 1500);
  }

  async function saveAll() {
    if (user) {
      for (const r of res) {
        await addPick(r.numbers, custom ? '自定义策略' : STRATS[si].name, pt, `评分: ${r.totalScore}`);
      }
    } else {
      const key = 'quantum8_picks';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      res.forEach(r => {
        existing.unshift({
          numbers: r.numbers, playType: pt, score: r.totalScore,
          risk: r.riskLevel, time: new Date().toISOString(),
          strategy: custom ? '自定义策略' : STRATS[si].name,
        });
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    }
    setShowSaveMsg(-1);
    setSavedCount(res.length);
    setTimeout(() => setShowSaveMsg(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('smart_pick')}</h2>
        {savedCount > 0 && (
          <a href="/history" className="text-xs text-[var(--color-primary)] hover:underline">
            已保存 {savedCount} 组 → 查看记录
          </a>
        )}
      </div>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        {t('pick_ref_only')}
      </div>

      {/* Play Type */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{t('play_type')}</h3>
        <div className="grid grid-cols-5 gap-2">
          {PT.map((p, i) => (
            <button key={p} onClick={() => { setPt(p as PlayType); setRes([]); }}
              className={`py-2 rounded-lg text-sm font-semibold transition-all ${pt === p ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
              {t('play')}{i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-muted)]">{t('strategy')}</h3>
          <button onClick={() => setCustom(!custom)} className="text-xs text-[var(--color-primary)] hover:underline">
            {custom ? '使用推荐策略' : '自定义参数'}
          </button>
        </div>
        {!custom ? (
          <div className="grid grid-cols-3 gap-3">
            {STRATS.map((s, i) => (
              <button key={s.name} onClick={() => setSi(i)}
                className={`p-4 rounded-xl text-left transition-all ${si === i ? 'bg-[var(--color-primary)]/15 border-2 border-[var(--color-primary)]' : 'bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50'}`}>
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-sm font-bold">{s.name}</div>
                <div className="text-[10px] text-[var(--color-muted)] mt-1">{s.desc}</div>
                <div className="text-[10px] font-mono text-[var(--color-primary)] mt-2">
                  热{s.hot} 冷{s.cold} 平{s.balance}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">热号数量（最多{pc}）</label>
                <input type="number" min={0} max={pc} value={cHot} onChange={e => setCHot(Math.min(+e.target.value, pc))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">冷号数量（最多{pc}）</label>
                <input type="number" min={0} max={pc} value={cCold} onChange={e => setCCold(Math.min(+e.target.value, pc))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">平衡号数量（最多{pc}）</label>
                <input type="number" min={0} max={pc} value={cBalance} onChange={e => setCBalance(Math.min(+e.target.value, pc))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button onClick={go} disabled={gen || !stats.length}
        className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow-lg shadow-[var(--color-primary)]/25">
        {gen ? t('generating') : `${t('generate')} ${pt} ${t('recommend')}`}
      </button>

      {/* Results */}
      {res.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-muted)]">AI {t('recommend')} {pt}（共{res.length}组）</h3>
            <div className="flex gap-3">
              <button onClick={saveAll} className="text-xs text-[var(--color-primary)] hover:underline">{t('save_all')}</button>
              <a href="/history" className="text-xs text-[var(--color-muted)] hover:text-white">查看记录 →</a>
            </div>
          </div>

          {showSaveMsg === -1 && (
            <div className="mb-3 text-center text-sm text-emerald-400 bg-emerald-500/10 rounded-lg py-2">
              ✓ {t('saved_all')}{res.length}组号码
            </div>
          )}

          <div className="space-y-3">
            {res.map((r, i) => (
              <div key={i} className="bg-[var(--color-bg)] rounded-xl p-4 hover:bg-[var(--color-border)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-black' : i < 3 ? 'bg-[var(--color-muted)] text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]'}`}>{i + 1}</span>
                    <div className="flex gap-1 flex-wrap">
                      {r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-lg font-bold font-mono">{r.totalScore}</div>
                    <div className={`text-xs font-medium ${r.riskLevel === '低' ? 'text-emerald-400' : r.riskLevel === '中' ? 'text-amber-400' : 'text-red-400'}`}>{r.riskLevel}风险</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {r.reasons.map((reason, ri) => (
                      <span key={ri} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">✓ {reason}</span>
                    ))}
                  </div>
                  <button onClick={() => savePick(r, i)} className="text-xs text-[var(--color-primary)] hover:underline ml-2 shrink-0">
                    {showSaveMsg === i ? '✓ 已保存' : '保存'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 text-[10px]">
                  <div className="text-center"><div className="text-[var(--color-muted)]">{t('probability')}</div><div className="font-mono font-bold">{r.probabilityScore}</div></div>
                  <div className="text-center"><div className="text-[var(--color-muted)]">{t('hot_cold')}</div><div className="font-mono font-bold">{r.hotColdScore}</div></div>
                  <div className="text-center"><div className="text-[var(--color-muted)]">{t('structure')}</div><div className="font-mono font-bold">{r.structureScore}</div></div>
                  <div className="text-center"><div className="text-[var(--color-muted)]">{t('miss_value')}</div><div className="font-mono font-bold">{r.historySimilarity}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {res.length === 0 && !gen && (
        <div className="text-center py-8 text-[var(--color-muted)] text-sm">
          选择玩法和策略后，点击上方按钮生成推荐号码
        </div>
      )}
    </div>
  );
}
