import CopyButton from '@/components/common/CopyButton';
import { useState, useEffect } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useAuth } from '@/hooks/useAuth';
import { useUserPicks } from '@/hooks/useUserPicks';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

interface SavedPick { numbers: number[]; playType: string; score: number; risk: string; time: string; strategy?: string; }

export default function HistoryPage() {
  const { user } = useAuth();
  const { picks: cloudPicks, deletePick: deleteCloudPick } = useUserPicks();
  const { draws, loading: ld } = useDraws(100);
  const [tab, setTab] = useState<'check' | 'records'>('check');
  const [cn, setCn] = useState('');
  const [cr, setCr] = useState<{ m: number[]; h: number; d: string } | null>(null);
  const [sd, setSd] = useState('');
  const [picks, setPicks] = useState<SavedPick[]>([]);

  useEffect(() => {
    try { setPicks(JSON.parse(localStorage.getItem('quantum8_picks') || '[]')); } catch { setPicks([]); }
  }, []);
  if (ld) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><span className="text-base text-[var(--color-muted)]">加载中...</span></div></div>;

  const displayPicks = user
    ? cloudPicks.map(cp => ({
        numbers: cp.numbers,
        playType: cp.play_type || '选十',
        score: 0,
        risk: '中',
        time: cp.created_at,
        strategy: cp.strategy_label || '',
        id: cp.id,
      }))
    : picks;

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
    if (!displayPicks.length) return;
    const lines = displayPicks.map(p => `[${p.time}] ${p.playType} | ${p.numbers.join(' ')} | Score:${p.score} ${p.risk}${p.strategy ? ` | ${p.strategy}` : ''}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `quantum8_picks_${new Date().toISOString().slice(0, 10)}.txt`; a.click();
  }

  async function deletePick(index: number) {
    if (user) {
      const cp = cloudPicks[index];
      if (cp) await deleteCloudPick(cp.id);
    } else {
      const updated = picks.filter((_, i) => i !== index);
      setPicks(updated);
      localStorage.setItem('quantum8_picks', JSON.stringify(updated));
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{t('history_record')}</h2>
      {user && <div className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-2">☁️ 选号记录已同步到云端</div>}
      <div className="flex gap-2">
        <button onClick={() => setTab('check')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'check' ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
          {t('check_numbers')}
        </button>
        <button onClick={() => setTab('records')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'records' ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
          {t('my_picks')} ({displayPicks.length})
        </button>
      </div>

      {tab === 'check' && (
        <div className="glass-card p-5 space-y-4">
          <div>
            <label className="text-base text-[var(--color-muted)] mb-1 block">{t('select_draw')}</label>
            <select value={sd} onChange={e => setSd(e.target.value)}
              className="w-full glass-input px-3 py-2 text-sm">
              <option value="">{t('please_select')}</option>
              {draws.map(d => <option key={d.draw_number} value={d.draw_number}>{d.draw_number} ({d.draw_date})</option>)}
            </select>
          </div>
          <div>
            <label className="text-base text-[var(--color-muted)] mb-1 block">{t('enter_numbers')}</label>
            <input type="text" value={cn} onChange={e => setCn(e.target.value)} placeholder="1 5 12 23 34 45 56 67 78 80"
              className="w-full glass-input px-3 py-2 text-sm font-mono" />
          </div>
          <button onClick={go} className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-all shadow">
            {t('check')}
          </button>
          {cr && (
            <div className="glass-inset p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">{cr.d}</div>
                <div className={`text-lg font-bold ${cr.h >= 5 ? 'text-emerald-400' : cr.h >= 3 ? 'text-amber-400' : 'text-[var(--color-muted)]'}`}>
                  {t('hit_count')}: {cr.h} {t('pcs')}
                </div>
              </div>
              {cr.h > 0 ? <div className="flex flex-wrap gap-1">{cr.m.map(n => <NumberBall key={n} number={n} size="md" highlight />)}</div> : <div className="text-base text-[var(--color-muted)]">{t('no_match')}</div>}
            </div>
          )}
          {sd && (
            <div className="glass-inset p-4">
              <div className="text-sm text-[var(--color-muted)] mb-2">{t('draw_numbers')}</div>
              <div className="flex flex-wrap gap-1">{draws.find(d => d.draw_number === sd)?.numbers.map(n => <NumberBall key={n} number={n} size="md" />)}</div>
            </div>
          )}
        </div>
      )}

      {tab === 'records' && (
        <div className="glass-card p-5">
          {displayPicks.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-muted)] text-sm">
              {t('no_records')}<br /><span className="text-xs">{t('pick_save_hint')}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-muted)]">{t('saved_picks')}</h3>
                <div className="flex gap-2">
                  <button onClick={exportPicks} className="text-xs text-[var(--color-primary)] hover:underline">{t('export_txt')}</button>
                  {!user && <button onClick={clearPicks} className="text-xs text-red-400 hover:underline">{t('clear_all')}</button>}
                </div>
              </div>
              <div className="space-y-3">
                {displayPicks.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm text-[var(--color-muted)]">{new Date(p.time).toLocaleDateString()}</span>
                        <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded">{p.playType}</span>
                        {p.strategy && <span className="text-sm text-[var(--color-muted)]">| {p.strategy}</span>}
                      </div>
                      <div className="flex gap-1 flex-wrap">{p.numbers.map((n: number) => <NumberBall key={n} number={n} size="sm" />)}</div>
                    </div>
                    <CopyButton text={p.numbers.join(' ')} label="复制" />
                    <button onClick={() => deletePick(i)} className="text-xs text-red-400 hover:underline shrink-0">{t('delete')}</button>
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
