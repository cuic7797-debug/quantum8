import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

export default function HistoryPage() {
  const { draws } = useDraws(100);
  const [tab, setTab] = useState<'check' | 'records'>('check');
  const [checkNumbers, setCheckNumbers] = useState('');
  const [checkResult, setCheckResult] = useState<{ matched: number[]; hitCount: number; draw: string } | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<string>('');

  function handleCheck() {
    const input = checkNumbers.trim().split(/[\s,]+/).map(Number).filter((n) => n >= 1 && n <= 80);
    if (input.length === 0 || !selectedDraw) return;
    const draw = draws.find((d) => d.draw_number === selectedDraw);
    if (!draw) return;
    const matched = input.filter((n) => draw.numbers.includes(n));
    setCheckResult({ matched, hitCount: matched.length, draw: draw.draw_number });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">历史记录</h2>
      <div className="flex gap-2">
        <button onClick={() => setTab('check')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'check' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'}`}>核奖验奖</button>
        <button onClick={() => setTab('records')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'records' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'}`}>选号记录</button>
      </div>
      {tab === 'check' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div><label className="text-sm text-[var(--color-muted)] mb-1 block">选择期号</label><select value={selectedDraw} onChange={(e) => setSelectedDraw(e.target.value)} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"><option value="">请选择</option>{draws.map((d) => (<option key={d.draw_number} value={d.draw_number}>{d.draw_number} ({d.draw_date})</option>))}</select></div>
          <div><label className="text-sm text-[var(--color-muted)] mb-1 block">输入你的号码（空格或逗号分隔）</label><input type="text" value={checkNumbers} onChange={(e) => setCheckNumbers(e.target.value)} placeholder="例如: 1 5 12 23 34 45 56 67 78 80" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" /></div>
          <button onClick={handleCheck} className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-colors">核奖</button>
          {checkResult && (<div className="bg-[var(--color-bg)] rounded-lg p-4"><div className="text-sm mb-2">期号 <span className="font-mono font-bold">{checkResult.draw}</span> · 命中 <span className="font-bold text-[var(--color-primary)]">{checkResult.hitCount}</span> 个</div>{checkResult.hitCount > 0 ? (<div className="flex flex-wrap gap-1">{checkResult.matched.map((n) => <NumberBall key={n} number={n} size="md" highlight />)}</div>) : (<div className="text-sm text-[var(--color-muted)]">未命中</div>)}</div>)}
          {selectedDraw && (<div className="bg-[var(--color-bg)] rounded-lg p-4"><div className="text-xs text-[var(--color-muted)] mb-2">开奖号码</div><div className="flex flex-wrap gap-1">{draws.find((d) => d.draw_number === selectedDraw)?.numbers.map((n) => <NumberBall key={n} number={n} size="md" />)}</div></div>)}
        </div>
      )}
      {tab === 'records' && (<div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5"><div className="text-center py-8 text-[var(--color-muted)] text-sm">暂无选号记录</div></div>)}
    </div>
  );
}
