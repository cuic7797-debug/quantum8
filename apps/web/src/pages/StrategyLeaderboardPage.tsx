import { useState, useMemo } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { runBacktest } from '@quantum8/algorithm';
import { ensembleScoring, generateBatch } from '@quantum8/algorithm';

interface LeaderboardEntry {
  name: string;
  author: string;
  description: string;
  winRate: number;
  avgPrize: number;
  roi: number;
  maxPrize: number;
  risk: 'low' | 'mid' | 'high';
  likes: number;
  strategy: {
    hotCount: number;
    coldCount: number;
    balanceCount: number;
    zoneBalance: boolean;
    maxConsecutive: number;
    playType: string;
    noteType: string;
  };
}

const COMMUNITY_STRATEGIES: LeaderboardEntry[] = [
  { name: '\u5747\u8861\u5927\u5E08', author: '\u7CFB\u7EDF\u63A8\u8350', description: '\u70ED\u51B7\u5747\u88613:3:4\uFF0C\u56DB\u533A\u5E73\u8861\uFF0C\u63A7\u5236\u8FDE\u53F7', winRate: 0, avgPrize: 0, roi: 0, maxPrize: 0, risk: 'low', likes: 256, strategy: { hotCount: 3, coldCount: 3, balanceCount: 4, zoneBalance: true, maxConsecutive: 2, playType: '\u9009\u516B', noteType: '\u590D\u5F0F' } },
  { name: '\u70ED\u53F7\u8FFD\u51FB', author: '\u7CFB\u7EDF\u63A8\u8350', description: '\u4E13\u6CE8\u70ED\u53F76:2:2\uFF0C\u9002\u5408\u8D8B\u52BF\u660E\u6717\u671F', winRate: 0, avgPrize: 0, roi: 0, maxPrize: 0, risk: 'high', likes: 189, strategy: { hotCount: 6, coldCount: 2, balanceCount: 2, zoneBalance: false, maxConsecutive: 3, playType: '\u9009\u516B', noteType: '\u590D\u5F0F' } },
  { name: '\u51B7\u53F7\u730E\u624B', author: '\u7CFB\u7EDF\u63A8\u8350', description: '\u51B7\u53F7\u56DE\u88652:6:2\uFF0C\u9002\u5408\u51B7\u53F7\u6D3B\u8DC3\u671F', winRate: 0, avgPrize: 0, roi: 0, maxPrize: 0, risk: 'mid', likes: 178, strategy: { hotCount: 2, coldCount: 6, balanceCount: 2, zoneBalance: true, maxConsecutive: 2, playType: '\u9009\u516B', noteType: '\u590D\u5F0F' } },
  { name: '\u56DB\u533A\u536B\u58EB', author: '\u7CFB\u7EDF\u63A8\u8350', description: '\u4E25\u683C\u56DB\u533A\u5E73\u88612:2:3:3\uFF0C\u5206\u6563\u98CE\u9669', winRate: 0, avgPrize: 0, roi: 0, maxPrize: 0, risk: 'low', likes: 165, strategy: { hotCount: 3, coldCount: 3, balanceCount: 4, zoneBalance: true, maxConsecutive: 1, playType: '\u9009\u516B', noteType: '\u590D\u5F0F' } },
  { name: '\u80C6\u62D6\u7CBE\u7B97', author: '\u7CFB\u7EDF\u63A8\u8350', description: '\u80C6\u7801\u5B9A3\u4E2A\u70ED\u53F7\uFF0C\u62D6\u7801\u5747\u8861\u90097\u4E2A', winRate: 0, avgPrize: 0, roi: 0, maxPrize: 0, risk: 'mid', likes: 142, strategy: { hotCount: 4, coldCount: 3, balanceCount: 3, zoneBalance: false, maxConsecutive: 2, playType: '\u9009\u516B', noteType: '\u80C6\u62D6' } },
  { name: '\u968F\u673A\u5747\u8861', author: '\u7CFB\u7EDF\u63A8\u8350', description: '\u5404\u7EF4\u5EA6\u5747\u5300\u5206\u914D\uFF0C\u964D\u4F4E\u6781\u7AEF', winRate: 0, avgPrize: 0, roi: 0, maxPrize: 0, risk: 'low', likes: 120, strategy: { hotCount: 2, coldCount: 2, balanceCount: 6, zoneBalance: true, maxConsecutive: 1, playType: '\u9009\u516B', noteType: '\u590D\u5F0F' } },
];

export default function StrategyLeaderboardPage() {
  const { draws, loading: ld } = useDraws(100);
  const { stats, loading: ls } = useNumberStats();
  const [sortBy, setSortBy] = useState<'likes' | 'winRate' | 'roi' | 'risk'>('likes');
  const [backtested, setBacktested] = useState(false);
  const [backtesting, setBacktesting] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(COMMUNITY_STRATEGIES);

  async function runAllBacktests() {
    if (!draws.length || !stats.length) return;
    setBacktesting(true);

    const results = [...COMMUNITY_STRATEGIES];
    const drawData = draws.map(d => ({ numbers: d.numbers, draw_number: d.draw_number, draw_date: d.draw_date }));

    for (let i = 0; i < results.length; i++) {
      const entry = results[i];
      const s = entry.strategy;
      const totalPick = s.hotCount + s.coldCount + s.balanceCount;

      // Use ensemble scoring to generate candidate numbers
      const ensembleResults = ensembleScoring(
        drawData,
        stats.map(st => ({
          number: st.number,
          hotScore: st.hotScore,
          currentMiss: st.currentMiss,
          avgMiss: st.avgMiss,
          missRatio: st.missRatio,
          recent10Rate: st.recent10Rate,
        }))
      );

      // Pick top numbers by ensemble score
      const numbers = ensembleResults.slice(0, totalPick).map(e => e.number).sort((a, b) => a - b);

      try {
        const btResult = runBacktest({
          numbers,
          draws: drawData.slice(0, Math.min(drawData.length, 60)),
          betCost: 2,
          prizeTable: { 4: 5, 5: 50, 6: 500, 7: 5000, 8: 50000 },
          windowSize: 10,
        });

        results[i] = {
          ...entry,
          winRate: parseFloat((btResult.winRate * 100).toFixed(1)),
          avgPrize: parseFloat((btResult.totalPrize / Math.max(btResult.totalRounds, 1)).toFixed(2)),
          roi: parseFloat(btResult.roi.toFixed(1)),
          maxPrize: btResult.maxWin,
        };
      } catch {
        // backtest failed, leave defaults
      }
    }

    setEntries(results);
    setBacktested(true);
    setBacktesting(false);
  }

  const sorted = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (sortBy === 'likes') return b.likes - a.likes;
      if (sortBy === 'winRate') return b.winRate - a.winRate;
      if (sortBy === 'roi') return b.roi - a.roi;
      if (sortBy === 'risk') {
        const riskOrder: Record<string, number> = { low: 0, mid: 1, high: 2 };
        return (riskOrder[a.risk] || 0) - (riskOrder[b.risk] || 0);
      }
      return 0;
    });
  }, [entries, sortBy]);
  if (ld || ls) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><span className="text-base text-[var(--color-muted)]">加载中...</span></div></div>;

  function getRankBadge(rank: number) {
    if (rank === 1) return '\uD83E\uDD47';
    if (rank === 2) return '\uD83E\uDD48';
    if (rank === 3) return '\uD83E\uDD49';
    return '#' + rank;
  }

  const riskLabels: Record<string, string> = { low: '\u4F4E\u98CE\u9669', mid: '\u4E2D\u98CE\u9669', high: '\u9AD8\u98CE\u9669' };
  const riskColors: Record<string, string> = {
    low: 'bg-emerald-500/15 text-emerald-400',
    mid: 'bg-amber-500/15 text-amber-400',
    high: 'bg-red-500/15 text-red-400',
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold gradient-text-primary">{'\uD83C\uDFC6 \u7B56\u7565\u6392\u884C\u699C'}</h2>
        <button onClick={runAllBacktests} disabled={backtesting || !draws.length}
          className="btn-primary text-sm disabled:opacity-50">
          {backtesting ? '\u23F3 \u56DE\u6D4B\u4E2D...' : backtested ? '\uD83D\uDD04 \u91CD\u65B0\u56DE\u6D4B' : '\uD83D\uDCCA \u4E00\u952E\u56DE\u6D4B\u5168\u90E8'}
        </button>
      </div>

      {/* Sort Tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'likes' as const, label: '\u2764\uFE0F \u4EBA\u6C14' },
          { key: 'winRate' as const, label: '\uD83C\uDFAF \u547D\u4E2D\u7387' },
          { key: 'roi' as const, label: '\uD83D\uDCB0 ROI' },
          { key: 'risk' as const, label: '\uD83D\uDEE1\uFE0F \u98CE\u9669' },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setSortBy(tab.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all ${sortBy === tab.key ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold' : 'text-[var(--color-muted)] hover:bg-white/5'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      <div className="space-y-3">
        {sorted.map((entry, i) => (
          <div key={entry.name} className="glass-card p-4 hover:border-[var(--color-primary)]/30 transition-all">
            <div className="flex items-start gap-4">
              <div className="text-2xl w-8 text-center shrink-0">{getRankBadge(i + 1)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-bold text-sm">{entry.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${riskColors[entry.risk]}`}>{riskLabels[entry.risk]}</span>
                  <span className="text-sm text-[var(--color-muted)]">by {entry.author}</span>
                </div>
                <div className="text-sm text-[var(--color-muted)] mb-2">{entry.description}</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="text-sm text-[var(--color-muted)]">{'\u2764\uFE0F \u4EBA\u6C14'}</div>
                    <div className="font-bold text-sm">{entry.likes}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[var(--color-muted)]">{'\uD83C\uDFAF \u547D\u4E2D\u7387'}</div>
                    <div className="font-bold text-sm">{backtested ? entry.winRate + '%' : '\u2014'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[var(--color-muted)]">{'\uD83D\uDCB0 ROI'}</div>
                    <div className={`font-bold text-sm ${entry.roi > 0 ? 'text-emerald-400' : entry.roi < 0 ? 'text-red-400' : ''}`}>
                      {backtested ? (entry.roi > 0 ? '+' : '') + entry.roi + '%' : '\u2014'}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-[var(--color-muted)]">{'\uD83C\uDFAE \u73A9\u6CD5'}</div>
                    <div className="font-bold text-sm">{entry.strategy.playType}</div>
                  </div>
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{'\u70ED' + entry.strategy.hotCount}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">{'\u51B7' + entry.strategy.coldCount}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{'\u5E73' + entry.strategy.balanceCount}</span>
                  {entry.strategy.zoneBalance && <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400">{'\u56DB\u533A\u5E73\u8861'}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400">{'\u8FDE\u53F7\u2264' + entry.strategy.maxConsecutive}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400">{entry.strategy.noteType}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
