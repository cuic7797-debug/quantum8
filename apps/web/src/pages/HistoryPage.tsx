import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { supabase } from '@/utils/supabase';
import { formatNumber } from '@/utils/format';
import type { PlayType, NoteType } from '@quantum8/types';

interface LocalNote {
  id: string;
  date: string;
  playType: PlayType;
  noteType: NoteType;
  numbers: number[];
}

const PLAY_TYPES: PlayType[] = ['选一','选二','选三','选四','选五','选六','选七','选八','选九','选十'];

export default function HistoryPage() {
  const { draws } = useDraws(100);
  const [tab, setTab] = useState<'check' | 'records'>('check');
  const [checkNumbers, setCheckNumbers] = useState('');
  const [checkResult, setCheckResult] = useState<{ matched: number[]; hitCount: number; draw: string } | null>(null);
  const [selectedDraw, setSelectedDraw] = useState<string>('');
  const [localRecords] = useState<LocalNote[]>(() => {
    try { return JSON.parse(localStorage.getItem('quantum8_records') || '[]'); }
    catch { return []; }
  });

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
        <button onClick={() => setTab('check')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'check' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
          }`}>
          核奖验奖
        </button>
        <button onClick={() => setTab('records')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'records' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'
          }`}>
          选号记录
        </button>
      </div>

      {tab === 'check' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">选择期号</label>
            <select
              value={selectedDraw}
              onChange={(e) => setSelectedDraw(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"
            >
              <option value="">请选择</option>
              {draws.map((d) => (
                <option key={d.draw_number} value={d.draw_number}>
                  {d.draw_number} ({d.draw_date})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">输入你的号码（空格或逗号分隔）</label>
            <input
              type="text"
              value={checkNumbers}
              onChange={(e) => setCheckNumbers(e.target.value)}
              placeholder="例如: 1 5 12 23 34 45 56 67 78 80"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono"
            />
          </div>
          <button onClick={handleCheck}
            className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-colors">
            核奖
          </button>

          {checkResult && (
            <div className="bg-[var(--color-bg)] rounded-lg p-4">
              <div className="text-sm mb-2">
                期号 <span className="font-mono font-bold">{checkResult.draw}</span> · 命中 <span className="font-bold text-[var(--color-primary)]">{checkResult.hitCount}</span> 个
              </div>
              {checkResult.hitCount > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {checkResult.matched.map((n) => (
                    <NumberBall key={n} number={n} size="md" highlight />
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[var(--color-muted)]">未命中</div>
              )}
            </div>
          )}

          {/* 开奖号码对照 */}
          {selectedDraw && (
            <div className="bg-[var(--color-bg)] rounded-lg p-4">
              <div className="text-xs text-[var(--color-muted)] mb-2">开奖号码</div>
              <div className="flex flex-wrap gap-1">
                {draws.find((d) => d.draw_number === selectedDraw)?.numbers.map((n) => (
                  <NumberBall key={n} number={n} size="md" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'records' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          {localRecords.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted)] text-sm">
              暂无选号记录<br />
              <span className="text-xs">在「智能选号」页面生成号码后会自动保存</span>
            </div>
          ) : (
            <div className="space-y-3">
              {localRecords.map((rec) => (
                <div key={rec.id} className="py-3 border-b border-[var(--color-border)] last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--color-muted)]">{rec.date}</span>
                    <div className="flex gap-2 text-xs">
                      <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded">{rec.playType}</span>
                      <span className="bg-[var(--color-bg)] text-[var(--color-muted)] px-2 py-0.5 rounded">{rec.noteType}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {rec.numbers.map((n) => (
                      <NumberBall key={n} number={n} size="sm" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
