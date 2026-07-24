import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

export default function MissDashboard() {
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [view, setView] = useState<'current' | 'avg' | 'max' | 'ratio'>('current');
  const [filter, setFilter] = useState<'all' | 'hot' | 'cold' | 'overdue'>('all');

  if (!stats.length || !draws.length) return null;

  let filtered = [...stats];
  if (filter === 'hot') filtered = stats.filter(s => s.hotScore >= 60);
  else if (filter === 'cold') filtered = stats.filter(s => s.currentMiss >= 5);
  else if (filter === 'overdue') filtered = stats.filter(s => s.missRatio >= 80);

  const sortKey = view === 'current' ? 'currentMiss' : view === 'avg' ? 'avgMiss' : view === 'max' ? 'maxMiss' : 'missRatio';
  filtered.sort((a, b) => (b as any)[sortKey] - (a as any)[sortKey]);

  const maxVal = Math.max(...filtered.map(s => (s as any)[sortKey] || 0), 1);

  // Summary stats
  const overdueCount = stats.filter(s => s.missRatio >= 80).length;
  const hotCount = stats.filter(s => s.hotScore >= 60).length;
  const avgMiss = (stats.reduce((a, s) => a + s.avgMiss, 0) / stats.length).toFixed(1);
  const maxMissNum = [...stats].sort((a, b) => b.currentMiss - a.currentMiss)[0];

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold">📉 遗漏统计仪表盘</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">分析号码遗漏规律，发现回补机会</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="glass-inset p-2.5 text-center">
          <div className="text-xs text-[var(--color-muted)]">最大遗漏号</div>
          <div className="font-bold font-mono text-sm">{maxMissNum?.number || '-'}</div>
          <div className="text-xs text-red-400">{maxMissNum?.currentMiss || 0}期</div>
        </div>
        <div className="glass-inset p-2.5 text-center">
          <div className="text-xs text-[var(--color-muted)]">平均遗漏</div>
          <div className="font-bold font-mono text-sm">{avgMiss}</div>
          <div className="text-xs text-[var(--color-muted)]">80个号码</div>
        </div>
        <div className="glass-inset p-2.5 text-center">
          <div className="text-xs text-[var(--color-muted)]">待回补号</div>
          <div className="font-bold font-mono text-sm text-amber-400">{overdueCount}</div>
          <div className="text-xs text-[var(--color-muted)]">missRatio≥80</div>
        </div>
        <div className="glass-inset p-2.5 text-center">
          <div className="text-xs text-[var(--color-muted)]">活跃号</div>
          <div className="font-bold font-mono text-sm text-emerald-400">{hotCount}</div>
          <div className="text-xs text-[var(--color-muted)]">hotScore≥60</div>
        </div>
      </div>

      {/* View selector */}
      <div className="flex gap-1">
        {[
          { key: 'current', label: '当前遗漏' },
          { key: 'avg', label: '平均遗漏' },
          { key: 'max', label: '最大遗漏' },
          { key: 'ratio', label: '遗漏比' },
        ].map(v => (
          <button key={v.key} onClick={() => setView(v.key as any)}
            className={'px-3 py-1 rounded text-xs transition-all ' + (view === v.key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {[
          { key: 'all', label: '全部' },
          { key: 'hot', label: '🔥 热号' },
          { key: 'cold', label: '❄️ 冷号' },
          { key: 'overdue', label: '⏰ 待回补' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className={'px-3 py-1 rounded text-xs transition-all ' + (filter === f.key ? 'bg-amber-500/20 text-amber-400' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Miss bars */}
      <div className="space-y-1">
        {filtered.slice(0, 30).map(s => {
          const val = (s as any)[sortKey];
          const pct = (val / maxVal) * 100;
          const isOverdue = s.missRatio >= 80;
          return (
            <div key={s.number} className="flex items-center gap-2">
              <NumberBall number={s.number} size="sm" />
              <div className="flex-1 h-3 bg-[var(--color-bg)] rounded-full overflow-hidden">
                <div className={'h-full rounded-full transition-all ' + (isOverdue ? 'bg-amber-500' : val > maxVal * 0.7 ? 'bg-red-500/60' : 'bg-[var(--color-primary)]/60')} style={{ width: Math.max(2, pct) + '%' }} />
              </div>
              <span className="text-sm font-mono w-10 text-right text-[var(--color-muted)]">{typeof val === 'number' ? val.toFixed(view === 'ratio' ? 0 : 1) : val}</span>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-[var(--color-muted)] text-center">
        共{filtered.length}个号码 · 遗漏比 = 当前遗漏 / 平均遗漏 × 100
      </div>
    </div>
  );
}
