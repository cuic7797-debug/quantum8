import CopyButton from '@/components/common/CopyButton';
import Collapsible from '@/components/common/Collapsible';
import { useState, useEffect } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import { useAuth } from '@/hooks/useAuth';
import { useUserStrategies } from '@/hooks/useUserStrategies';
import type { ScoreResult, PlayType } from '@quantum8/types';
import { t } from '@/hooks/useI18n';

interface Strategy {
  id: string; name: string; description: string; playType: PlayType;
  hotCount: number; coldCount: number; balanceCount: number; zoneBalance: boolean;
  sumRange: [number, number]; oddEvenRange: [number, number]; maxConsecutive: number;
  createdAt: string; lastResult?: ScoreResult[];
}

const STORAGE_KEY = 'quantum8_strategies';
const PT = [t('play5'), t('play6'), t('play7'), t('play8'), t('play9'), t('play10')];

export default function StrategyPage() {
  const { user } = useAuth();
  const cloud = useUserStrategies();
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Strategy | null>(null);
  const [generating, setGenerating] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPlayType, setFormPlayType] = useState<PlayType>(t('play10') as PlayType);
  const [formHot, setFormHot] = useState(4);
  const [formCold, setFormCold] = useState(4);
  const [formBalance, setFormBalance] = useState(2);
  const [formZoneBalance, setFormZoneBalance] = useState(true);
  const [formSumMin, setFormSumMin] = useState(400);
  const [formSumMax, setFormSumMax] = useState(1200);
  const [formOddMin, setFormOddMin] = useState(5);
  const [formOddMax, setFormOddMax] = useState(15);
  const [formMaxConsec, setFormMaxConsec] = useState(3);

  useEffect(() => {
    if (user && cloud.strategies.length > 0) {
      const mapped = cloud.strategies.map(cs => ({
        id: cs.id, name: cs.name, description: cs.description || '',
        playType: (cs.config as any).playType || t('play10') as PlayType,
        hotCount: (cs.config as any).hotCount || 4,
        coldCount: (cs.config as any).coldCount || 4,
        balanceCount: (cs.config as any).balanceCount || 2,
        zoneBalance: (cs.config as any).zoneBalance ?? true,
        sumRange: (cs.config as any).sumRange || [400, 1200],
        oddEvenRange: (cs.config as any).oddEvenRange || [5, 15],
        maxConsecutive: (cs.config as any).maxConsecutive || 3,
        createdAt: cs.created_at,
      }));
      setStrategies(mapped);
    } else if (!user) {
      try { setStrategies(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { setStrategies([]); }
    }
  }, [user, cloud.strategies]);

  function saveStrategies(list: Strategy[]) {
    setStrategies(list);
    if (!user) localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function resetForm() {
    setFormName(''); setFormDesc(''); setFormPlayType(t('play10') as PlayType);
    setFormHot(4); setFormCold(4); setFormBalance(2); setFormZoneBalance(true);
    setFormSumMin(400); setFormSumMax(1200); setFormOddMin(5); setFormOddMax(15); setFormMaxConsec(3);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    const config = {
      playType: formPlayType, hotCount: formHot, coldCount: formCold, balanceCount: formBalance,
      zoneBalance: formZoneBalance, sumRange: [formSumMin, formSumMax] as [number, number], oddEvenRange: [formOddMin, formOddMax] as [number, number],
      maxConsecutive: formMaxConsec,
    };
    if (user) {
      if (editing) {
        await cloud.updateStrategy(editing.id, { name: formName.trim(), description: formDesc.trim(), config });
      } else {
        await cloud.addStrategy(formName.trim(), formDesc.trim(), config);
      }
    } else {
      const s: Strategy = {
        id: editing?.id || Date.now().toString(), name: formName.trim(), description: formDesc.trim(),
        ...config, createdAt: editing?.createdAt || new Date().toISOString(),
      };
      saveStrategies(editing ? strategies.map(x => x.id === editing.id ? s : x) : [...strategies, s]);
    }
    setShowCreate(false); setEditing(null); resetForm();
  }

  function handleEdit(s: Strategy) {
    setEditing(s); setShowCreate(true);
    setFormName(s.name); setFormDesc(s.description); setFormPlayType(s.playType);
    setFormHot(s.hotCount); setFormCold(s.coldCount); setFormBalance(s.balanceCount);
    setFormZoneBalance(s.zoneBalance); setFormSumMin(s.sumRange[0]); setFormSumMax(s.sumRange[1]);
    setFormOddMin(s.oddEvenRange[0]); setFormOddMax(s.oddEvenRange[1]); setFormMaxConsec(s.maxConsecutive);
  }

  async function handleDelete(id: string) {
    if (user) { await cloud.deleteStrategy(id); }
    else { saveStrategies(strategies.filter(x => x.id !== id)); }
    setCompareIds(compareIds.filter(x => x !== id));
  }

  function runStrategy(s: Strategy) {
    if (!stats.length || !draws.length) return;
    setGenerating(true);
    setTimeout(() => {
      const pc = PT.indexOf(s.playType) + 5;
      const cfg = { hotCount: s.hotCount, coldCount: s.coldCount, balanceCount: s.balanceCount,
        zoneBalance: s.zoneBalance, sumRange: s.sumRange, oddEvenRange: s.oddEvenRange, maxConsecutive: s.maxConsecutive };
      const c = generateBatch(pc, 3000);
      const f = applyFilters(c, cfg);
      const results = f.slice(0, 80).map(x => scoreCombination(x, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
      saveStrategies(strategies.map(x => x.id === s.id ? { ...x, lastResult: results } : x));
      setGenerating(false);
    }, 100);
  }

  function toggleCompare(id: string) {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev);
  }

  const compared = strategies.filter(s => compareIds.includes(s.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('strategy_lab')}</h2>
        <button onClick={() => { resetForm(); setEditing(null); setShowCreate(true); }}
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/80 transition-all">
          + {t('create_strategy')}
        </button>
      </div>
      {user && <div className="text-xs text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-2">☁️ 策略已同步到云端</div>}

      {/* Create/Edit Form */}
      {showCreate && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-semibold">{editing ? t('edit_strategy') : t('create_strategy')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('strategy_name')}</label>
              <input value={formName} onChange={e => setFormName(e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm" placeholder="策略名称" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('play_type')}</label>
              <select value={formPlayType} onChange={e => setFormPlayType(e.target.value as PlayType)}
                className="w-full glass-input px-3 py-2 text-sm">
                {PT.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-muted)] block mb-1">{t('description')}</label>
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
              className="w-full glass-input px-3 py-2 text-sm" placeholder="策略说明（可选）" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('hot_count')}</label>
              <input type="number" min={0} max={20} value={formHot} onChange={e => setFormHot(+e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('cold_count')}</label>
              <input type="number" min={0} max={20} value={formCold} onChange={e => setFormCold(+e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('balance_count')}</label>
              <input type="number" min={0} max={20} value={formBalance} onChange={e => setFormBalance(+e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('sum_range')}</label>
              <div className="flex gap-1">
                <input type="number" value={formSumMin} onChange={e => setFormSumMin(+e.target.value)}
                  className="w-1/2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm font-mono" />
                <span className="text-[var(--color-muted)] py-2">-</span>
                <input type="number" value={formSumMax} onChange={e => setFormSumMax(+e.target.value)}
                  className="w-1/2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('odd_range')}</label>
              <div className="flex gap-1">
                <input type="number" value={formOddMin} onChange={e => setFormOddMin(+e.target.value)}
                  className="w-1/2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm font-mono" />
                <span className="text-[var(--color-muted)] py-2">-</span>
                <input type="number" value={formOddMax} onChange={e => setFormOddMax(+e.target.value)}
                  className="w-1/2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-2 py-2 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs text-[var(--color-muted)] block mb-1">{t('max_consecutive')}</label>
              <input type="number" min={1} max={10} value={formMaxConsec} onChange={e => setFormMaxConsec(+e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm font-mono" />
            </div>
          </div>
          <div className="flex gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formZoneBalance} onChange={e => setFormZoneBalance(e.target.checked)}
                className="rounded" />
              {t('zone_balance')}
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={!formName.trim()}
              className="px-6 py-2 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all">
              {editing ? t('save') : t('create')}
            </button>
            <button onClick={() => { setShowCreate(false); setEditing(null); }}
              className="px-6 py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-all">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Strategy List */}
      {strategies.length > 0 && (
        <div className="space-y-3">
          {strategies.map(s => (
            <div key={s.id} className="glass-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{s.name}</h3>
                  {s.description && <p className="text-xs text-[var(--color-muted)] mt-1">{s.description}</p>}
                </div>
                <label className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                  <input type="checkbox" checked={compareIds.includes(s.id)} onChange={() => toggleCompare(s.id)} />
                  {t('compare')}
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-1 rounded text-xs">{s.playType}</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">{t('sum_range')} {s.sumRange[0]}-{s.sumRange[1]}</span>
                <span className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded">{t('odd_range')} {s.oddEvenRange[0]}-{s.oddEvenRange[1]}</span>
                <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded">{t('max_consecutive')} {s.maxConsecutive}</span>
                {s.zoneBalance && <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded">{t('zone_balance')}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => runStrategy(s)} disabled={generating}
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all">
                  {generating ? t('generating_') : t('run_strategy')}
                </button>
                <button onClick={() => handleEdit(s)} className="px-4 py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-muted)] text-sm hover:bg-[var(--color-border)] transition-all">
                  {t('edit')}
                </button>
                <button onClick={() => handleDelete(s.id)} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-all">
                  {t('delete_strategy')}
                </button>
              </div>
              {s.lastResult && s.lastResult.length > 0 && (
                <Collapsible title={t('last_results') + ' (' + s.lastResult.length + '组)'} defaultOpen={false} badge={s.lastResult[0]?.numbers.join(' ')}>
                <div className="space-y-2">
                  {s.lastResult.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 glass-inset">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-500 text-black' : i < 3 ? 'bg-[var(--color-muted)] text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]'}`}>{i + 1}</span>
                        <div className="flex gap-0.5">{r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${r.riskLevel === '低' ? 'text-emerald-400' : r.riskLevel === '中' ? 'text-amber-400' : 'text-red-400'}`}>{r.riskLevel}风险</span>
                        <CopyButton text={r.numbers.join(' ')} label="复制" />
                        <span className="font-bold font-mono text-sm">{r.totalScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Collapsible>
              )}
            </div>
          ))}
        </div>
      )}

      {compared.length >= 2 && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="font-semibold">{t('strategy_compare')}（{compared.length}）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-muted)] text-xs">
                  <th className="text-left py-2 px-3">{t('indicator')}</th>
                  {compared.map(s => <th key={s.id} className="text-center py-2 px-3">{s.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: t('play'), fn: (s: Strategy) => s.playType },
                  { label: t('hot_cold_balance'), fn: (s: Strategy) => `${s.hotCount}/${s.coldCount}/${s.balanceCount}` },
                  { label: t('sum_range'), fn: (s: Strategy) => `${s.sumRange[0]}-${s.sumRange[1]}` },
                  { label: t('odd_range'), fn: (s: Strategy) => `${s.oddEvenRange[0]}-${s.oddEvenRange[1]}` },
                  { label: t('max_consecutive'), fn: (s: Strategy) => String(s.maxConsecutive) },
                  { label: 'TOP 1 平均分', fn: (s: Strategy) => s.lastResult && s.lastResult.length > 0 ? (s.lastResult.reduce((a, b) => a + b.totalScore, 0) / s.lastResult.length).toFixed(1) : '-' },
                  { label: t('low_risk_ratio'), fn: (s: Strategy) => { if (!s.lastResult || !s.lastResult.length) return '-'; const low = s.lastResult.filter(r => r.riskLevel === '低').length; return `${((low / s.lastResult.length) * 100).toFixed(0)}%`; } },
                ].map((row, i) => (
                  <tr key={i} className="border-t border-[var(--color-border)]">
                    <td className="py-2 px-3 text-[var(--color-muted)]">{row.label}</td>
                    {compared.map(s => <td key={s.id} className="text-center py-2 px-3 font-mono">{row.fn(s)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {strategies.length === 0 && !showCreate && (
        <div className="text-center py-12 text-[var(--color-muted)]">
          <div className="text-4xl mb-4">🧪</div>
          <p className="text-sm">还没有策略</p>
          <p className="text-xs mt-1">创建你的第一个策略，开始量化分析</p>
        </div>
      )}
    </div>
  );
}
