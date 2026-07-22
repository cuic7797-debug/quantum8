import { useState, useEffect } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

interface SavedPick { numbers: number[]; playType: string; score: number; risk: string; time: string; strategy?: string; }

export default function HistoryPage() {
  const { draws } = useDraws(100);
  const [tab, setTab] = useState<'check' | 'records'>('check');
  const [cn, setCn] = useState('');
  const [cr, setCr] = useState<{ m: number[]; h: number; d: string } | null>(null);
  const [sd, setSd] = useState('');
  const [picks, setPicks] = useState<SavedPick[]>([]);

  useEffect(() => {
    try { setPicks(JSON.parse(localStorage.getItem('quantum8_picks') || '[]')); } catch { setPicks([]); }
  }, []);

  function go() {
    const input = cn.trim().split(/[\s,]+/).map(Number).filter(n => n >= 1 && n <= 80);
    if (!input.length || !sd) return;
    const draw = draws.find(d => d.draw_number === sd);
    if (!draw) return;
    const m = input.filter(n => draw.numbers.includes(n));
    setCr({ m, h: m.length, d: draw.draw_number });
  }

  function clearPicks() { localStorage.removeItem('quantum8_picks'); setPicks([]); }
  function exportPicks() {
    if (!picks.length) return;
    const lines = picks.map(p => `[${p.time}] ${p.playType} | ${p.numbers.join(' ')} | Score:${p.score} ${p.risk}${p.strategy ? ` | ${p.strategy}` : ''}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `quantum8_picks_${new Date().toISOString().slice(0, 10)}.txt`; a.click();
  }

  function deletePick(index: number) {
    const updated = picks.filter((_, i) => i !== index);
    setPicks(updated);
    localStorage.setItem('quantum8_picks', JSON.stringify(updated));
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('history_record')}</h2>
      <div className="flex gap-2">
        <button onClick={() => setTab('check')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'check' ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
          {t('check_numbers')}
        </button>
        <button onClick={() => setTab('records')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'records' ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
          {t('my_picks')} ({picks.length})
        </button>
      </div>

      {tab === 'check' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">{t('select_draw')}</label>
            <select value={sd} onChange={e => setSd(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              <option value="">{t('please_select')}</option>
              {draws.map(d => <option key={d.draw_number} value={d.draw_number}>{d.draw_number} ({d.draw_date})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">{t('enter_numbers')}</label>
            <input type="text" value={cn} onChange={e => setCn(e.target.value)}
              placeholder="1 5 12 23 34 45 56 67 78 80"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <button onClick={go}
            className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-all shadow">
            {t('check')}
          </button>

          {cr && (
            <div className="bg-[var(--color-bg)] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">{cr.d}</div>
                <div className={`text-lg font-bold ${cr.h >= 5 ? 'text-emerald-400' : cr.h >= 3 ? 'text-amber-400' : 'text-[var(--color-muted)]'}`}>
                  {t('hit_count')}: {cr.h} {t('pcs')}
                </div>
              </div>
              {cr.h > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {cr.m.map(n => <NumberBall key={n} number={n} size="md" highlight />)}
                </div>
              ) : (
                <div className="text-sm text-[var(--color-muted)]">{t('no_match')}</div>
              )}
            </div>
          )}
          {sd && (
            <div className="bg-[var(--color-bg)] rounded-xl p-4">
              <div className="text-xs text-[var(--color-muted)] mb-2">{t('draw_numbers')}</div>
              <div className="flex flex-wrap gap-1">
                {draws.find(d => d.draw_number === sd)?.numbers.map(n => <NumberBall key={n} number={n} size="md" />)}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'records' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          {picks.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted)] text-sm">
              {t('no_records')}<br />
              <span className="text-xs">在「智能选号」页面生成号码后点击「保存」</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-muted)]">已保存的选号</h3>
                <div className="flex gap-2">
                  <button onClick={exportPicks} className="text-xs text-[var(--color-primary)] hover:underline">导出TXT</button>
                  <button onClick={clearPicks} className="text-xs text-red-400 hover:underline">清空</button>
                </div>
              </div>
              <div className="space-y-3">
                {picks.map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs text-[var(--color-muted)]">{new Date(p.time).toLocaleDateString()}</span>
                        <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded">{p.playType}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${p.risk === '低' ? 'bg-emerald-500/20 text-emerald-400' : p.risk === '中' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                          {p.risk}风险
                        </span>
                        {p.strategy && <span className="text-xs text-[var(--color-muted)]">| {p.strategy}</span>}
                      </div>
                      <div className="flex gap-1 flex-wrap">{p.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <div className="text-right">
                        <div className="font-bold font-mono">{p.score}</div>
                        <div className="text-[10px] text-[var(--color-muted)]">评分</div>
                      </div>
                      <button onClick={() => deletePick(i)} className="text-xs text-red-400 hover:underline">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
