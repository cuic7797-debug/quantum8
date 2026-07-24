import { useState, useMemo } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { applyFilters, generateBatch, scoreCombination } from '@quantum8/algorithm';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/hooks/useI18n';

interface CommunityStrategy {
  id: string;
  name: string;
  author: string;
  description: string;
  playType: string;
  hotCount: number;
  coldCount: number;
  balanceCount: number;
  winRate: number;
  avgScore: number;
  likes: number;
  tags: string[];
}

const COMMUNITY_STRATEGIES: CommunityStrategy[] = [
  { id: '1', name: '热号追踪器', author: 'QuantumAI', description: '追踪近期高频号码，偏向热号选号策略', playType: '选八', hotCount: 8, coldCount: 1, balanceCount: 1, winRate: 68.5, avgScore: 82.3, likes: 342, tags: ['热号', '趋势'] },
  { id: '2', name: '冷号回补者', author: 'DataMiner', description: '专注遗漏较深的号码，等待回补机会', playType: '选八', hotCount: 2, coldCount: 7, balanceCount: 1, winRate: 55.2, avgScore: 71.8, likes: 218, tags: ['冷号', '遗漏'] },
  { id: '3', name: '均衡大师', author: 'StatPro', description: '热冷均衡选号，四区平衡，风险分散', playType: '选八', hotCount: 4, coldCount: 4, balanceCount: 2, winRate: 72.1, avgScore: 85.6, likes: 567, tags: ['均衡', '低风险'] },
  { id: '4', name: '胆拖专家', author: 'BetMaster', description: '精选胆码+拖码组合，提高覆盖效率', playType: '选八', hotCount: 5, coldCount: 3, balanceCount: 2, winRate: 65.8, avgScore: 78.9, likes: 423, tags: ['胆拖', '高效'] },
  { id: '5', name: '趋势猎手', author: 'TrendHunter', description: '捕捉号码上升趋势，追涨杀跌', playType: '选八', hotCount: 7, coldCount: 2, balanceCount: 1, winRate: 61.3, avgScore: 76.4, likes: 189, tags: ['趋势', '激进'] },
  { id: '6', name: '保守稳健', author: 'SafePlay', description: '低风险保守策略，稳扎稳打', playType: '选八', hotCount: 3, coldCount: 3, balanceCount: 4, winRate: 75.8, avgScore: 88.2, likes: 891, tags: ['保守', '稳健'] },
];

export default function StrategyMarketPage() {
  const { user } = useAuth();
  const { draws, loading: ld } = useDraws(100);
  const { stats, loading: ls } = useNumberStats();
  const [selectedStrat, setSelectedStrat] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'likes' | 'winRate' | 'avgScore'>('likes');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    COMMUNITY_STRATEGIES.forEach(s => s.tags.forEach(t => tags.add(t)));
    return [...tags];
  }, []);

  const sortedStrategies = useMemo(() => {
    let filtered = COMMUNITY_STRATEGIES;
    if (filterTag) filtered = filtered.filter(s => s.tags.includes(filterTag));
    return [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [sortBy, filterTag]);
  if (ld || ls) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><span className="text-base text-[var(--color-muted)]">加载中...</span></div></div>;

  function runStrategy(strat: CommunityStrategy) {
    if (!stats.length || !draws.length) return;
    setGenerating(true);
    setSelectedStrat(strat.id);
    setTimeout(() => {
      const killedNums: number[] = [];
      try { killedNums.push(...JSON.parse(localStorage.getItem('quantum8_killed_numbers') || '[]')); } catch {}
      
      const pc = 8;
      const cfg = { hotCount: strat.hotCount, coldCount: strat.coldCount, balanceCount: strat.balanceCount, zoneBalance: true, sumRange: [200, 440] as [number, number], oddEvenRange: [6, 14] as [number, number], maxConsecutive: 3 };
      
      const generateSafe = (count: number, batchSize: number): number[][] => {
        const result: number[][] = [];
        let attempts = 0;
        while (result.length < batchSize && attempts < batchSize * 3) {
          attempts++;
          const pool = Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !killedNums.includes(n));
          if (pool.length < count) break;
          const combo: number[] = [];
          const p = [...pool];
          for (let i = 0; i < count; i++) {
            const idx = Math.floor(Math.random() * p.length);
            combo.push(p[idx]);
            p.splice(idx, 1);
          }
          result.push(combo.sort((a, b) => a - b));
        }
        return result;
      };
      
      const batch = generateSafe(pc, 3000);
      const filtered = applyFilters(batch, cfg);
      const scored = filtered.slice(0, 80).map(c => scoreCombination(c, stats, draws.length)).sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
      setResults(scored);
      setGenerating(false);
    }, 200);
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold gradient-text-primary">🏪 策略市场</h2>
      <div className="text-sm text-[var(--color-muted)]">浏览社区策略，一键运行生成推荐号码</div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm text-[var(--color-muted)]">排序:</span>
          {(['likes', 'winRate', 'avgScore'] as const).map(key => (
            <button key={key} onClick={() => setSortBy(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === key ? 'bg-[var(--color-primary)] text-white' : 'glass-inset text-[var(--color-muted)] hover:bg-white/10'
              }`}>
              {{ likes: '❤️ 最多收藏', winRate: '🎯 最高胜率', avgScore: '📊 最高评分' }[key]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-sm text-[var(--color-muted)]">标签:</span>
          <button onClick={() => setFilterTag(null)}
            className={`px-2 py-1 rounded text-xs transition-all ${!filterTag ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'glass-inset text-[var(--color-muted)]'}`}>
            全部
          </button>
          {allTags.map(tag => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-2 py-1 rounded text-xs transition-all ${filterTag === tag ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'glass-inset text-[var(--color-muted)]'}`}>
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedStrategies.map(s => (
          <div key={s.id} className={`glass-card p-4 transition-all ${selectedStrat === s.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-sm">{s.name}</h3>
                <div className="text-sm text-[var(--color-muted)]">by {s.author}</div>
              </div>
              <span className="text-xs font-bold text-[var(--color-primary)]">❤️ {s.likes}</span>
            </div>
            <p className="text-sm text-[var(--color-muted)] mb-3 leading-relaxed">{s.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {s.tags.map(tag => (
                <span key={tag} className="text-xs bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full">{tag}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3 text-center">
              <div className="glass-inset p-1.5">
                <div className="text-sm text-[var(--color-muted)]">胜率</div>
                <div className="text-xs font-bold font-mono text-emerald-400">{s.winRate}%</div>
              </div>
              <div className="glass-inset p-1.5">
                <div className="text-sm text-[var(--color-muted)]">评分</div>
                <div className="text-xs font-bold font-mono text-amber-400">{s.avgScore}</div>
              </div>
              <div className="glass-inset p-1.5">
                <div className="text-sm text-[var(--color-muted)]">配置</div>
                <div className="text-xs font-mono">热{s.hotCount}冷{s.coldCount}</div>
              </div>
            </div>
            <button onClick={() => runStrategy(s)} disabled={generating || !stats.length}
              className="w-full btn-primary text-xs py-2 disabled:opacity-50">
              {generating && selectedStrat === s.id ? '⏳ 运行中...' : '▶️ 运行策略'}
            </button>
          </div>
        ))}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Collapsible title={`🎯 推荐结果（${results.length}组）`} step={0} defaultOpen={true}>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="glass-inset p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500 text-black' : 'bg-[var(--color-border)] text-[var(--color-muted)]'}`}>{i + 1}</span>
                    <div className="flex gap-0.5 flex-wrap">{r.numbers.map((n: number) => <NumberBall key={n} number={n} size="sm" />)}</div>
                  </div>
                  <span className="font-bold font-mono text-sm">{r.totalScore}</span>
                </div>
              </div>
            ))}
          </div>
        </Collapsible>
      )}
    </div>
  );
}
