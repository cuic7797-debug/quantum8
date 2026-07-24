import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

type Tab = 'bigsmall' | 'oddeven' | 'sum' | 'span' | 'remainder' | 'zone';

export default function ProfessionalTrends() {
  const { draws } = useDraws(50);
  const [tab, setTab] = useState<Tab>('bigsmall');
  const [showCount, setShowCount] = useState(20);
  if (draws.length < 10) return null;

  const recent = draws.slice(0, showCount);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'bigsmall', label: '大小走势', icon: '📊' },
    { key: 'oddeven', label: '奇偶走势', icon: '⚖️' },
    { key: 'sum', label: '和值走势', icon: '➕' },
    { key: 'span', label: '跨度走势', icon: '↕️' },
    { key: 'remainder', label: '余数走势', icon: '🔢' },
    { key: 'zone', label: '四区分布', icon: '🎯' },
  ];

  // Stats calculations
  const sumAvg = Math.round(recent.reduce((a, d) => a + d.sum_value, 0) / recent.length);
  const oddAvg = (recent.reduce((a, d) => a + d.odd_count, 0) / recent.length).toFixed(1);
  const bigAvg = (recent.reduce((a, d) => a + d.big_count, 0) / recent.length).toFixed(1);
  const spanAvg = (recent.reduce((a, d) => a + d.span, 0) / recent.length).toFixed(0);

  // Number frequency ranking
  const freq = new Map<number, number>();
  recent.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
  const topFreq = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
  const maxFreq = topFreq[0]?.[1] || 1;

  // Remainder analysis (mod 5)
  const remainderTrend = recent.map(d => {
    const rems = [0, 0, 0, 0, 0];
    d.numbers.forEach(n => rems[n % 5]++);
    return { draw: d.draw_number.slice(-3), rems };
  });

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">📈 专业走势图表</h3>
        <select value={showCount} onChange={e => setShowCount(+e.target.value)}
          className="text-xs bg-[var(--color-bg)] border border-[var(--color-border)] rounded px-2 py-1">
          <option value={10}>近10期</option>
          <option value={20}>近20期</option>
          <option value={30}>近30期</option>
        </select>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ' + (
              tab === t.key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
            )}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Big/Small Trend */}
      {tab === 'bigsmall' && (
        <div className="space-y-3">
          <div className="glass-inset p-3 text-xs text-[var(--color-muted)]">
            近{showCount}期大号(&gt;40)均值: <span className="text-amber-400 font-bold">{bigAvg}</span>/20
            {parseFloat(bigAvg) > 11 ? ' · 大号偏重' : parseFloat(bigAvg) < 9 ? ' · 小号偏重' : ' · 均衡'}
          </div>
          {recent.map(d => (
            <div key={d.draw_number} className="flex items-center gap-2">
              <span className="text-sm font-mono text-[var(--color-muted)] w-10">{d.draw_number.slice(-3)}</span>
              <div className="flex-1 flex h-5 rounded overflow-hidden">
                <div className="bg-blue-500 flex items-center justify-center text-xs text-white font-bold" style={{ width: (d.big_count / 20 * 100) + '%' }}>
                  {d.big_count > 5 ? d.big_count : ''}
                </div>
                <div className="bg-rose-500 flex items-center justify-center text-xs text-white font-bold" style={{ width: (d.small_count / 20 * 100) + '%' }}>
                  {d.small_count > 5 ? d.small_count : ''}
                </div>
              </div>
              <span className="text-sm font-mono w-12 text-right text-[var(--color-muted)]">{d.big_count}:{d.small_count}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs text-[var(--color-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> 大号(&gt;40)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" /> 小号(≤40)</span>
          </div>
        </div>
      )}

      {/* Odd/Even Trend */}
      {tab === 'oddeven' && (
        <div className="space-y-3">
          <div className="glass-inset p-3 text-xs text-[var(--color-muted)]">
            近{showCount}期奇数均值: <span className="text-purple-400 font-bold">{oddAvg}</span>/20
          </div>
          {recent.map(d => (
            <div key={d.draw_number} className="flex items-center gap-2">
              <span className="text-sm font-mono text-[var(--color-muted)] w-10">{d.draw_number.slice(-3)}</span>
              <div className="flex-1 flex h-5 rounded overflow-hidden">
                <div className="bg-purple-500 flex items-center justify-center text-xs text-white font-bold" style={{ width: (d.odd_count / 20 * 100) + '%' }}>
                  {d.odd_count > 5 ? d.odd_count : ''}
                </div>
                <div className="bg-cyan-500 flex items-center justify-center text-xs text-white font-bold" style={{ width: (d.even_count / 20 * 100) + '%' }}>
                  {d.even_count > 5 ? d.even_count : ''}
                </div>
              </div>
              <span className="text-sm font-mono w-12 text-right text-[var(--color-muted)]">{d.odd_count}:{d.even_count}</span>
            </div>
          ))}
          <div className="flex justify-between text-xs text-[var(--color-muted)]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" /> 奇数</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500" /> 偶数</span>
          </div>
        </div>
      )}

      {/* Sum Trend */}
      {tab === 'sum' && (
        <div className="space-y-3">
          <div className="glass-inset p-3 text-xs text-[var(--color-muted)]">
            近{showCount}期和值均值: <span className="text-amber-400 font-bold">{sumAvg}</span>
          </div>
          <div className="flex items-end gap-0.5 h-32">
            {recent.slice().reverse().map((d, i) => {
              const min = Math.min(...recent.map(x => x.sum_value));
              const max = Math.max(...recent.map(x => x.sum_value));
              const range = max - min || 1;
              const h = ((d.sum_value - min) / range) * 100;
              const isHigh = d.sum_value > sumAvg * 1.15;
              const isLow = d.sum_value < sumAvg * 0.85;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <span className="text-[7px] font-mono text-[var(--color-muted)]">{d.sum_value}</span>
                  <div className={'w-full rounded-t ' + (isHigh ? 'bg-red-500' : isLow ? 'bg-blue-500' : 'bg-amber-500')} style={{ height: Math.max(4, h) + '%' }} />
                  <span className="text-[7px] text-[var(--color-muted)]">{d.draw_number.slice(-2)}</span>
                </div>
              );
            })}
          </div>
          <div className="glass-inset p-2 text-xs text-[var(--color-muted)]">
            红色=偏高 蓝色=偏低 黄色=正常
          </div>
        </div>
      )}

      {/* Span Trend */}
      {tab === 'span' && (
        <div className="space-y-3">
          <div className="glass-inset p-3 text-xs text-[var(--color-muted)]">
            近{showCount}期跨度均值: <span className="text-emerald-400 font-bold">{spanAvg}</span>
          </div>
          {recent.map(d => (
            <div key={d.draw_number} className="flex items-center gap-2">
              <span className="text-sm font-mono text-[var(--color-muted)] w-10">{d.draw_number.slice(-3)}</span>
              <div className="flex-1 h-3 bg-[var(--color-border)] rounded overflow-hidden">
                <div className="h-full bg-emerald-500 rounded" style={{ width: (d.span / 80 * 100) + '%' }} />
              </div>
              <span className="text-sm font-mono w-8 text-right text-[var(--color-muted)]">{d.span}</span>
            </div>
          ))}
        </div>
      )}

      {/* Remainder Trend */}
      {tab === 'remainder' && (
        <div className="space-y-3">
          <div className="glass-inset p-3 text-xs text-[var(--color-muted)]">
            号码除5余数分布趋势
          </div>
          {remainderTrend.map(r => (
            <div key={r.draw} className="flex items-center gap-1">
              <span className="text-sm font-mono text-[var(--color-muted)] w-8">{r.draw}</span>
              {r.rems.map((count, ri) => (
                <div key={ri} className="flex-1 text-center">
                  <div className="text-xs text-[var(--color-muted)]">余{ri}</div>
                  <div className="h-3 rounded mt-0.5" style={{
                    backgroundColor: `hsl(${ri * 60}, 60%, 45%)`,
                    opacity: 0.3 + (count / 20) * 0.7,
                  }} />
                  <div className="text-[8px] font-mono">{count}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Zone Distribution */}
      {tab === 'zone' && (
        <div className="space-y-3">
          <div className="glass-inset p-3 text-xs text-[var(--color-muted)]">
            四区分布（1-20 / 21-40 / 41-60 / 61-80）
          </div>
          {recent.map(d => (
            <div key={d.draw_number} className="flex items-center gap-1">
              <span className="text-sm font-mono text-[var(--color-muted)] w-10">{d.draw_number.slice(-3)}</span>
              <div className="flex-1 flex h-5 rounded overflow-hidden">
                <div className="bg-blue-500" style={{ width: (d.zone1_count / 20 * 100) + '%' }} title={'一区:' + d.zone1_count} />
                <div className="bg-emerald-500" style={{ width: (d.zone2_count / 20 * 100) + '%' }} title={'二区:' + d.zone2_count} />
                <div className="bg-amber-500" style={{ width: (d.zone3_count / 20 * 100) + '%' }} title={'三区:' + d.zone3_count} />
                <div className="bg-rose-500" style={{ width: (d.zone4_count / 20 * 100) + '%' }} title={'四区:' + d.zone4_count} />
              </div>
              <span className="text-sm font-mono w-20 text-right text-[var(--color-muted)]">{d.zone1_count}:{d.zone2_count}:{d.zone3_count}:{d.zone4_count}</span>
            </div>
          ))}
          <div className="flex gap-2 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> 一区</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> 二区</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> 三区</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" /> 四区</span>
          </div>
        </div>
      )}

      {/* Number Frequency Ranking */}
      <div className="glass-inset p-4">
        <div className="text-sm font-semibold text-[var(--color-muted)] mb-3">号码出现次数排行（近{showCount}期）</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {topFreq.map(([num, count], i) => (
            <div key={num} className="flex items-center gap-2 glass-card px-2 py-1.5">
              <span className="text-xs text-[var(--color-muted)] w-3">{i + 1}</span>
              <NumberBall number={num} size="sm" />
              <div className="flex-1">
                <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: (count / maxFreq * 100) + '%' }} />
                </div>
              </div>
              <span className="text-sm font-mono font-bold">{count}次</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
