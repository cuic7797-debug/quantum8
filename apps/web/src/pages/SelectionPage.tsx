import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import CopyButton from '@/components/common/CopyButton';
import ShareButton from '@/components/common/ShareButton';
import NumberGroups from '@/components/selection/NumberGroups';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import { useAuth } from '@/hooks/useAuth';
import { useUserPicks } from '@/hooks/useUserPicks';
import type { ScoreResult } from '@quantum8/types';

type BetMode = 'single' | 'compound' | 'dantuo';

const PLAY_TYPES = ['选一','选二','选三','选四','选五','选六','选七','选八','选九','选十'];
const STRATS = [
  { name: '保守型', icon: '🛡️', hot: 4, cold: 4, balance: 2, desc: '热冷均衡', color: 'blue' },
  { name: '均衡型', icon: '⚖️', hot: 6, cold: 3, balance: 1, desc: '偏重热号', color: 'emerald' },
  { name: '激进型', icon: '🔥', hot: 8, cold: 1, balance: 1, desc: '主攻热号', color: 'amber' },
];

function getRanges(pc: number) {
  if (pc <= 1) return { sumRange: [1, 80] as [number, number], oddEvenRange: [0, 1] as [number, number], maxConsecutive: 1 };
  if (pc <= 2) return { sumRange: [3, 155] as [number, number], oddEvenRange: [0, 2] as [number, number], maxConsecutive: 1 };
  return { sumRange: [Math.max(1, pc * 10), Math.min(800, pc * 55)] as [number, number], oddEvenRange: [Math.max(0, Math.round(pc * 0.2)), Math.min(pc, Math.round(pc * 0.8))] as [number, number], maxConsecutive: pc <= 3 ? 1 : pc <= 6 ? 2 : 3 };
}

function comb(n: number, k: number): number { if (k > n || k < 0) return 0; let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); }
function getCombos(arr: number[], k: number): number[][] { if (k === 0 || arr.length < k) return k === 0 ? [[]] : []; const r: number[][] = []; for (let i = 0; i <= arr.length - k; i++) for (const rest of getCombos(arr.slice(i + 1), k - 1)) r.push([arr[i], ...rest]); return r; }

interface MultiResult {
  strategyName: string;
  strategyIcon: string;
  results: ScoreResult[];
}

export default function SelectionPage() {
  const { user } = useAuth();
  const { addPick } = useUserPicks();

  let killedNums: number[] = [];
  try { killedNums = JSON.parse(localStorage.getItem('quantum8_killed_numbers') || '[]'); } catch {}
  const { stats, loading: ls } = useNumberStats();
  const { draws, loading: ld } = useDraws(100);

  const [betMode, setBetMode] = useState<BetMode>('single');
  const [playIdx, setPlayIdx] = useState(9);
  const [stratIdx, setStratIdx] = useState(1);
  const [multiMode, setMultiMode] = useState(false);
  const [selectedStrats, setSelectedStrats] = useState<number[]>([0, 1, 2]);
  const [custom, setCustom] = useState(false);
  const [cHot, setCHot] = useState(6);
  const [cCold, setCCold] = useState(3);
  const [cBalance, setCBalance] = useState(1);
  const [resultCount, setResultCount] = useState(5);
  const [selectedNums, setSelectedNums] = useState<number[]>([]);
  const [danNums, setDanNums] = useState<number[]>([]);
  const [tuoNums, setTuoNums] = useState<number[]>([]);
  const [res, setRes] = useState<ScoreResult[]>([]);
  const [multiRes, setMultiRes] = useState<MultiResult[]>([]);
  const [gen, setGen] = useState(false);
  const [showSaveMsg, setShowSaveMsg] = useState<number | null>(null);
  if (ld || ls) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><span className="text-base text-[var(--color-muted)]">加载中...</span></div></div>;

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

  function toggleStrat(i: number) {
    setSelectedStrats(p => p.includes(i) ? p.filter(x => x !== i) : [...p, i]);
  }

  function numClass(n: number) {
    if (betMode === 'dantuo') { if (danNums.includes(n)) return 'bg-amber-500 text-white ring-2 ring-amber-300'; if (tuoNums.includes(n)) return 'bg-[var(--color-primary)] text-white'; }
    if (selectedNums.includes(n)) return 'bg-emerald-500 text-white';
    return 'glass-inset text-[var(--color-muted)] hover:bg-white/10';
  }

  function generateForStrategy(sIdx: number, count: number): ScoreResult[] {
    const s = STRATS[sIdx];
    const cfg = { hotCount: s.hot, coldCount: s.cold, balanceCount: s.balance, zoneBalance: pc >= 4, ...ranges };
    let allCombos: number[][] = [];

    if (betMode === 'single') {
      const generateSafe = (c: number, batchSize: number): number[][] => {
        const result: number[][] = [];
        let attempts = 0;
        while (result.length < batchSize && attempts < batchSize * 3) {
          attempts++;
          const pool = Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !killedNums.includes(n));
          if (pool.length < c) break;
          const combo: number[] = [];
          const p = [...pool];
          for (let i = 0; i < c; i++) {
            const idx = Math.floor(Math.random() * p.length);
            combo.push(p[idx]);
            p.splice(idx, 1);
          }
          result.push(combo.sort((a, b) => a - b));
        }
        return result;
      };
      const batch = generateSafe(pc, pc <= 3 ? 8000 : 3000);
      const filtered = applyFilters(batch, cfg);
      allCombos = filtered.slice(0, 80).map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, count).map(r => r.numbers);
    } else if (betMode === 'compound') {
      const batch = generateBatch(pc + 3, 3000);
      const scored = batch.map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore);
      const aiPool = scored[0]?.numbers || [];
      const merged = [...new Set([...selectedNums, ...aiPool])].sort((a, b) => a - b);
      allCombos = getCombos(merged, pc).slice(0, count);
    } else if (betMode === 'dantuo') {
      const batch = generateBatch(pc, 3000);
      const scored = batch.map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore);
      const aiTuo = scored[0]?.numbers.filter(n => !danNums.includes(n)) || [];
      const mergedTuo = [...new Set([...tuoNums, ...aiTuo])].filter(n => !danNums.includes(n)).sort((a, b) => a - b);
      const need = pc - danNums.length;
      if (mergedTuo.length >= need) allCombos = getCombos(mergedTuo, need).map(tc => [...danNums, ...tc].sort((a, b) => a - b)).slice(0, count);
    }

    return allCombos.map(nums => scoreCombination(nums, stats, draws.length));
  }

  function go() {
    if (!stats.length || !draws.length) return;
    setGen(true);
    setMultiRes([]);
    setTimeout(() => {
      if (multiMode && betMode === 'single') {
        // Multi-strategy: generate for each selected strategy
        const results: MultiResult[] = selectedStrats.map(sIdx => ({
          strategyName: STRATS[sIdx].name,
          strategyIcon: STRATS[sIdx].icon,
          results: generateForStrategy(sIdx, resultCount),
        }));
        setMultiRes(results);
        setRes([]);
      } else {
        const s = STRATS[stratIdx];
        const cfg = { hotCount: custom ? cHot : s.hot, coldCount: custom ? cCold : s.cold, balanceCount: custom ? cBalance : s.balance, zoneBalance: pc >= 4, ...ranges };
        let allCombos: number[][] = [];

        if (betMode === 'single') {
          const generateSafe = (count: number, batchSize: number): number[][] => {
            const result: number[][] = [];
            let attempts = 0;
            while (result.length < batchSize && attempts < batchSize * 3) {
              attempts++;
              const pool = Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !killedNums.includes(n));
              if (pool.length < count) break;
              const combo: number[] = [];
              const p = [...pool];
              for (let i = 0; i < count; i++) {
                const idx = Math.floor(Math.random() * p.length);
                combo.push(p[idx]);
                p.splice(idx, 1);
              }
              result.push(combo.sort((a, b) => a - b));
            }
            return result;
          };
          const batch = generateSafe(pc, pc <= 3 ? 8000 : 3000);
          const filtered = applyFilters(batch, cfg);
          allCombos = filtered.slice(0, 80).map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, resultCount).map(r => r.numbers);
        } else if (betMode === 'compound') {
          const batch = generateBatch(pc + 3, 3000);
          const scored = batch.map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore);
          const aiPool = scored[0]?.numbers || [];
          const merged = [...new Set([...selectedNums, ...aiPool])].sort((a, b) => a - b);
          allCombos = getCombos(merged, pc).slice(0, resultCount);
        } else if (betMode === 'dantuo') {
          const batch = generateBatch(pc, 3000);
          const scored = batch.map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore);
          const aiTuo = scored[0]?.numbers.filter(n => !danNums.includes(n)) || [];
          const mergedTuo = [...new Set([...tuoNums, ...aiTuo])].filter(n => !danNums.includes(n)).sort((a, b) => a - b);
          const need = pc - danNums.length;
          if (mergedTuo.length >= need) allCombos = getCombos(mergedTuo, need).map(tc => [...danNums, ...tc].sort((a, b) => a - b)).slice(0, resultCount);
        }

        const scored = allCombos.map(nums => scoreCombination(nums, stats, draws.length));
        setRes(scored);
      }
      setGen(false);
    }, 100);
  }

  function comboCount() {
    if (betMode === 'single') return multiMode ? resultCount * selectedStrats.length : resultCount;
    if (betMode === 'compound') return selectedNums.length >= pc ? comb(selectedNums.length, pc) : 0;
    if (betMode === 'dantuo') { if (danNums.length >= pc) return 1; const need = pc - danNums.length; return tuoNums.length >= need ? comb(tuoNums.length, need) : 0; }
    return 0;
  }

  function savePick(r: ScoreResult, idx: number) {
    addPick(r.numbers, multiMode ? '多策略对比' : STRATS[stratIdx].name, PLAY_TYPES[playIdx], '');
    setShowSaveMsg(idx);
    setTimeout(() => setShowSaveMsg(null), 2000);
  }

  const allResults = multiRes.length > 0 ? multiRes.flatMap(m => m.results) : res;

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold gradient-text-primary">🎯 智能选号</h2>

      {/* Step 0: 投注模式 */}
      <Collapsible title="选择投注模式" step={1} badge={betMode === 'single' ? '单式' : betMode === 'compound' ? '复式' : '胆拖'}>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: 'single' as BetMode, label: '单式', icon: '🎰', desc: 'AI智能推荐' },
            { key: 'compound' as BetMode, label: '复式', icon: '🎯', desc: '多号组合' },
            { key: 'dantuo' as BetMode, label: '胆拖', icon: '🧩', desc: '胆码+拖码' },
          ]).map(m => (
            <button key={m.key} onClick={() => { setBetMode(m.key); setRes([]); setMultiRes([]); setSelectedNums([]); setDanNums([]); setTuoNums([]); }}
              className={'p-3 rounded-xl text-center transition-all border-2 ' + (betMode === m.key ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'glass-inset border-transparent hover:border-[var(--color-primary)]/30')}>
              <div className="text-lg">{m.icon}</div>
              <div className="text-xs font-bold mt-1">{m.label}</div>
              <div className="text-sm text-[var(--color-muted)]">{m.desc}</div>
            </button>
          ))}
        </div>
      </Collapsible>

      {/* 号码分组 */}
      <Collapsible title="📁 号码分组" badge="自定义分组" defaultOpen={false}>
        <NumberGroups onSelect={(nums) => { if (betMode === 'compound') setSelectedNums(nums); }} />
      </Collapsible>

      {/* Step 2: 选择玩法 */}
      <Collapsible title="选择玩法" step={2} badge={PLAY_TYPES[playIdx]}>
        <div className="grid grid-cols-5 gap-2">
          {PLAY_TYPES.map((p, i) => (
            <button key={p} onClick={() => { setPlayIdx(i); setRes([]); setMultiRes([]); setSelectedNums([]); setDanNums([]); setTuoNums([]); }}
              className={'py-2 rounded-lg text-sm font-bold transition-all ' + (playIdx === i ? 'bg-[var(--color-primary)] text-white shadow' : 'glass-inset text-[var(--color-muted)] hover:bg-white/10')}>
              {p}
            </button>
          ))}
        </div>
      </Collapsible>

      {/* Step 3: 策略 or 选号 */}
      {betMode === 'single' ? (
        <Collapsible title="选择策略" step={3} badge={multiMode ? '多策略对比' : custom ? '自定义' : STRATS[stratIdx].name}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setMultiMode(!multiMode)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${multiMode ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10'}`}>
              {multiMode ? '✓ 多策略对比' : '开启多策略对比'}
            </button>
            {!multiMode && <button onClick={() => setCustom(!custom)} className="text-xs text-[var(--color-primary)] hover:underline">{custom ? '使用推荐' : '自定义参数'}</button>}
          </div>

          {multiMode ? (
            <div className="space-y-3">
              <div className="text-sm text-[var(--color-muted)]">选择要对比的策略（可多选）:</div>
              <div className="grid grid-cols-3 gap-2">
                {STRATS.map((s, i) => (
                  <button key={s.name} onClick={() => toggleStrat(i)}
                    className={'p-3 rounded-xl text-center transition-all border-2 ' + (selectedStrats.includes(i) ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'glass-inset border-transparent')}>
                    <div className="text-lg">{s.icon}</div>
                    <div className="text-xs font-bold">{s.name}</div>
                    <div className="text-sm text-[var(--color-muted)]">{s.desc}</div>
                    {selectedStrats.includes(i) && <div className="text-xs text-[var(--color-primary)] mt-1">✓ 已选</div>}
                  </button>
                ))}
              </div>
            </div>
          ) : !custom ? (
            <div className="grid grid-cols-3 gap-2">
              {STRATS.map((s, i) => (
                <button key={s.name} onClick={() => setStratIdx(i)}
                  className={'p-3 rounded-xl text-center transition-all border-2 ' + (stratIdx === i ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'glass-inset border-transparent')}>
                  <div className="text-lg">{s.icon}</div>
                  <div className="text-xs font-bold">{s.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">{s.desc}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div><label className="text-sm text-[var(--color-muted)]">热号</label><input type="number" min={0} max={pc} value={cHot} onChange={e => setCHot(Math.min(+e.target.value, pc))} className="w-full glass-input px-2 py-1.5 text-sm font-mono" /></div>
              <div><label className="text-sm text-[var(--color-muted)]">冷号</label><input type="number" min={0} max={pc} value={cCold} onChange={e => setCCold(Math.min(+e.target.value, pc))} className="w-full glass-input px-2 py-1.5 text-sm font-mono" /></div>
              <div><label className="text-sm text-[var(--color-muted)]">平衡号</label><input type="number" min={0} max={pc} value={cBalance} onChange={e => setCBalance(Math.min(+e.target.value, pc))} className="w-full glass-input px-2 py-1.5 text-sm font-mono" /></div>
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
      <Collapsible title="生成组数" step={betMode === 'single' ? 4 : 3} badge={resultCount + '组' + (multiMode ? '×' + selectedStrats.length + '策略' : '')}>
        <div className="flex gap-2">
          {[1, 2, 3, 5, 8, 10].map(n => (
            <button key={n} onClick={() => setResultCount(n)}
              className={'flex-1 py-2 rounded-lg text-sm font-bold transition-all ' + (resultCount === n ? 'bg-[var(--color-primary)] text-white shadow' : 'glass-inset text-[var(--color-muted)]')}>
              {n}组
            </button>
          ))}
        </div>
      </Collapsible>

      {/* Generate */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--color-muted)]">
            {multiMode ? `多策略对比 · ${selectedStrats.length}个策略` : (betMode === 'single' ? 'AI推荐' : betMode === 'compound' ? '复式组合' : '胆拖组合')}
            {' · '}{PLAY_TYPES[playIdx]} · {comboCount()}种组合
          </span>
          <span className="text-xs font-bold text-amber-400">{comboCount() * 2}元</span>
        </div>
        <button onClick={go} disabled={gen || !stats.length || (multiMode && selectedStrats.length === 0)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white font-bold text-base hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 transition-all">
          {gen ? '⏳ 生成中...' : multiMode ? '🔄 多策略对比生成' : '🎯 生成推荐号码'}
        </button>
      </div>

      {/* Multi-Strategy Results */}
      {multiRes.length > 0 && (
        <Collapsible title={`多策略对比结果（${multiRes.length}个策略 × ${resultCount}组）`} step={0} badge="对比" defaultOpen={true}>
          <div className="space-y-5">
            {multiRes.map((mr, mi) => (
              <div key={mi} className="glass-inset p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{mr.strategyIcon}</span>
                  <span className="text-sm font-bold">{mr.strategyName}</span>
                  <span className="text-sm text-[var(--color-muted)]">平均分 {mr.results.length ? (mr.results.reduce((a, r) => a + r.totalScore, 0) / mr.results.length).toFixed(1) : 0}</span>
                </div>
                <div className="space-y-2">
                  {mr.results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                      <span className={'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ' + (i === 0 ? 'bg-amber-500 text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]')}>{i + 1}</span>
                      <div className="flex gap-0.5 flex-wrap flex-1">{r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                      <span className="font-bold font-mono text-xs shrink-0">{r.totalScore}</span>
                      <CopyButton text={r.numbers.join(' ')} label="复制" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <CopyButton text={multiRes.flatMap(mr => mr.results.map(r => `[${mr.strategyName}] ${r.numbers.join(' ')}`)).join('\n')} label="📋 复制全部对比结果" className="flex-1 justify-center py-2 glass-inset" />
          </div>
        </Collapsible>
      )}

      {/* Single Strategy Results */}
      {res.length > 0 && (
        <Collapsible title={'推荐结果（' + res.length + '组）'} step={0} badge={PLAY_TYPES[playIdx]} defaultOpen={true}>
          <div className="space-y-2">
            {res.map((r, i) => (
              <div key={i} className="glass-inset p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ' + (i === 0 ? 'bg-amber-500 text-black' : i < 3 ? 'bg-[var(--color-muted)] text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]')}>{i + 1}</span>
                    <div className="flex gap-0.5 flex-wrap">{r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="font-bold font-mono text-sm">{r.totalScore}</span>
                    <span className={'text-xs px-1.5 py-0.5 rounded ' + (r.riskLevel === '低' ? 'bg-emerald-500/20 text-emerald-400' : r.riskLevel === '中' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')}>{r.riskLevel}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {r.reasons.slice(0, 3).map((reason, ri) => (
                      <span key={ri} className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-full">{reason}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <CopyButton text={r.numbers.join(' ')} label="复制号码" />
                    <ShareButton numbers={r.numbers} title={`Quantum8 推荐第${i + 1}组`} />
                    <button onClick={() => savePick(r, i)} className="text-xs text-[var(--color-primary)] hover:underline">
                      {showSaveMsg === i ? '✓ 已保存' : '保存'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <CopyButton text={res.map(r => r.numbers.join(' ')).join('\n')} label="📋 一键复制全部号码" className="flex-1 justify-center py-2 glass-inset" />
            <ShareButton numbers={res.flatMap(r => r.numbers)} title="Quantum8 全部推荐号码" className="flex-1 justify-center py-2 glass-inset" />
          </div>
        </Collapsible>
      )}
    </div>
  );
}
