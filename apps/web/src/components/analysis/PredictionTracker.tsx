import { useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

interface Pick {
  numbers: number[];
  strategy: string;
  playType: string;
  createdAt: string;
}

interface Props {
  picks: Pick[];
  draws: Draw[];
}

interface MatchResult {
  pick: Pick;
  drawNumber: string;
  drawDate: string;
  matched: number[];
  matchCount: number;
  totalNums: number;
  hitRate: number;
  prize: string;
}

export default function PredictionTracker({ picks, draws }: Props) {
  const results = useMemo(() => {
    if (!picks.length || !draws.length) return [];

    const drawMap = new Map(draws.map(d => [d.draw_date, d]));
    const allDrawsByDate = draws.sort((a, b) => b.draw_date.localeCompare(a.draw_date));

    const matchResults: MatchResult[] = [];

    picks.forEach(pick => {
      const pickDate = pick.createdAt.slice(0, 10);
      
      // Find the draw that happened after this pick
      const matchingDraw = allDrawsByDate.find(d => d.draw_date >= pickDate);
      if (!matchingDraw) return;

      const matched = pick.numbers.filter(n => matchingDraw.numbers.includes(n));
      const matchCount = matched.length;
      const hitRate = pick.numbers.length > 0 ? (matchCount / pick.numbers.length) * 100 : 0;

      // Simple prize calculation based on match count
      let prize = '未中奖';
      if (matchCount >= 8) prize = '🏆 大奖';
      else if (matchCount >= 6) prize = '🎉 二等奖';
      else if (matchCount >= 4) prize = '✨ 三等奖';
      else if (matchCount >= 2) prize = '👍 鼓励奖';

      matchResults.push({
        pick,
        drawNumber: matchingDraw.draw_number,
        drawDate: matchingDraw.draw_date,
        matched,
        matchCount,
        totalNums: pick.numbers.length,
        hitRate: Math.round(hitRate),
        prize,
      });
    });

    return matchResults.sort((a, b) => b.drawDate.localeCompare(a.drawDate));
  }, [picks, draws]);

  const stats = useMemo(() => {
    if (!results.length) return null;
    const totalPicks = results.length;
    const totalMatched = results.reduce((a, r) => a + r.matchCount, 0);
    const avgHitRate = Math.round(results.reduce((a, r) => a + r.hitRate, 0) / totalPicks);
    const bestMatch = Math.max(...results.map(r => r.matchCount));
    const winCount = results.filter(r => r.matchCount >= 2).length;
    const winRate = Math.round((winCount / totalPicks) * 100);

    return { totalPicks, totalMatched, avgHitRate, bestMatch, winCount, winRate };
  }, [results]);

  if (!picks.length) return null;

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      {stats && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">📊 预测追踪统计</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: '总预测', value: stats.totalPicks + '次', icon: '🎯', color: 'text-blue-400' },
              { label: '平均命中', value: stats.avgHitRate + '%', icon: '📈', color: 'text-emerald-400' },
              { label: '最佳命中', value: stats.bestMatch + '个', icon: '🏆', color: 'text-amber-400' },
              { label: '命中率', value: stats.winRate + '%', icon: '✅', color: 'text-purple-400' },
              { label: '中奖次数', value: stats.winCount + '次', icon: '🎉', color: 'text-pink-400' },
              { label: '累计匹配', value: stats.totalMatched + '个', icon: '🔢', color: 'text-cyan-400' },
            ].map(s => (
              <div key={s.label} className="glass-inset p-3 text-center">
                <div className="text-lg">{s.icon}</div>
                <div className={`font-bold font-mono text-sm mt-1 ${s.color}`}>{s.value}</div>
                <div className="text-xs text-[var(--color-muted)]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Results */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">📋 预测 vs 开奖对比</h3>
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {results.map((r, i) => (
            <div key={i} className="glass-inset p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-[var(--color-muted)]">{r.drawNumber}</span>
                  <span className="text-xs text-[var(--color-muted)]">{r.drawDate}</span>
                  <span className="text-xs bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full">{r.pick.playType}</span>
                </div>
                <span className="text-sm font-bold">{r.prize}</span>
              </div>
              
              {/* Pick numbers */}
              <div className="mb-2">
                <div className="text-xs text-[var(--color-muted)] mb-1">你的预测:</div>
                <div className="flex flex-wrap gap-1">
                  {r.pick.numbers.map(n => (
                    <NumberBall key={n} number={n} size="sm" highlight={r.matched.includes(n)} />
                  ))}
                </div>
              </div>
              
              {/* Draw numbers */}
              <div className="mb-2">
                <div className="text-xs text-[var(--color-muted)] mb-1">实际开奖:</div>
                <div className="flex flex-wrap gap-1">
                  {draws.find(d => d.draw_number === r.drawNumber)?.numbers.map(n => (
                    <NumberBall key={n} number={n} size="sm" highlight={r.matched.includes(n)} />
                  ))}
                </div>
              </div>

              {/* Match summary */}
              <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)]">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-muted)]">命中:</span>
                  <span className="font-bold font-mono text-sm text-[var(--color-primary)]">{r.matchCount}/{r.totalNums}</span>
                  <div className="w-20 h-1.5 glass-inset rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full"
                      style={{ width: `${r.hitRate}%` }} />
                  </div>
                  <span className="text-xs text-[var(--color-muted)]">{r.hitRate}%</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {r.matched.map(n => (
                    <span key={n} className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
