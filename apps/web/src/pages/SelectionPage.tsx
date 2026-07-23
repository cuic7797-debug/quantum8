import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import CopyButton from '@/components/common/CopyButton';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import { useAuth } from '@/hooks/useAuth';
import { useUserPicks } from '@/hooks/useUserPicks';
import type { ScoreResult } from '@quantum8/types';

type BetMode = 'single' | 'compound' | 'dantuo';

const PLAY_TYPES = ['选一','选二','选三','选四','选五','选六','选七','选八','选九','选十'];
const STRATS = [
  { name: '保守型', icon: '🛡️', hot: 4, cold: 4, balance: 2, desc: '热冷均衡' },
  { name: '均衡型', icon: '⚖️', hot: 6, cold: 3, balance: 1, desc: '偏重热号' },
  { name: '激进型', icon: '🔥', hot: 8, cold: 1, balance: 1, desc: '主攻热号' },
];

function getRanges(pc: number) {
  if (pc <= 1) return { sumRange: [1, 80] as [number, number], oddEvenRange: [0, 1] as [number, number], maxConsecutive: 1 };
  if (pc <= 2) return { sumRange: [3, 155] as [number, number], oddEvenRange: [0, 2] as [number, number], maxConsecutive: 1 };
  return { sumRange: [Math.max(1, pc * 10), Math.min(800, pc * 55)] as [number, number], oddEvenRange: [Math.max(0, Math.round(pc * 0.2)), Math.min(pc, Math.round(pc * 0.8))] as [number, number], maxConsecutive: pc <= 3 ? 1 : pc <= 6 ? 2 : 3 };
}

function comb(n: number, k: number): number { if (k > n || k < 0) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); }
function getCombos(arr: number[], k: number): number[][] { if (k === 0 || arr.length < k) return k === 0 ? [[]] : []; const r: number[][] = []; for (let i = 0; i <= arr.length - k; i++) for (const rest of getCombos(arr.slice(i + 1), k - 1)) r.push([arr[i], ...rest]); return r; }

export default function SelectionPage() {
  const { user } = useAuth();
  const { addPick } = useUserPicks();
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);

  const [betMode, setBetMode] = useState<BetMode>('single');
  const [playIdx, setPlayIdx] = useState(9);
  const [stratIdx, setStratIdx] = useState(1);
  const [custom, setCustom] = useState(false);
  const [cHot, setCHot] = useState(6);
  const [cCold, setCCold] = useState(3);
  const [cBalance, setCBalance] = useState(1);
  const [resultCount, setResultCount] = useState(5);
  const [selectedNums, setSelectedNums] = useState<number[]>([]);
  const [danNums, setDanNums] = useState<number[]>([]);
  const [tuoNums, setTuoNums] = useState<number[]>([]);
  const [res, setRes] = useState<ScoreResult[]>([]);
  const [gen, setGen] = useState(false);
  const [showSaveMsg, setShowSaveMsg] = useState<number | null>(null);

  const pc = playIdx + 1;
  const ranges = getRanges(pc);
  const maxCompound = pc + 5;
  const maxDan = pc - 1;

  function toggleNum(n: number) {
    if (betMode === 'compound') setSelectedNums(p => p.includes(n) ? p.filter(x => x !== n) : p.length < maxCompound ? [...p, n].sort((a, b) => a - b) : p);
    else if (betMode === 'dantuo') {
      if (danNums.includes(n)) setDanNums(p => p.filter(x => x !== n));
      else if (tuoNums.includes(n)) setTuoNums(p => p.filter(x => x !== n));
      else if (danNums.length < maxDan) setDanNums(p => [...p, n].sort((a, b) => a - b));
      else setTuoNums(p => [...p, n].sort((a, b) => a - b));
    }
  }

  function numClass(n: number) {
    if (betMode === 'dantuo') { if (danNums.includes(n)) return 'bg-amber-500 text-white ring-2 ring-amber-300'; if (tuoNums.includes(n)) return 'bg-[var(--color-primary)] text-white'; }
    if (selectedNums.includes(n)) return 'bg-emerald-500 text-white';
    return 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]';
  }

  function go() {
    if (!stats.length || !draws.length) return;
    setGen(true);
    setTimeout(() => {
      const s = STRATS[stratIdx];
      const cfg = { hotCount: Math.min(custom ? cHot : s.hot, pc), coldCount: Math.min(custom ? cCold : s.cold, pc), balanceCount: Math.min(custom ? cBalance : s.balance, pc), zoneBalance: pc >= 4, ...ranges };
      let allCombos: number[][] = [];

      if (betMode === 'single') {
        const batch = generateBatch(pc, pc <= 3 ? 8000 : 3000);
        const filtered = applyFilters(batch, cfg);
        allCombos = filtered.slice(0, 80).map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, resultCount).map(r => r.numbers);
      } else if (betMode === 'compound') {
        // AI先推荐最优号码池，再从中组合
        const batch = generateBatch(pc + 3, 3000);
        const scored = batch.map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore);
        const aiPool = scored[0]?.numbers || [];
        // 合并用户选号和AI推荐
        const merged = [...new Set([...selectedNums, ...aiPool])].sort((a, b) => a - b);
        allCombos = getCombos(merged, pc).slice(0, resultCount);
      } else if (betMode === 'dantuo') {
        // AI推荐拖码池
        const batch = generateBatch(pc, 3000);
        const scored = batch.map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore);
        const aiTuo = scored[0]?.numbers.filter(n => !danNums.includes(n)) || [];
        const mergedTuo = [...new Set([...tuoNums, ...aiTuo])].filter(n => !danNums.includes(n)).sort((a, b) => a - b);
        const need = pc - danNums.length;
        if (mergedTuo.length >= need) allCombos = getCombos(mergedTuo, need).map(tc => [...danNums, ...tc].sort((a, b) => a - b)).slice(0, resultCount);
      }

      const scored = allCombos.map(nums => scoreCombination(nums, stats, draws.length));
      setRes(scored);
      setGen(false);
    }, 100);
  }

  function comboCount() {
    if (betMode === 'single') return resultCount;
    if (betMode === 'compound') return selectedNums.length >= pc ? comb(selectedNums.length, pc) : 0;
    if (betMode === 'dantuo') { if (danNums.length >= pc) return 1; const need = pc - danNums.length; return tuoNums.length >= need ? comb(tuoNums.length, need) : 0; }
    return 0;
  }

  async function savePick(r: ScoreResult, idx: number) {
    const label = betMode === 'single' ? (custom ? '自定义' : STRATS[stratIdx].name) : betMode === 'compound' ? '复式' : '胆拖';
    if (user) await addPick(r.numbers, label, PLAY_TYPES[playIdx], `评分:${r.totalScore}`);
    else { const key = 'quantum8_picks'; const existing = JSON.parse(localStorage.getItem(key) || '[]'); existing.unshift({ numbers: r.numbers, playType: PLAY_TYPES[playIdx], score: r.totalScore, risk: r.riskLevel, time: new Date().toISOString(), strategy: label }); localStorage.setItem(key, JSON.stringify(existing.slice(0, 50))); }
    setShowSaveMsg(idx); setTimeout(() => setShowSaveMsg(null), 1500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🎯 智能选号</h2>
      </div>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        ⚠ 仅供参考，不构成投注建议
      </div>

      {/* Step 1: 投注模式 */}
      <Collapsible title="选择投注模式" step={1} badge={betMode === 'single' ? '🤖 单式' : betMode === 'compound' ? '🎰 复式' : '🎯 胆拖'}>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'single' as BetMode, label: '单式', desc: 'AI智能推荐号码', icon: '🤖' },
            { key: 'compound' as BetMode, label: '复式', desc: '多选号码组合', icon: '🎰' },
            { key: 'dantuo' as BetMode, label: '胆拖', desc: '胆码+拖码', icon: '🎯' },
          ]).map(m => (
            <button key={m.key} onClick={() => { setBetMode(m.key); setSelectedNums([]); setDanNums([]); setTuoNums([]); setRes([]); }}
              className={'p-3 rounded-xl text-center transition-all border-2 ' + (betMode === m.key ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-transparent hover:border-[var(--color-primary)]/30')}>
              <div className="text-xl">{m.icon}</div>
              <div className="text-sm font-bold mt-1">{m.label}</div>
              <div className="text-[10px] text-[var(--color-muted)]">{m.desc}</div>
            </button>
          ))}
        </div>
      </Collapsible>

      {/* Step 2: 选择玩法 */}
      <Collapsible title="选择玩法" step={2} badge={PLAY_TYPES[playIdx]}>
        <div className="grid grid-cols-5 gap-2">
          {PLAY_TYPES.map((p, i) => (
            <button key={p} onClick={() => { setPlayIdx(i); setRes([]); setSelectedNums([]); setDanNums([]); setTuoNums([]); }}
              className={'py-2 rounded-lg text-sm font-bold transition-all ' + (playIdx === i ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]')}>
              {p}
            </button>
          ))}
        </div>
      </Collapsible>

      {/* Step 3: 策略 or 选号 */}
      {betMode === 'single' ? (
        <Collapsible title="选择策略" step={3} badge={custom ? '自定义' : STRATS[stratIdx].name}>
          <div className="flex items-center justify-end mb-2">
            <button onClick={() => setCustom(!custom)} className="text-xs text-[var(--color-primary)] hover:underline">{custom ? '使用推荐' : '自定义参数'}</button>
          </div>
          {!custom ? (
            <div className="grid grid-cols-3 gap-2">
              {STRATS.map((s, i) => (
                <button key={s.name} onClick={() => setStratIdx(i)}
                  className={'p-3 rounded-xl text-center transition-all border-2 ' + (stratIdx === i ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-transparent')}>
                  <div className="text-lg">{s.icon}</div>
                  <div className="text-xs font-bold">{s.name}</div>
                  <div className="text-[10px] text-[var(--color-muted)]">{s.desc}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-[10px] text-[var(--color-muted)]">热号</label><input type="number" min={0} max={pc} value={cHot} onChange={e => setCHot(Math.min(+e.target.value, pc))} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-sm font-mono" /></div>
              <div><label className="text-[10px] text-[var(--color-muted)]">冷号</label><input type="number" min={0} max={pc} value={cCold} onChange={e => setCCold(Math.min(+e.target.value, pc))} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-sm font-mono" /></div>
              <div><label className="text-[10px] text-[var(--color-muted)]">平衡号</label><input type="number" min={0} max={pc} value={cBalance} onChange={e => setCBalance(Math.min(+e.target.value, pc))} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-sm font-mono" /></div>
            </div>
          )}
        </Collapsible>
      ) : (
        <Collapsible title={betMode === 'compound' ? '选择号码' : '选择胆码 + 拖码'} step={3}
          badge={betMode === 'compound' ? selectedNums.length + '个号' : danNums.length + '胆+' + tuoNums.length + '拖'}>
          {betMode === 'dantuo' && <div className="flex gap-4 mb-2 text-xs"><span className="text-amber-400">● 胆码({danNums.length}/{maxDan})</span><span className="text-[var(--color-primary)]">● 拖码({tuoNums.length})</span></div>}
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 80 }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => toggleNum(n)} className={'w-full aspect-square rounded-lg text-xs font-bold transition-all ' + numClass(n)}>{n}</button>
            ))}
          </div>
          {betMode === 'dantuo' && <button onClick={() => { setDanNums([]); setTuoNums([]); }} className="text-xs text-red-400 hover:underline mt-2">清空</button>}
        </Collapsible>
      )}

      {/* Step 4: 生成组数 */}
      <Collapsible title="生成组数" step={betMode === 'single' ? 4 : 3} badge={resultCount + '组'}>
        <div className="flex gap-2">
          {[1, 2, 3, 5, 8, 10].map(n => (
            <button key={n} onClick={() => setResultCount(n)}
              className={'flex-1 py-2 rounded-lg text-sm font-bold transition-all ' + (resultCount === n ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
              {n}组
            </button>
          ))}
        </div>
      </Collapsible>

      {/* Generate */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[var(--color-muted)]">{betMode === 'single' ? 'AI推荐' : betMode === 'compound' ? '复式组合' : '胆拖组合'} · {PLAY_TYPES[playIdx]} · {comboCount()}种组合</span>
          <span className="text-xs font-bold text-amber-400">{comboCount() * 2}元</span>
        </div>
        <button onClick={go} disabled={gen || !stats.length}
          className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-base hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow-lg shadow-[var(--color-primary)]/25">
          {gen ? '生成中...' : '🎯 生成推荐号码'}
        </button>
      </div>

      {/* Results */}
      {res.length > 0 && (
        <Collapsible title={'推荐结果（' + res.length + '组）'} step={0} badge={PLAY_TYPES[playIdx]} defaultOpen={true}>
          <div className="space-y-2">
            {res.map((r, i) => (
              <div key={i} className="bg-[var(--color-bg)] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ' + (i === 0 ? 'bg-amber-500 text-black' : i < 3 ? 'bg-[var(--color-muted)] text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]')}>{i + 1}</span>
                    <div className="flex gap-0.5 flex-wrap">{r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-bold font-mono text-sm">{r.totalScore}</span>
                    <span className={'text-[10px] px-1.5 py-0.5 rounded ' + (r.riskLevel === '低' ? 'bg-emerald-500/20 text-emerald-400' : r.riskLevel === '中' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')}>{r.riskLevel}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {r.reasons.slice(0, 3).map((reason, ri) => (
                      <span key={ri} className="text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">{reason}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={r.numbers.join(' ')} label="复制号码" />
                    <button onClick={() => savePick(r, i)} className="text-[10px] text-[var(--color-primary)] hover:underline">
                      {showSaveMsg === i ? '✓ 已保存' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <CopyButton text={res.map(r => r.numbers.join(' ')).join('\n')} label="📋 一键复制全部号码" className="flex-1 justify-center py-2 bg-[var(--color-bg)] rounded-lg" />
          </div>
        </Collapsible>
      )}
    </div>
  );
}
