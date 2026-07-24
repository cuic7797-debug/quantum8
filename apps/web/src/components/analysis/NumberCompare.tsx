import { useState } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

export default function NumberCompare() {
  const { stats } = useNumberStats();
  const { draws } = useDraws(100);
  const [numA, setNumA] = useState(1);
  const [numB, setNumB] = useState(2);

  if (!stats.length || !draws.length) return null;

  const statA = stats.find(s => s.number === numA);
  const statB = stats.find(s => s.number === numB);
  if (!statA || !statB) return null;

  // Co-occurrence
  const coCount = draws.filter(d => d.numbers.includes(numA) && d.numbers.includes(numB)).length;
  const coRate = ((coCount / draws.length) * 100).toFixed(1);

  // Last 20 appearances
  const appearA = draws.slice(0, 20).filter(d => d.numbers.includes(numA)).map(d => d.draw_number.slice(-3));
  const appearB = draws.slice(0, 20).filter(d => d.numbers.includes(numB)).map(d => d.draw_number.slice(-3));

  const metrics = [
    { label: '热度分数', a: statA.hotScore, b: statB.hotScore, unit: '' },
    { label: '当前遗漏', a: statA.currentMiss, b: statB.currentMiss, unit: '期' },
    { label: '平均遗漏', a: statA.avgMiss, b: statB.avgMiss, unit: '期' },
    { label: '最大遗漏', a: statA.maxMiss, b: statB.maxMiss, unit: '期' },
    { label: '总出现次数', a: statA.totalAppearances, b: statB.totalAppearances, unit: '次' },
    { label: '近10期频率', a: statA.recent10Rate, b: statB.recent10Rate, unit: '%' },
    { label: '近20期频率', a: statA.recent20Rate, b: statB.recent20Rate, unit: '%' },
    { label: '遗漏比', a: statA.missRatio, b: statB.missRatio, unit: '' },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold">🔄 号码对比</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">对比两个号码的各项统计指标</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs text-[var(--color-muted)] block mb-1">号码A</label>
          <div className="flex gap-1 flex-wrap">
            {[numA, ...Array.from({length: 9}, (_, i) => ((numA - 1 + i + 1) % 80) + 1)].slice(0, 10).map(n => (
              <button key={n} onClick={() => setNumA(n)} className={'w-8 h-8 rounded-full text-sm font-bold transition-all ' + (numA === n ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="text-2xl text-[var(--color-muted)]">VS</div>
        <div className="flex-1">
          <label className="text-xs text-[var(--color-muted)] block mb-1">号码B</label>
          <div className="flex gap-1 flex-wrap">
            {[numB, ...Array.from({length: 9}, (_, i) => ((numB - 1 + i + 1) % 80) + 1)].slice(0, 10).map(n => (
              <button key={n} onClick={() => setNumB(n)} className={'w-8 h-8 rounded-full text-sm font-bold transition-all ' + (numB === n ? 'bg-rose-500 text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side by side balls */}
      <div className="flex items-center justify-center gap-6">
        <NumberBall number={numA} size="lg" />
        <div className="text-center">
          <div className="text-xs text-[var(--color-muted)]">共现</div>
          <div className="font-bold text-lg">{coCount}次</div>
          <div className="text-xs text-[var(--color-muted)]">{coRate}%</div>
        </div>
        <NumberBall number={numB} size="lg" />
      </div>

      {/* Metrics comparison */}
      <div className="space-y-2">
        {metrics.map(m => {
          const max = Math.max(m.a, m.b, 1);
          return (
            <div key={m.label} className="glass-inset p-2">
              <div className="text-xs text-[var(--color-muted)] mb-1">{m.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono w-12 text-right text-[var(--color-primary)]">{m.a}{m.unit}</span>
                <div className="flex-1 h-3 rounded overflow-hidden flex">
                  <div className="bg-[var(--color-primary)]" style={{ width: (m.a / max * 50) + '%' }} />
                  <div className="bg-rose-500" style={{ width: (m.b / max * 50) + '%' }} />
                </div>
                <span className="text-sm font-mono w-12 text-rose-400">{m.b}{m.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent appearances */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-inset p-3">
          <div className="text-xs text-[var(--color-muted)] mb-1">号码{numA} 近20期出现</div>
          <div className="flex flex-wrap gap-1">
            {appearA.length > 0 ? appearA.map(d => (
              <span key={d} className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-1.5 py-0.5 rounded">{d}</span>
            )) : <span className="text-xs text-[var(--color-muted)]">未出现</span>}
          </div>
        </div>
        <div className="glass-inset p-3">
          <div className="text-xs text-[var(--color-muted)] mb-1">号码{numB} 近20期出现</div>
          <div className="flex flex-wrap gap-1">
            {appearB.length > 0 ? appearB.map(d => (
              <span key={d} className="text-xs bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded">{d}</span>
            )) : <span className="text-xs text-[var(--color-muted)]">未出现</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
