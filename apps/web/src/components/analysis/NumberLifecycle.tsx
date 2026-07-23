import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

export default function NumberLifecycle() {
  const { draws } = useDraws(100);
  const [selected, setSelected] = useState<number | null>(null);
  if (draws.length < 5) return null;

  const recent50 = draws.slice(0, 50);

  function getLifecycle(num: number) {
    const appearMap: number[] = recent50.map((d, _i) => d.numbers.includes(num) ? 1 : 0);
    // Find current miss
    let currentMiss = 0;
    for (const v of appearMap) { if (v === 1) break; currentMiss++; }
    // Find hot/cold cycles
    const cycles: { type: '热' | '冷'; length: number }[] = [];
    let streak = 0; let lastVal = -1;
    for (const v of appearMap) {
      if (v === lastVal) { streak++; }
      else { if (lastVal >= 0 && streak > 0) cycles.push({ type: lastVal === 1 ? '热' : '冷', length: streak }); streak = 1; lastVal = v; }
    }
    if (streak > 0) cycles.push({ type: lastVal === 1 ? '热' : '冷', length: streak });
    const hotCycles = cycles.filter(c => c.type === '热');
    const coldCycles = cycles.filter(c => c.type === '冷');
    const avgHotLen = hotCycles.length ? (hotCycles.reduce((a, c) => a + c.length, 0) / hotCycles.length).toFixed(1) : '-';
    const avgColdLen = coldCycles.length ? (coldCycles.reduce((a, c) => a + c.length, 0) / coldCycles.length).toFixed(1) : '-';
    const totalAppear = appearMap.reduce((a, b) => a + b, 0);
    const recent10Appear = appearMap.slice(0, 10).reduce((a, b) => a + b, 0);

    // Lifecycle stage
    let stage = '平稳';
    let stageColor = 'text-gray-400';
    if (currentMiss >= 8) { stage = '深度遗漏'; stageColor = 'text-blue-400'; }
    else if (currentMiss >= 5) { stage = '冷号期'; stageColor = 'text-blue-300'; }
    else if (recent10Appear >= 5) { stage = '热号期'; stageColor = 'text-red-400'; }
    else if (recent10Appear >= 3) { stage = '温号期'; stageColor = 'text-amber-400'; }
    else if (currentMiss >= 3) { stage = '趋冷'; stageColor = 'text-cyan-400'; }

    return { currentMiss, avgHotLen, avgColdLen, totalAppear, recent10Appear, stage, stageColor, appearMap: appearMap.slice(0, 30) };
  }

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold">🔄 号码生命周期分析</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">分析每个号码的冷热周期和当前阶段</p>
      </div>

      <div className="grid grid-cols-10 sm:grid-cols-10 gap-1.5">
        {Array.from({ length: 80 }, (_, i) => i + 1).map(num => {
          const lc = getLifecycle(num);
          return (
            <button key={num} onClick={() => setSelected(selected === num ? null : num)}
              className={'p-1 rounded transition-all ' + (selected === num ? 'ring-2 ring-[var(--color-primary)]' : '')}>
              <NumberBall number={num} size="sm" />
            </button>
          );
        })}
      </div>

      {selected && (() => {
        const lc = getLifecycle(selected);
        return (
          <div className="glass-inset p-4 space-y-3">
            <div className="flex items-center gap-3">
              <NumberBall number={selected} size="md" />
              <div>
                <div className="font-bold">号码 {selected}</div>
                <div className={'text-xs font-semibold ' + lc.stageColor}>{lc.stage}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="glass-card p-2 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">当前遗漏</div>
                <div className="font-mono font-bold">{lc.currentMiss}期</div>
              </div>
              <div className="glass-card p-2 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">近10期出现</div>
                <div className="font-mono font-bold">{lc.recent10Appear}次</div>
              </div>
              <div className="glass-card p-2 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">平均热周期</div>
                <div className="font-mono font-bold">{lc.avgHotLen}期</div>
              </div>
              <div className="glass-card p-2 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">平均冷周期</div>
                <div className="font-mono font-bold">{lc.avgColdLen}期</div>
              </div>
            </div>

            <div>
              <div className="text-xs text-[var(--color-muted)] mb-1">近30期出现轨迹</div>
              <div className="flex gap-0.5">
                {lc.appearMap.map((v, i) => (
                  <div key={i} className={'flex-1 h-4 rounded-sm ' + (v ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]')} title={v ? '出现' : '未出现'} />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-[var(--color-muted)] mt-0.5">
                <span>30期前</span><span>最新</span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="text-[10px] text-[var(--color-muted)] text-center">点击任意号码查看详细生命周期</div>
    </div>
  );
}
