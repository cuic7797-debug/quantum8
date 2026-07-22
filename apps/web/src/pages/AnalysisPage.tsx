import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';
import NumberBall from '@/components/common/NumberBall';

export default function AnalysisPage() {
  const { draws, loading: drawsLoading } = useDraws(50);
  const { stats, loading: statsLoading } = useNumberStats();

  if (drawsLoading || statsLoading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">加载中...</div>;
  }
  if (draws.length === 0 || stats.length === 0) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">暂无数据</div>;
  }

  let has2 = 0, has3 = 0, noConsec = 0;
  draws.forEach((d) => {
    const nums = [...d.numbers].sort((a, b) => a - b);
    let maxStreak = 1, streak = 1;
    for (let i = 1; i < nums.length; i++) {
      if (nums[i] === nums[i - 1] + 1) { streak++; maxStreak = Math.max(maxStreak, streak); }
      else streak = 1;
    }
    if (maxStreak >= 3) has3++;
    else if (maxStreak >= 2) has2++;
    else noConsec++;
  });

  const oddEvenTrend = draws.slice(0, 15).map((d) => ({
    draw: d.draw_number.slice(-3), odd: d.odd_count, even: d.even_count,
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">走势分析</h2>
      <NumberGrid stats={stats} />
      <HotColdRanking stats={stats} />
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">连号统计（近{draws.length}期）</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-2xl font-bold">{has2}</div><div className="text-xs text-[var(--color-muted)]">含2连号</div><div className="text-xs text-[var(--color-muted)]">{((has2 / draws.length) * 100).toFixed(1)}%</div></div>
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-2xl font-bold">{has3}</div><div className="text-xs text-[var(--color-muted)]">含3连号+</div><div className="text-xs text-[var(--color-muted)]">{((has3 / draws.length) * 100).toFixed(1)}%</div></div>
          <div className="text-center bg-[var(--color-bg)] rounded-lg p-3"><div className="text-2xl font-bold">{noConsec}</div><div className="text-xs text-[var(--color-muted)]">无连号</div><div className="text-xs text-[var(--color-muted)]">{((noConsec / draws.length) * 100).toFixed(1)}%</div></div>
        </div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">奇偶分布趋势（近15期）</h3>
        <div className="space-y-1">
          {oddEvenTrend.map((t) => (
            <div key={t.draw} className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs text-[var(--color-muted)] w-8">{t.draw}</span>
              <div className="flex-1 flex items-center">
                <div className="h-4 bg-blue-500 rounded-l" style={{ width: `${(t.odd / 20) * 100}%` }} />
                <div className="h-4 bg-rose-500 rounded-r" style={{ width: `${(t.even / 20) * 100}%` }} />
              </div>
              <span className="text-xs font-mono w-10 text-right">{t.odd}:{t.even}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[var(--color-muted)]">
          <span>奇数</span><span>偶数</span>
        </div>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">遗漏排行 TOP 20</h3>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {[...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 20).map((s, i) => (
            <div key={s.number} className="flex items-center gap-2 text-sm">
              <span className="text-xs text-[var(--color-muted)] w-4">{i + 1}</span>
              <NumberBall number={s.number} size="sm" />
              <span className="font-mono text-xs">{s.currentMiss}期</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
