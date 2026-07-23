import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import { useAuth } from '@/hooks/useAuth';
import { useUserPicks } from '@/hooks/useUserPicks';
import type { ScoreResult, PlayType } from '@quantum8/types';

type BetMode = 'single' | 'compound' | 'dantuo';

const PLAY_TYPES = ['选一','选二','选三','选四','选五','选六','选七','选八','选九','选十'];
const STRATS = [
  { name: '保守型', icon: '🛡️', hot: 4, cold: 4, balance: 2, desc: '热冷均衡，稳健为主' },
  { name: '均衡型', icon: '⚖️', hot: 6, cold: 3, balance: 1, desc: '偏重热号，兼顾冷号' },
  { name: '激进型', icon: '🔥', hot: 8, cold: 1, balance: 1, desc: '主攻热号，高风险高回报' },
];

function getAdaptiveRanges(pc: number) {
  if (pc <= 1) return { sumRange: [1, 80] as [number, number], oddEvenRange: [0, 1] as [number, number], maxConsecutive: 1 };
  if (pc <= 2) return { sumRange: [3, 155] as [number, number], oddEvenRange: [0, 2] as [number, number], maxConsecutive: 1 };
  return {
    sumRange: [Math.max(1, Math.round(pc * 10)), Math.min(800, Math.round(pc * 55))] as [number, number],
    oddEvenRange: [Math.max(0, Math.round(pc * 0.2)), Math.min(pc, Math.round(pc * 0.8))] as [number, number],
    maxConsecutive: pc <= 3 ? 1 : pc <= 6 ? 2 : 3,
  };
}

function comb(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  if (k === 0 || k === n) return 1;
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

export default function SelectionPage() {
  const { user } = useAuth();
  const { addPick } = useUserPicks();
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);

  // Step 1: Betting mode
  const [betMode, setBetMode] = useState<BetMode>('single');
  // Step 2: Play type (index 0-9 = 选一-选十)
  const [playIdx, setPlayIdx] = useState(9);
  // Step 3: Strategy
  const [stratIdx, setStratIdx] = useState(1);
  const [custom, setCustom] = useState(false);
  const [cHot, setCHot] = useState(6);
  const [cCold, setCCold] = useState(3);
  const [cBalance, setCBalance] = useState(1);
  // Step 4: Generate count
  const [resultCount, setResultCount] = useState(5);
  // Step 5: Manual number selection (for compound/dantuo)
  const [selectedNums, setSelectedNums] = useState<number[]>([]);
  const [danNums, setDanNums] = useState<number[]>([]);
  const [tuoNums, setTuoNums] = useState<number[]>([]);
  // Results
  const [res, setRes] = useState<ScoreResult[]>([]);
  const [gen, setGen] = useState(false);
  const [showSaveMsg, setShowSaveMsg] = useState<number | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  const pc = playIdx + 1;
  const ranges = getAdaptiveRanges(pc);
  const playName = PLAY_TYPES[playIdx];

  // For compound mode
  const maxCompound = pc + 5;
  // For dantuo mode
  const maxDan = pc - 1;
  const minTuo = Math.max(1, pc - maxDan);

  function toggleNum(n: number) {
    if (betMode === 'compound') {
      setSelectedNums(prev => prev.includes(n) ? prev.filter(x => x !== n) : prev.length < maxCompound ? [...prev, n].sort((a, b) => a - b) : prev);
    } else if (betMode === 'dantuo') {
      if (danNums.includes(n)) {
        setDanNums(prev => prev.filter(x => x !== n));
      } else if (tuoNums.includes(n)) {
        setTuoNums(prev => prev.filter(x => x !== n));
      } else if (danNums.length < maxDan) {
        setDanNums(prev => [...prev, n].sort((a, b) => a - b));
      } else {
        setTuoNums(prev => [...prev, n].sort((a, b) => a - b));
      }
    }
  }

  function getNumClass(n: number) {
    if (betMode === 'dantuo') {
      if (danNums.includes(n)) return 'bg-amber-500 text-white ring-2 ring-amber-300';
      if (tuoNums.includes(n)) return 'bg-[var(--color-primary)] text-white';
    }
    if (selectedNums.includes(n)) return 'bg-emerald-500 text-white';
    return 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]';
  }

  function go() {
    if (!stats.length || !draws.length) return;
    setGen(true);
    setTimeout(() => {
      let allCombos: number[][] = [];

      if (betMode === 'single') {
        // AI generates
        const s = STRATS[stratIdx];
        const cfg = {
          hotCount: Math.min(custom ? cHot : s.hot, pc),
          coldCount: Math.min(custom ? cCold : s.cold, pc),
          balanceCount: Math.min(custom ? cBalance : s.balance, pc),
          zoneBalance: pc >= 4,
          sumRange: ranges.sumRange,
          oddEvenRange: ranges.oddEvenRange,
          maxConsecutive: ranges.maxConsecutive,
        };
        const batch = generateBatch(pc, pc <= 3 ? 8000 : 3000);
        const filtered = applyFilters(batch, cfg);
        allCombos = filtered.slice(0, 80).map(c => scoreCombination(c, stats, draws.length))
          .sort((a, b) => b.totalScore - a.totalScore)
          .slice(0, resultCount)
          .map(r => r.numbers);
      } else if (betMode === 'compound') {
        // Generate all combinations from selected numbers
        if (selectedNums.length >= pc) {
          allCombos = getCombinations(selectedNums, pc).slice(0, resultCount);
        }
      } else if (betMode === 'dantuo') {
        // Dan + Tuo combinations
        const need = pc - danNums.length;
        if (danNums.length <= maxDan && tuoNums.length >= need) {
          const tuoCombos = getCombinations(tuoNums, need);
          allCombos = tuoCombos.map(tc => [...danNums, ...tc].sort((a, b) => a - b)).slice(0, resultCount);
        }
      }

      // Score all combos for display
      const scored = allCombos.map(nums => scoreCombination(nums, stats, draws.length));
      setRes(scored);
      setGen(false);
    }, 100);
  }

  // Combination count display
  function getComboCount() {
    if (betMode === 'single') return resultCount;
    if (betMode === 'compound') return selectedNums.length >= pc ? comb(selectedNums.length, pc) : 0;
    if (betMode === 'dantuo') {
      if (danNums.length >= pc) return 1;
      const need = pc - danNums.length;
      return tuoNums.length >= need ? comb(tuoNums.length, need) : 0;
    }
    return 0;
  }

  async function savePick(r: ScoreResult, index: number) {
    const strategyLabel = betMode === 'single' ? (custom ? '自定义策略' : STRATS[stratIdx].name) : betMode === 'compound' ? '复式投注' : '胆拖投注';
    if (user) {
      await addPick(r.numbers, strategyLabel, playName, `评分:${r.totalScore} ${betMode === 'single' ? '' : betMode}`);
    } else {
      const key = 'quantum8_picks';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.unshift({
        numbers: r.numbers, playType: playName, score: r.totalScore,
        risk: r.riskLevel, time: new Date().toISOString(), strategy: strategyLabel,
      });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 50)));
    }
    setShowSaveMsg(index);
    setSavedCount(c => c + 1);
    setTimeout(() => setShowSaveMsg(null), 1500);
  }

  async function saveAll() {
    for (const r of res) {
      const idx = res.indexOf(r);
      await savePick(r, idx);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🎯 智能选号</h2>
        {savedCount > 0 && <a href="/history" className="text-xs text-[var(--color-primary)] hover:underline">已保存 {savedCount} 组 →</a>}
      </div>

      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        ⚠ 以下推荐基于历史数据统计分析，仅供参考，不构成投注建议。
      </div>

      {/* Step 1: 投注模式 */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold">1</span>
          <h3 className="text-sm font-semibold">选择投注模式</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'single' as BetMode, label: '单式', desc: 'AI智能推荐', icon: '🤖' },
            { key: 'compound' as BetMode, label: '复式', desc: '手动选号扩展', icon: '🎰' },
            { key: 'dantuo' as BetMode, label: '胆拖', desc: '胆码+拖码组合', icon: '🎯' },
          ]).map(m => (
            <button key={m.key} onClick={() => { setBetMode(m.key); setSelectedNums([]); setDanNums([]); setTuoNums([]); }}
              className={'p-4 rounded-xl text-center transition-all border-2 ' + (
                betMode === m.key ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-transparent hover:border-[var(--color-primary)]/30'
              )}>
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-sm font-bold">{m.label}</div>
              <div className="text-[10px] text-[var(--color-muted)] mt-0.5">{m.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: 选择玩法 */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold">2</span>
          <h3 className="text-sm font-semibold">选择玩法（选几）</h3>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PLAY_TYPES.map((p, i) => (
            <button key={p} onClick={() => { setPlayIdx(i); setRes([]); setSelectedNums([]); setDanNums([]); setTuoNums([]); }}
              className={'py-2.5 rounded-lg text-sm font-bold transition-all ' + (
                playIdx === i ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: 选择策略 (only for single mode) */}
      {betMode === 'single' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold">3</span>
              <h3 className="text-sm font-semibold">选择策略</h3>
            </div>
            <button onClick={() => setCustom(!custom)} className="text-xs text-[var(--color-primary)] hover:underline">
              {custom ? '使用推荐策略' : '自定义参数'}
            </button>
          </div>
          {!custom ? (
            <div className="grid grid-cols-3 gap-3">
              {STRATS.map((s, i) => (
                <button key={s.name} onClick={() => setStratIdx(i)}
                  className={'p-4 rounded-xl text-left transition-all border-2 ' + (
                    stratIdx === i ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-transparent hover:border-[var(--color-primary)]/30'
                  )}>
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-sm font-bold">{s.name}</div>
                  <div className="text-[10px] text-[var(--color-muted)] mt-1">{s.desc}</div>
                  <div className="text-[10px] font-mono text-[var(--color-primary)] mt-2">热{s.hot} 冷{s.cold} 平{s.balance}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">热号（最多{pc}）</label>
                <input type="number" min={0} max={pc} value={cHot} onChange={e => setCHot(Math.min(+e.target.value, pc))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">冷号（最多{pc}）</label>
                <input type="number" min={0} max={pc} value={cCold} onChange={e => setCCold(Math.min(+e.target.value, pc))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs text-[var(--color-muted)] block mb-1">平衡号（最多{pc}）</label>
                <input type="number" min={0} max={pc} value={cBalance} onChange={e => setCBalance(Math.min(+e.target.value, pc))}
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 3b: 手动选号 (compound/dantuo) */}
      {(betMode === 'compound' || betMode === 'dantuo') && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold">3</span>
            <h3 className="text-sm font-semibold">{betMode === 'compound' ? '选择号码（至少' + pc + '个，最多' + maxCompound + '个）' : '选择胆码（' + maxDan + '个）+ 拖码'}</h3>
          </div>
          {betMode === 'dantuo' && (
            <div className="flex gap-4 mb-3 text-xs">
              <span className="text-amber-400">● 胆码（{danNums.length}/{maxDan}）</span>
              <span className="text-[var(--color-primary)]">● 拖码（{tuoNums.length}，至少{minTuo}个）</span>
            </div>
          )}
          {betMode === 'compound' && (
            <div className="text-xs text-[var(--color-muted)] mb-3">
              已选 <span className="text-emerald-400 font-bold">{selectedNums.length}</span> 个号
            </div>
          )}
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 80 }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => toggleNum(n)}
                className={'w-full aspect-square rounded-lg text-xs font-bold transition-all ' + getNumClass(n)}>
                {n}
              </button>
            ))}
          </div>
          {betMode === 'dantuo' && (
            <div className="mt-3 flex gap-2">
              <button onClick={() => { setDanNums([]); setTuoNums([]); }} className="text-xs text-red-400 hover:underline">清空选号</button>
            </div>
          )}
        </div>
      )}

      {/* Step 4: 生成组数 */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold">{betMode === 'single' ? '4' : '3'}</span>
          <h3 className="text-sm font-semibold">生成组数</h3>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 5, 8, 10].map(n => (
            <button key={n} onClick={() => setResultCount(n)}
              className={'flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ' + (
                resultCount === n ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
              )}>
              {n}组
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button + Info */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-[var(--color-muted)]">
            {betMode === 'single' ? '🤖 AI智能推荐' : betMode === 'compound' ? '🎰 复式组合' : '🎯 胆拖组合'}
            {' · '}{playName} · {resultCount}组
            {betMode !== 'single' && ' · ' + getComboCount() + '种组合'}
          </div>
          <div className="text-xs font-bold text-amber-400">
            {betMode === 'single' ? resultCount * 2 : getComboCount() * 2}元
          </div>
        </div>
        <button onClick={go} disabled={gen || !stats.length || !draws.length}
          className="w-full py-4 rounded-xl bg-[var(--color-primary)] text-white font-bold text-lg hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow-lg shadow-[var(--color-primary)]/25">
          {gen ? '生成中...' : '🎯 生成推荐号码'}
        </button>
      </div>

      {/* Results */}
      {res.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">AI 推荐 {playName}（共{res.length}组）</h3>
            <div className="flex gap-3">
              <button onClick={saveAll} className="text-xs text-[var(--color-primary)] hover:underline">全部保存</button>
              <a href="/history" className="text-xs text-[var(--color-muted)] hover:text-white">查看记录 →</a>
            </div>
          </div>

          {showSaveMsg === -1 && (
            <div className="mb-3 text-center text-sm text-emerald-400 bg-emerald-500/10 rounded-lg py-2">✓ 已保存全部{res.length}组</div>
          )}

          <div className="space-y-3">
            {res.map((r, i) => (
              <div key={i} className="bg-[var(--color-bg)] rounded-xl p-4 hover:bg-[var(--color-border)] transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ' + (i === 0 ? 'bg-amber-500 text-black' : i < 3 ? 'bg-[var(--color-muted)] text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]')}>{i + 1}</span>
                    <div className="flex gap-1 flex-wrap">{r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-lg font-bold font-mono">{r.totalScore}</div>
                    <div className={'text-xs font-medium ' + (r.riskLevel === '低' ? 'text-emerald-400' : r.riskLevel === '中' ? 'text-amber-400' : 'text-red-400')}>{r.riskLevel}风险</div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1.5 flex-wrap">
                    {r.reasons.map((reason, ri) => (
                      <span key={ri} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">✓ {reason}</span>
                    ))}
                  </div>
                  <button onClick={() => savePick(r, i)} className="text-xs text-[var(--color-primary)] hover:underline ml-2 shrink-0">
                    {showSaveMsg === i ? '✓ 已保存' : '保存'}
                  </button>
                </div>
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

      {res.length === 0 && !gen && (
        <div className="text-center py-8 text-[var(--color-muted)] text-sm">
          按照上方步骤选择后，点击生成推荐号码
        </div>
      )}
    </div>
  );
}
