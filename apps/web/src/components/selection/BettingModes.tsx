import { useState } from 'react';
import NumberBall from '@/components/common/NumberBall';

interface Props {
  playType: number;
  onGenerate: (numbers: number[][], mode: string, danNumbers?: number[]) => void;
}

export default function BettingModes({ playType, onGenerate }: Props) {
  const [mode, setMode] = useState<'single' | 'compound' | 'dantuo'>('single');
  const [singleNums, setSingleNums] = useState<number[]>([]);
  const [danNums, setDanNums] = useState<number[]>([]);
  const [tuoNums, setTuoNums] = useState<number[]>([]);

  const minPick = playType;
  const maxCompound = playType + 5;

  function toggleNum(n: number) {
    if (mode === 'single') {
      setSingleNums(prev => prev.includes(n) ? prev.filter(x => x !== n) : prev.length < playType ? [...prev, n].sort((a, b) => a - b) : prev);
    } else if (mode === 'compound') {
      setSingleNums(prev => prev.includes(n) ? prev.filter(x => x !== n) : prev.length < maxCompound ? [...prev, n].sort((a, b) => a - b) : prev);
    } else if (mode === 'dantuo') {
      if (danNums.includes(n)) {
        setDanNums(prev => prev.filter(x => x !== n));
      } else if (tuoNums.includes(n)) {
        setTuoNums(prev => prev.filter(x => x !== n));
      } else {
        const totalDan = danNums.length;
        if (totalDan < playType - 1) {
          setDanNums(prev => [...prev, n].sort((a, b) => a - b));
        } else {
          setTuoNums(prev => [...prev, n].sort((a, b) => a - b));
        }
      }
    }
  }

  function isSelected(n: number) {
    if (mode === 'dantuo') return danNums.includes(n) || tuoNums.includes(n);
    return singleNums.includes(n);
  }

  function getNumStyle(n: number) {
    if (mode === 'dantuo') {
      if (danNums.includes(n)) return 'bg-amber-500 text-white';
      if (tuoNums.includes(n)) return 'bg-[var(--color-primary)] text-white';
    }
    if (mode === 'single' && singleNums.includes(n)) return 'bg-[var(--color-primary)] text-white';
    if (mode === 'compound' && singleNums.includes(n)) return 'bg-emerald-500 text-white';
    return 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]';
  }

  function getCombinationCount() {
    if (mode === 'single') return singleNums.length >= playType ? 1 : 0;
    if (mode === 'compound') {
      if (singleNums.length < playType) return 0;
      return comb(singleNums.length, playType);
    }
    if (mode === 'dantuo') {
      if (danNums.length >= playType) return 1;
      const need = playType - danNums.length;
      if (tuoNums.length < need) return 0;
      return comb(tuoNums.length, need);
    }
    return 0;
  }

  function comb(n: number, k: number): number {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    let result = 1;
    for (let i = 0; i < k; i++) { result = result * (n - i) / (i + 1); }
    return Math.round(result);
  }

  function handleGenerate() {
    const combos: number[][] = [];
    if (mode === 'single' && singleNums.length === playType) {
      combos.push(singleNums);
    } else if (mode === 'compound' && singleNums.length >= playType) {
      const allCombos = getCombinations(singleNums, playType);
      combos.push(...allCombos.slice(0, 50));
    } else if (mode === 'dantuo' && danNums.length < playType && tuoNums.length >= playType - danNums.length) {
      const need = playType - danNums.length;
      const tuoCombos = getCombinations(tuoNums, need);
      for (const tc of tuoCombos) {
        combos.push([...danNums, ...tc].sort((a, b) => a - b));
      }
    }
    if (combos.length > 0) onGenerate(combos, mode, mode === 'dantuo' ? danNums : undefined);
  }

  function getCombinations(arr: number[], k: number): number[][] {
    if (k === 0) return [[]];
    if (arr.length < k) return [];
    const result: number[][] = [];
    for (let i = 0; i <= arr.length - k; i++) {
      const rest = getCombinations(arr.slice(i + 1), k - 1);
      for (const r of rest) result.push([arr[i], ...r]);
    }
    return result;
  }

  const comboCount = getCombinationCount();
  const cost = comboCount * 2;

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold">投注方式</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">选择单式、复式或胆拖投注</p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'single', label: '单式', desc: '选' + playType + '个号' },
          { key: 'compound', label: '复式', desc: '选' + playType + '-' + maxCompound + '个号' },
          { key: 'dantuo', label: '胆拖', desc: '胆码+拖码' },
        ].map(m => (
          <button key={m.key} onClick={() => { setMode(m.key as any); setSingleNums([]); setDanNums([]); setTuoNums([]); }}
            className={'flex-1 p-3 rounded-lg text-center transition-all border ' + (
              mode === m.key ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-primary)]/50'
            )}>
            <div className="text-sm font-bold">{m.label}</div>
            <div className="text-[10px] mt-0.5 opacity-70">{m.desc}</div>
          </button>
        ))}
      </div>

      {mode === 'dantuo' && (
        <div className="flex gap-4 text-xs">
          <span className="text-amber-400">● 胆码（{danNums.length}个）选{playType - 1}个</span>
          <span className="text-[var(--color-primary)]">● 拖码（{tuoNums.length}个）</span>
        </div>
      )}

      {mode === 'compound' && (
        <div className="text-xs text-[var(--color-muted)]">
          已选 <span className="text-emerald-400 font-bold">{singleNums.length}</span> 个号（至少选{playType}个，最多{maxCompound}个）
        </div>
      )}

      {mode === 'single' && (
        <div className="text-xs text-[var(--color-muted)]">
          已选 <span className="text-[var(--color-primary)] font-bold">{singleNums.length}</span> / {playType} 个号
        </div>
      )}

      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: 80 }, (_, i) => i + 1).map(n => (
          <button key={n} onClick={() => toggleNum(n)}
            className={'w-full aspect-square rounded-lg text-xs font-bold transition-all ' + getNumStyle(n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="glass-inset p-3 flex items-center justify-between">
        <div>
          <span className="text-sm text-[var(--color-muted)]">组合数: </span>
          <span className="font-bold font-mono text-lg">{comboCount}</span>
          <span className="text-xs text-[var(--color-muted)] ml-2">注 × 2元 = </span>
          <span className="font-bold font-mono text-lg text-amber-400">{cost}元</span>
        </div>
        <button onClick={handleGenerate} disabled={comboCount === 0}
          className="px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all">
          生成号码
        </button>
      </div>
    </div>
  );
}
