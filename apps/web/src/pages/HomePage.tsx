import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import LatestDrawCard from '@/components/draws/LatestDrawCard';
import DrawHistory from '@/components/draws/DrawHistory';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';

export default function HomePage() {
  const { draws, loading: drawsLoading } = useDraws(20);
  const { stats, loading: statsLoading } = useNumberStats();

  if (drawsLoading || statsLoading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">加载中...</div>;
  }
  if (draws.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">📊</div>
        <div className="text-[var(--color-muted)]">暂无开奖数据</div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="text-xs text-[var(--color-muted)] bg-[var(--color-surface)] rounded-lg px-4 py-2 border border-[var(--color-border)]">
        ⚠️ 本工具仅提供历史数据统计分析，不构成任何投注建议。彩票有风险，投注需理性。
      </div>
      <LatestDrawCard draw={draws[0]} />
      {stats.length > 0 && <NumberGrid stats={stats} />}
      {stats.length > 0 && <HotColdRanking stats={stats} />}
      <DrawHistory draws={draws.slice(1)} />
    </div>
  );
}
