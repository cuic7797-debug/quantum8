import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

export default function HistoryPage() {
  const { draws } = useDraws(100);
  const [tab, setTab] = useState<'check' | 'records'>('check');
  const [cn, setCn] = useState('');
  const [cr, setCr] = useState<{ m: number[]; h: number; d: string } | null>(null);
  const [sd, setSd] = useState('');
  function go() {
    const input = cn.trim().split(/[\s,]+/).map(Number).filter(n => n >= 1 && n <= 80);
    if (!input.length || !sd) return;
    const draw = draws.find(d => d.draw_number === sd);
    if (!draw) return;
    const m = input.filter(n => draw.numbers.includes(n));
    setCr({ m, h: m.length, d: draw.draw_number });
  }
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">{t('history_record')}</h2>
      <div className="flex gap-2">
        <button onClick={() => setTab('check')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'check' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'}`}>{t('check_numbers')}</button>
        <button onClick={() => setTab('records')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'records' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-surface)] text-[var(--color-muted)]'}`}>{t('my_picks')}</button>
      </div>
      {tab === 'check' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <div><label className="text-sm text-[var(--color-muted)] mb-1 block">{t('select_draw')}</label><select value={sd} onChange={e => setSd(e.target.value)} className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm"><option value="">{t('please_select')}</option>{draws.map(d => <option key={d.draw_number} value={d.draw_number}>{d.draw_number} ({d.draw_date})</option>)}</select></div>
          <div><label className="text-sm text-[var(--color-muted)] mb-1 block">{t('enter_numbers')}</label><input type="text" value={cn} onChange={e => setCn(e.target.value)} placeholder="1 5 12 23 34" className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" /></div>
          <button onClick={go} className="w-full py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-colors">{t('check')}</button>
          {cr && (<div className="bg-[var(--color-bg)] rounded-lg p-4"><div className="text-sm mb-2">{cr.d} - {t('hit_count')}: {cr.h}</div>{cr.h > 0 ? <div className="flex flex-wrap gap-1">{cr.m.map(n => <NumberBall key={n} number={n} size="md" highlight />)}</div> : <div className="text-sm text-[var(--color-muted)]">{t('no_match')}</div>}</div>)}
          {sd && (<div className="bg-[var(--color-bg)] rounded-lg p-4"><div className="text-xs text-[var(--color-muted)] mb-2">{t('draw_numbers')}</div><div className="flex flex-wrap gap-1">{draws.find(d => d.draw_number === sd)?.numbers.map(n => <NumberBall key={n} number={n} size="md" />)}</div></div>)}
        </div>
      )}
      {tab === 'records' && <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5"><div className="text-center py-8 text-[var(--color-muted)] text-sm">{t('no_records')}</div></div>}
    </div>
  );
}
