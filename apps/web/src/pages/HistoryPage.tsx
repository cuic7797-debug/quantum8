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
      <h2 className="text-xl font-bold">History</h2>
      <div className="flex gap-2">
        <button onClick={() => setTab('check')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'check' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'}`}>Check Numbers</button>
        <button onClick={() => setTab('records')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'records' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'}`}>My Picks</button>
      </div>
      {tab === 'check' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">Select Draw</label>
            <select value={selectedDraw} onChange={(e) => setSelectedDraw(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              <option value="">Choose...</option>
              {draws.map((d) => (<option key={d.draw_number} value={d.draw_number}>{d.draw_number} ({d.draw_date})</option>))}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">Your Numbers (space or comma separated)</label>
            <input type="text" value={checkNumbers} onChange={(e) => setCheckNumbers(e.target.value)}
              placeholder="e.g. 1 5 12 23 34 45 56 67 78 80"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <button onClick={handleCheck} className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-colors">Check</button>
          {checkResult && (
            <div className="bg-[var(--color-bg)] rounded-lg p-4">
              <div className="text-sm mb-2">Draw <span className="font-mono font-bold">{checkResult.draw}</span> — Hit <span className="font-bold text-[var(--color-primary)]">{checkResult.hitCount}</span> numbers</div>
              {checkResult.hitCount > 0 ? (
                <div className="flex flex-wrap gap-1">{checkResult.matched.map((n) => <NumberBall key={n} number={n} size="md" highlight />)}</div>
              ) : <div className="text-sm text-[var(--color-muted)]">No match</div>}
            </div>
          )}
          {selectedDraw && (
            <div className="bg-[var(--color-bg)] rounded-lg p-4">
              <div className="text-xs text-[var(--color-muted)] mb-2">Draw Numbers</div>
              <div className="flex flex-wrap gap-1">
                {draws.find((d) => d.draw_number === selectedDraw)?.numbers.map((n) => <NumberBall key={n} number={n} size="md" />)}
              </div>
            </div>
          )}
        </div>
      )}
      {tab === 'records' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="text-center py-8 text-[var(--color-muted)] text-sm">No pick records yet.</div>
        </div>
      )}
    </div>
  );
}
