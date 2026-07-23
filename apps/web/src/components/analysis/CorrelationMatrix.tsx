import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

interface Pair {
  a: number;
  b: number;
  count: number;
  rate: number;
}

export default function CorrelationMatrix() {
  const { draws } = useDraws(100);
  const [minCount, setMinCount] = useState(3);
  const [view, setView] = useState<'grid' | 'list'>('list');

  if (!draws.length) return null;

  const pairCount = new Map<string, number>();
  draws.forEach(d => {
    const nums = [...d.numbers].sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  });

  const pairs: Pair[] = [...pairCount.entries()]
    .map(([key, count]) => {
      const [a, b] = key.split('-').map(Number);
      return { a, b, count, rate: parseFloat(((count / draws.length) * 100).toFixed(1)) };
    })
    .filter(p => p.count >= minCount)
    .sort((a, b) => b.count - a.count);

  const topPairs = pairs.slice(0, 30);

  // Find which numbers co-occur most with any given number
  const numberAffinity = new Map<number, { partner: number; count: number }[]>();
  for (const p of pairs) {
    if (!numberAffinity.has(p.a)) numberAffinity.set(p.a, []);
    if (!numberAffinity.has(p.b)) numberAffinity.set(p.b, []);
    numberAffinity.get(p.a)!.push({ partner: p.b, count: p.count });
    numberAffinity.get(p.b)!.push({ partner: p.a, count: p.count });
  }

  // Anti-correlated pairs (numbers that rarely appear together)
  const antiPairs = pairs
    .filter(p => p.count <= 1)
    .sort((a, b) => a.count - b.count)
    .slice(0, 10);

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">🔗 号码共现矩阵</h3>
          <p className="text-xs text-[var(--color-muted)] mt-1">分析近{draws.length}期中号码同时出现的关联性</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('list')}
            className={`px-3 py-1 rounded text-xs ${view === 'list' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]'}`}>
            列表
          </button>
          <button onClick={() => setView('grid')}
            className={`px-3 py-1 rounded text-xs ${view === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]'}`}>
            矩阵
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--color-muted)]">最低共现次数:</span>
        {[1, 2, 3, 5].map(n => (
          <button key={n} onClick={() => setMinCount(n)}
            className={`px-2 py-1 rounded text-xs ${minCount === n ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'}`}>
            ≥{n}
          </button>
        ))}
      </div>

      {view === 'list' ? (
        <div className="space-y-2">
          {topPairs.length === 0 && (
            <div className="text-center py-4 text-[var(--color-muted)] text-sm">暂无符合条件的共现数据</div>
          )}
          {topPairs.map((p, i) => (
            <div key={`${p.a}-${p.b}`} className="flex items-center justify-between py-2 px-3 glass-inset hover:bg-[var(--color-border)] transition-colors">
              <div className="flex items-center gap-3">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i < 3 ? 'bg-amber-500 text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]'}`}>
                  {i + 1}
                </span>
                <div className="flex items-center gap-1">
                  <NumberBall number={p.a} size="sm" />
                  <span className="text-[var(--color-muted)] text-xs">+</span>
                  <NumberBall number={p.b} size="sm" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono font-bold text-sm">{p.count}次</div>
                  <div className="text-[10px] text-[var(--color-muted)]">{p.rate}%</div>
                </div>
                <div className="w-20 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--color-primary)] rounded-full" style={{ width: `${Math.min(100, (p.count / (topPairs[0]?.count || 1)) * 100)}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
            {Array.from({ length: 80 }, (_, i) => i + 1).map(num => {
              const affinities = (numberAffinity.get(num) || [])
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              const maxCount = affinities[0]?.count || 0;
              return (
                <div key={num} className="glass-inset p-1.5 text-center group relative">
                  <NumberBall number={num} size="sm" />
                  {affinities.length > 0 && (
                    <>
                      <div className="text-[8px] text-[var(--color-muted)] mt-0.5">{maxCount}次</div>
                      <div className="hidden group-hover:block absolute z-10 glass-card p-2 shadow-xl text-xs left-1/2 -translate-x-1/2 w-28">
                        <div className="font-semibold mb-1">号码 {num} 的关联号</div>
                        {affinities.map(a => (
                          <div key={a.partner} className="flex items-center gap-1 py-0.5">
                            <NumberBall number={a.partner} size="sm" />
                            <span className="text-[var(--color-muted)]">{a.count}次</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {antiPairs.length > 0 && (
        <div className="border-t border-[var(--color-border)] pt-4">
          <h4 className="text-sm font-semibold text-[var(--color-muted)] mb-2">⚠️ 互斥号码对（很少同时出现）</h4>
          <div className="flex flex-wrap gap-2">
            {antiPairs.map(p => (
              <div key={`${p.a}-${p.b}`} className="flex items-center gap-1 bg-red-500/10 rounded-lg px-2 py-1">
                <NumberBall number={p.a} size="sm" />
                <span className="text-red-400 text-xs">×</span>
                <NumberBall number={p.b} size="sm" />
                <span className="text-[10px] text-red-400 ml-1">{p.count}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-[var(--color-muted)] text-center">
        共现分析基于历史数据统计，不代表未来趋势
      </div>
    </div>
  );
}
