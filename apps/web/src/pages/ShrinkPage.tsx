import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import CopyButton from '@/components/common/CopyButton';
import Collapsible from '@/components/common/Collapsible';
import { greedyShrink, weightedShrink } from '@quantum8/algorithm';

const PLAY_TYPES = ['选五','选六','选七','选八','选九','选十'];

export default function ShrinkPage() {
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [pool, setPool] = useState<number[]>([]);
  const [pickCount, setPickCount] = useState(10);
  const [maxBets, setMaxBets] = useState(20);
  const [mode, setMode] = useState<'greedy' | 'weighted'>('greedy');
  const [result, setResult] = useState<ReturnType<typeof greedyShrink> | null>(null);
  const [generating, setGenerating] = useState(false);

  function togglePool(n: number) {
    setPool(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].sort((a, b) => a - b));
    setResult(null);
  }

  function go() {
    if (pool.length < pickCount || !draws.length) return;
    setGenerating(true);
    setTimeout(() => {
      const r = mode === 'greedy'
        ? greedyShrink(pool, pickCount, maxBets)
        : weightedShrink(pool, pickCount, maxBets, stats, draws);
      setResult(r);
      setGenerating(false);
    }, 100);
  }

  const totalCombos = pool.length >= pickCount
    ? Array.from({ length: pickCount }, (_, i) => pool.length - i).reduce((a, b) => a * b, 1) /
      Array.from({ length: pickCount }, (_, i) => i + 1).reduce((a, b) => a * b, 1)
    : 0;

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">✂️ 智能缩水</h2>
      <div className="text-sm text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        大复式自动缩水到可承受注数，保持覆盖率最大化
      </div>

      <Collapsible title="选择号码池" step={1} badge={pool.length + '个号'}>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 80 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => togglePool(n)}
              className={'aspect-square rounded-lg text-xs font-bold transition-all ' + (pool.includes(n) ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]')}>
              {n}
            </button>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="缩水参数" step={2} badge={totalCombos + '注→' + maxBets + '注'}>
        <div className="grid grid-cols-3 gap-4 mb-3">
          <div>
            <label className="text-sm text-[var(--color-muted)]">每注选号</label>
            <select value={pickCount} onChange={e => { setPickCount(+e.target.value); setResult(null); }}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-sm mt-1">
              {PLAY_TYPES.map((p, i) => <option key={p} value={i + 5}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)]">最大注数</label>
            <select value={maxBets} onChange={e => { setMaxBets(+e.target.value); setResult(null); }}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-sm mt-1">
              {[10,20,30,50,100].map(n => <option key={n} value={n}>{n}注</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)]">缩水策略</label>
            <select value={mode} onChange={e => { setMode(e.target.value as any); setResult(null); }}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1.5 text-sm mt-1">
              <option value="greedy">贪心覆盖率</option>
              <option value="weighted">加权覆盖+热度</option>
            </select>
          </div>
        </div>
        <div className="glass-inset p-2 text-sm text-[var(--color-muted)]">
          {pool.length}个号 → C({pool.length},{pickCount}) = {totalCombos}注 → 缩水至{maxBets}注
        </div>
      </Collapsible>

      <button onClick={go} disabled={generating || pool.length < pickCount || !draws.length}
        className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow-lg">
        {generating ? '缩水中...' : '✂️ 执行智能缩水'}
      </button>

      {result && (
        <Collapsible title={'缩水结果（' + result.shrunkCount + '注）'} step={3} badge={'压缩比 ' + (result.compressionRatio * 100).toFixed(4) + '%'} defaultOpen={true}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="glass-inset p-2.5 text-center">
                <div className="text-sm text-[var(--color-muted)]">原始注数</div>
                <div className="font-bold font-mono text-sm">{result.originalCount.toLocaleString()}</div>
              </div>
              <div className="glass-inset p-2.5 text-center">
                <div className="text-sm text-[var(--color-muted)]">缩水后</div>
                <div className="font-bold font-mono text-sm text-emerald-400">{result.shrunkCount}</div>
              </div>
              <div className="glass-inset p-2.5 text-center">
                <div className="text-sm text-[var(--color-muted)]">号码覆盖率</div>
                <div className="font-bold font-mono text-sm">{(result.numberCoverage * 100).toFixed(1)}%</div>
              </div>
              <div className="glass-inset p-2.5 text-center">
                <div className="text-sm text-[var(--color-muted)]">对覆盖率</div>
                <div className="font-bold font-mono text-sm text-amber-400">{(result.pairCoverage * 100).toFixed(1)}%</div>
              </div>
            </div>

            <div className="glass-inset p-2">
              <div className="h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full" style={{ width: (result.pairCoverage * 100) + '%' }} />
              </div>
              <div className="flex justify-between text-sm text-[var(--color-muted)] mt-1">
                <span>覆盖率 0%</span><span>50%</span><span>100%</span>
              </div>
            </div>

            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {result.bets.map((bet, i) => (
                <div key={i} className="flex items-center gap-2 glass-inset px-3 py-1.5">
                  <span className="text-sm text-[var(--color-muted)] w-5 font-mono">{i + 1}</span>
                  <div className="flex gap-0.5 flex-wrap flex-1">
                    {bet.map(n => <NumberBall key={n} number={n} size="sm" />)}
                  </div>
                </div>
              ))}
            </div>

            <CopyButton text={result.bets.map(b => b.join(' ')).join('\n')} label="📋 复制全部缩水号码" className="w-full justify-center py-2 glass-inset" />
          </div>
        </Collapsible>
      )}
    </div>
  );
}
