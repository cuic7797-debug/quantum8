import { useState, useEffect } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import type { ScoreResult, PlayType } from '@quantum8/types';
import { t } from '@/hooks/useI18n';

interface Strategy {
  id: string;
  name: string;
  description: string;
  playType: PlayType;
  hotCount: number;
  coldCount: number;
  balanceCount: number;
  zoneBalance: boolean;
  sumRange: [number, number];
  oddEvenRange: [number, number];
  maxConsecutive: number;
  createdAt: string;
  lastResult?: ScoreResult[];
}

const STORAGE_KEY = 'quantum8_strategies';
const PT = [t('play5'), t('play6'), t('play7'), t('play8'), t('play9'), t('play10')];

export default function StrategyPage() {
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
    try {
      setStrategies(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch { setStrategies([]); }
  }, []);

  function saveStrategies(list: Strategy[]) {
    setStrategies(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function resetForm() {
    setFormName(''); setFormDesc(''); setFormPlayType(t('play10') as PlayType);
    setFormHot(4); setFormCold(4); setFormBalance(2); setFormZoneBalance(true);
    setFormSumMin(400); setFormSumMax(1200); setFormOddMin(5); setFormOddMax(15); setFormMaxConsec(3);
  }

  function handleSave() {
    if (!formName.trim()) return;
    const s: Strategy = {
      id: editing?.id || Date.now().toString(),
      name: formName.trim(),
      description: formDesc.trim(),
      playType: formPlayType,
      hotCount: formHot,
      coldCount: formCold,
      balanceCount: formBalance,
      zoneBalance: formZoneBalance,
      sumRange: [formSumMin, formSumMax],
      oddEvenRange: [formOddMin, formOddMax],
      maxConsecutive: formMaxConsec,
      createdAt: editing?.createdAt || new Date().toISOString(),
    };
    const list = editing ? strategies.map(x => x.id === editing.id ? s : x) : [...strategies, s];
    saveStrategies(list);
    setShowCreate(false); setEditing(null); resetForm();
  }

  function handleEdit(s: Strategy) {
    setEditing(s); setShowCreate(true);
    setFormName(s.name); setFormDesc(s.description); setFormPlayType(s.playType);
    setFormHot(s.hotCount); setFormCold(s.coldCount); setFormBalance(s.balanceCount);
    setFormZoneBalance(s.zoneBalance); setFormSumMin(s.sumRange[0]); setFormSumMax(s.sumRange[1]);
    setFormOddMin(s.oddEvenRange[0]); setFormOddMax(s.oddEvenRange[1]); setFormMaxConsec(s.maxConsecutive);
  }

  function handleDelete(id: string) {
    saveStrategies(strategies.filter(x => x.id !== id));
    setCompareIds(compareIds.filter(x => x !== id));
  }

  function runStrategy(s: Strategy) {
    if (!stats.length || !draws.length) return;
    setGenerating(true);
    setTimeout(() => {
      const pc = PT.indexOf(s.playType) + 5;
      const cfg = {
        hotCount: s.hotCount, coldCount: s.coldCount, balanceCount: s.balanceCount,
        zoneBalance: s.zoneBalance, sumRange: s.sumRange, oddEvenRange: s.oddEvenRange, maxConsecutive: s.maxConsecutive,
      };
      const c = generateBatch(pc, 3000);
      const f = applyFilters(c, cfg);
      const results = f.slice(0, 80).map(x => scoreCombination(x, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, 10);
      const updated = strategies.map(x => x.id === s.id ? { ...x, lastResult: results } : x);
      saveStrategies(updated);
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
        <h2 className="text-xl font-bold">策略实验室</h2>
        <button onClick={() => { resetForm(); setEditing(null); setShowCreate(true); }}
          className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/80 transition-all shadow">
          + 新建策略
        </button>
      </div>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        ⚠ 策略实验室仅供数据分析研究，不构成投注建议。回测结果基于历史数据模拟。
      </div>

      {showCreate && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">{editing ? '编辑策略' : '新建策略'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[var(--color-muted)] mb-1 block">策略名称 *</label>
              <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="如：均衡追热策略"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm text-[var(--color-muted)] mb-1 block">说明</label>
              <input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="策略说明（可选）"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-2 block">玩法</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PT.map(p => (
                <button key={p} onClick={() => setFormPlayType(p as PlayType)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${formPlayType === p ? 'bg-[var(--color-primary)] text-white shadow' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-[var(--color-muted)] mb-1 block">热号数量</label>
              <input type="number" min={0} max={10} value={formHot} onChange={e => setFormHot(+e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="text-sm text-[var(--color-muted)] mb-1 block">冷号数量</label>
              <input type="number" min={0} max={10} value={formCold} onChange={e => setFormCold(+e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
            <div>
              <label className="text-sm text-[var(--color-muted)] mb-1 block">平衡号数量</label>
              <input type="number" min={0} max={10} value={formBalance} onChange={e => setFormBalance(+e.target.value)}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-[var(--color-muted)] mb-1 block">和值范围</label>
              <div className="flex items-center gap-2">
                <input type="number" value={formSumMin} onChange={e => setFormSumMin(+e.target.value)} className="w-20 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
                <span className="text-[var(--color-muted)]">~</span>
                <input type="number" value={formSumMax} onChange={e => setFormSumMax(+e.target.value)} className="w-20 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
            </div>
            <div>
              <label className="text-sm text-[var(--color-muted)] mb-1 block">奇数个数范围</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={20} value={formOddMin} onChange={e => setFormOddMin(+e.target.value)} className="w-20 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
                <span className="text-[var(--color-muted)]">~</span>
                <input type="number" min={0} max={20} value={formOddMax} onChange={e => setFormOddMax(+e.target.value)} className="w-20 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={formZoneBalance} onChange={e => setFormZoneBalance(e.target.checked)} className="rounded" />
              四区均衡过滤
            </label>
            <div className="flex items-center gap-2">
              <label className="text-sm text-[var(--color-muted)]">最大连号</label>
              <input type="number" min={1} max={10} value={formMaxConsec} onChange={e => setFormMaxConsec(+e.target.value)}
                className="w-16 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-semibold hover:bg-[var(--color-primary)]/80 transition-all shadow">
              {editing ? '保存修改' : '创建策略'}
            </button>
            <button onClick={() => { setShowCreate(false); setEditing(null); resetForm(); }} className="px-6 py-2.5 rounded-xl bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)] transition-all">
              取消
            </button>
          </div>
        </div>
      )}

      {strategies.length === 0 && !showCreate ? (
        <div className="text-center py-16 text-[var(--color-muted)]">
          <div className="text-4xl mb-4">🧪</div>
          <div className="text-lg mb-2">还没有策略</div>
          <div className="text-sm">点击「新建策略」创建你的第一个自定义策略</div>
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map(s => (
            <div key={s.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={compareIds.includes(s.id)} onChange={() => toggleCompare(s.id)} className="rounded" title="选中用于对比" />
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    {s.description && <p className="text-xs text-[var(--color-muted)]">{s.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  <span className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded">{s.playType}</span>
                  <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded">热号 {s.hotCount}</span>
                <span className="bg-sky-500/10 text-sky-400 px-2 py-1 rounded">冷号 {s.coldCount}</span>
                <span className="bg-amber-500/10 text-amber-400 px-2 py-1 rounded">平衡 {s.balanceCount}</span>
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded">和值 {s.sumRange[0]}-{s.sumRange[1]}</span>
                <span className="bg-rose-500/10 text-rose-400 px-2 py-1 rounded">奇偶 {s.oddEvenRange[0]}-{s.oddEvenRange[1]}</span>
                <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded">最大连号 {s.maxConsecutive}</span>
                {s.zoneBalance && <span className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded">四区均衡</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => runStrategy(s)} disabled={generating}
                  className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all">
                  {generating ? '生成中...' : '运行策略'}
                </button>
                <button onClick={() => handleEdit(s)} className="px-4 py-2 rounded-lg bg-[var(--color-bg)] text-[var(--color-muted)] text-sm hover:bg-[var(--color-border)] transition-all">
                  编辑
                </button>
                <button onClick={() => handleDelete(s.id)} className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-all">
                  删除
                </button>
              </div>
              {s.lastResult && s.lastResult.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-[var(--color-muted)] font-semibold">最近生成结果（TOP 10）</div>
                  {s.lastResult.map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-[var(--color-bg)] rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-500 text-black' : i < 3 ? 'bg-[var(--color-muted)] text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]'}`}>{i + 1}</span>
                        <div className="flex gap-0.5">{r.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${r.riskLevel === '低' ? 'text-emerald-400' : r.riskLevel === '中' ? 'text-amber-400' : 'text-red-400'}`}>{r.riskLevel}风险</span>
                        <span className="font-bold font-mono text-sm">{r.totalScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {compared.length >= 2 && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
          <h3 className="font-semibold">策略对比（{compared.length}个）</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-muted)] text-xs">
                  <th className="text-left py-2 px-3">指标</th>
                  {compared.map(s => <th key={s.id} className="text-center py-2 px-3">{s.name}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 px-3 text-[var(--color-muted)]">玩法</td>
                  {compared.map(s => <td key={s.id} className="text-center py-2 px-3 font-mono">{s.playType}</td>)}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 px-3 text-[var(--color-muted)]">热号/冷号/平衡</td>
                  {compared.map(s => <td key={s.id} className="text-center py-2 px-3 font-mono">{s.hotCount}/{s.coldCount}/{s.balanceCount}</td>)}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 px-3 text-[var(--color-muted)]">和值范围</td>
                  {compared.map(s => <td key={s.id} className="text-center py-2 px-3 font-mono">{s.sumRange[0]}-{s.sumRange[1]}</td>)}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 px-3 text-[var(--color-muted)]">奇偶范围</td>
                  {compared.map(s => <td key={s.id} className="text-center py-2 px-3 font-mono">{s.oddEvenRange[0]}-{s.oddEvenRange[1]}</td>)}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 px-3 text-[var(--color-muted)]">最大连号</td>
                  {compared.map(s => <td key={s.id} className="text-center py-2 px-3 font-mono">{s.maxConsecutive}</td>)}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 px-3 text-[var(--color-muted)]">TOP 1 平均分</td>
                  {compared.map(s => {
                    const avg = s.lastResult && s.lastResult.length > 0 ? (s.lastResult.reduce((a, b) => a + b.totalScore, 0) / s.lastResult.length).toFixed(1) : '-';
                    return <td key={s.id} className="text-center py-2 px-3 font-mono font-bold">{avg}</td>;
                  })}
                </tr>
                <tr className="border-t border-[var(--color-border)]">
                  <td className="py-2 px-3 text-[var(--color-muted)]">低风险占比</td>
                  {compared.map(s => {
                    if (!s.lastResult || s.lastResult.length === 0) return <td key={s.id} className="text-center py-2 px-3">-</td>;
                    const low = s.lastResult.filter(r => r.riskLevel === '低').length;
                    return <td key={s.id} className="text-center py-2 px-3 font-mono">{((low / s.lastResult.length) * 100).toFixed(0)}%</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
