import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';

export default function NumberHeatmap() {
  const { draws } = useDraws(50);
  const { stats } = useNumberStats();
  const [metric, setMetric] = useState<'appear' | 'hot' | 'miss' | 'recent'>('appear');
  if (!draws.length || !stats.length) return null;

  const recent30 = draws.slice(0, 30);

  // Calculate per-number metrics
  const metrics = Array.from({ length: 80 }, (_, i) => {
    const num = i + 1;
    const stat = stats.find(s => s.number === num);
    const appearCount = recent30.filter(d => d.numbers.includes(num)).length;
    return {
      num,
      appearCount,
      hotScore: stat?.hotScore || 0,
      currentMiss: stat?.currentMiss || 0,
      recentRate: stat?.recent10Rate || 0,
    };
  });

  const getMax = () => {
    switch (metric) {
      case 'appear': return Math.max(...metrics.map(m => m.appearCount), 1);
      case 'hot': return Math.max(...metrics.map(m => m.hotScore), 1);
      case 'miss': return Math.max(...metrics.map(m => m.currentMiss), 1);
      case 'recent': return Math.max(...metrics.map(m => m.recentRate), 1);
    }
  };
  const maxVal = getMax();

  const getIntensity = (m: typeof metrics[0]) => {
    let val: number;
    switch (metric) {
      case 'appear': val = m.appearCount; break;
      case 'hot': val = m.hotScore; break;
      case 'miss': val = m.currentMiss; break;
      case 'recent': val = m.recentRate; break;
    }
    return Math.min(1, val / maxVal);
  };

  const getColor = (intensity: number) => {
    if (metric === 'miss') {
      // Blue gradient for miss (higher = more blue = more overdue)
      return `hsl(220, 70%, ${Math.round(25 + (1 - intensity) * 50)}%)`;
    }
    // Red gradient for others (higher = more red = more active)
    return `hsl(${Math.round(10 + (1 - intensity) * 40)}, ${Math.round(60 + intensity * 30)}%, ${Math.round(25 + intensity * 35)}%)`;
  };

  const metricLabels = {
    appear: '近30期出现次数',
    hot: '热度分数',
    miss: '当前遗漏期数',
    recent: '近10期出现率',
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold">🌡️ 号码热力图</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">80个号码的{metricLabels[metric]}可视化</p>
      </div>

      <div className="flex gap-1">
        {([
          { key: 'appear' as const, label: '出现次数' },
          { key: 'hot' as const, label: '热度' },
          { key: 'miss' as const, label: '遗漏' },
          { key: 'recent' as const, label: '近期频率' },
        ]).map(m => (
          <button key={m.key} onClick={() => setMetric(m.key)}
            className={'px-3 py-1 rounded text-xs transition-all ' + (metric === m.key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
        {metrics.map(m => {
          const intensity = getIntensity(m);
          return (
            <div key={m.num} className="aspect-square rounded-lg flex flex-col items-center justify-center relative group cursor-pointer"
              style={{ backgroundColor: getColor(intensity) }}>
              <span className="text-sm font-bold text-white">{m.num}</span>
              <span className="text-[7px] text-white/70">{metric === 'appear' ? m.appearCount : metric === 'hot' ? m.hotScore.toFixed(0) : metric === 'miss' ? m.currentMiss : m.recentRate.toFixed(0)}</span>
              <div className="hidden group-hover:block absolute z-10 glass-card p-2 shadow-xl text-xs left-1/2 -translate-x-1/2 bottom-full mb-1 w-24">
                <div className="font-bold">号码 {m.num}</div>
                <div>出现 {m.appearCount}次</div>
                <div>热度 {m.hotScore.toFixed(0)}</div>
                <div>遗漏 {m.currentMiss}期</div>
                <div>频率 {m.recentRate.toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>{metric === 'miss' ? '低遗漏' : '低频'}</span>
        <div className="flex-1 mx-2 h-2 rounded-full" style={{
          background: metric === 'miss'
            ? 'linear-gradient(to right, hsl(220,70%,75%), hsl(220,70%,25%))'
            : 'linear-gradient(to right, hsl(50,60%,55%), hsl(10,90%,60%))'
        }} />
        <span>{metric === 'miss' ? '高遗漏' : '高频'}</span>
      </div>
    </div>
  );
}
