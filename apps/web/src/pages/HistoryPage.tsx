import { useState, useEffect } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

interface SavedPick { numbers: number[]; playType: string; score: number; risk: string; time: string; }

export default function HistoryPage() {
  const { draws } = useDraws(100);
  const [tab, setTab] = useState<'check' | 'records'>('check');
  const [cn, setCn] = useState('');
  const [cr, setCr] = useState<{ m: number[]; h: number; d: string; drawNums: number[] } | null>(null);
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
    setCr({ m, h: m.length, d: draw.draw_number, drawNums: draw.numbers });
  }

  function clearPicks() {
    localStorage.removeItem('quantum8_picks');
    setPicks([]);
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('history_record')}</h2>
      <div className="flex gap-2">
        <button onClick={() => setTab('check')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'check' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-white'}`}>{t('check_numbers')}</button>
        <button onClick={() => setTab('records')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'records' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-white'}`}>{t('my_picks')} ({picks.length})</button>
      </div>

      {tab === 'check' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div><label className="text-sm text-[var(--color-muted)] mb-1 block">{t('select_draw')}</label>
            <select value={sd} onChange={e => { setSd(e.target.value); setCr(null); }} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm">
              <option value="">{t('please_select')}</option>
              {draws.map(d => <option key={d.draw_number} value={d.draw_number}>{d.draw_number} ({d.draw_date})</option>)}
            </select>
          </div>
          <div><label className="text-sm text-[var(--color-muted)] mb-1 block">{t('enter_numbers')}</label>
            <input type="text" value={cn} onChange={e => setCn(e.target.value)} placeholder="1 5 12 23 34 45 56 67 78 80"
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
          </div>
          <button onClick={go} className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-colors">{t('check')}</button>

          {cr && (
            <div className="bg-[var(--color-bg)] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">{cr.d} — {t('hit_count')}: <span className={`font-bold text-lg ${cr.h>=5?'text-emerald-400':cr.h>=3?'text-amber-400':'text-[var(--color-primary)]'}`}>{cr.h}</span></div>
                {cr.h > 0 && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">恭喜中奖！</span>}
              </div>
              {cr.h > 0 && <div className="flex flex-wrap gap-1">{cr.m.map(n => <NumberBall key={n} number={n} size="md" highlight />)}</div>}
              {cr.h === 0 && <div className="text-sm text-[var(--color-muted)]">{t('no_match')}</div>}
              <div><div className="text-xs text-[var(--color-muted)] mb-1">开奖号码</div><div className="flex flex-wrap gap-1">{cr.drawNums.map(n => <NumberBall key={n} number={n} size="sm" />)}</div></div>
            </div>
          )}
        </div>
      )}

      {tab === 'records' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
          {picks.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-muted)]">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-sm">{t('no_records')}</div>
              <div className="text-xs mt-1">在「智能选号」页面生成后点击保存</div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-[var(--color-muted)]">共 {picks.length} 条记录</span>
                <button onClick={clearPicks} className="text-xs text-red-400 hover:text-red-300">清空</button>
              </div>
              <div className="space-y-2">
                {picks.map((pick, i) => (
                  <div key={i} className="bg-[var(--color-bg)] rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs px-2 py-0.5 rounded">{pick.playType}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${pick.risk==='低'?'bg-emerald-500/10 text-emerald-400':pick.risk==='中'?'bg-amber-500/10 text-amber-400':'bg-red-500/10 text-red-400'}`}>{pick.risk}风险</span>
                        <span className="text-xs text-[var(--color-muted)] font-mono">{pick.score}分</span>
                      </div>
                      <span className="text-[10px] text-[var(--color-muted)]">{new Date(pick.time).toLocaleDateString()} {new Date(pick.time).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">{pick.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
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
