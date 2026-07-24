import { useState, useEffect } from 'react';
import { useNumberStats } from '@/hooks/useNumberStats';
import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';
import CopyButton from '@/components/common/CopyButton';
import Collapsible from '@/components/common/Collapsible';
import { ensembleScoring, calculateEntropy, trendRegression } from '@quantum8/algorithm';


type Strategy = 'cold' | 'stable' | 'diverse' | 'entropy' | 'trend' | 'ensemble';

const STRATEGIES: { key: Strategy; name: string; icon: string; desc: string; killCount: number }[] = [
  { key: 'cold', name: '杀冷号', icon: '❄️', desc: '排除遗漏最大的号码', killCount: 20 },
  { key: 'stable', name: '杀热号', icon: '🔥', desc: '排除过热可能回冷的号码', killCount: 15 },
  { key: 'diverse', name: '杀偏态', icon: '🎯', desc: '排除分布不均衡的号码', killCount: 10 },
  { key: 'entropy', name: '杀高熵', icon: '🎲', desc: '排除不确定性最高的号码', killCount: 15 },
  { key: 'trend', name: '杀趋势', icon: '📉', desc: '排除下降趋势的号码', killCount: 12 },
  { key: 'ensemble', name: '杀集成', icon: '🧠', desc: '多算法综合评分最低的号码', killCount: 15 },
];

interface KillResult {
  killed: number[];
  alive: number[];
  strategy: string;
  confidence: number;
  reason: string;
}

export default function KillPage() {
  const { stats, loading: ls } = useNumberStats();
  const { draws, loading: ld } = useDraws(100);
  const [manualKill, setManualKill] = useState<number[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy>('cold');
  const [autoKill, setAutoKill] = useState<KillResult | null>(null);
  const [killCount, setKillCount] = useState(20);
  const [showResult, setShowResult] = useState(false);

  // Save to localStorage for integration with SelectionPage
  const STORAGE_KEY = 'quantum8_killed_numbers';

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setManualKill(saved);
    } catch { setManualKill([]); }
  }, []);
  if (ld || ls) return <div className="flex items-center justify-center h-64"><div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" /><span className="text-base text-[var(--color-muted)]">加载中...</span></div></div>;

  function saveKillList(list: number[]) {
    setManualKill(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function toggleNum(n: number) {
    saveKillList(manualKill.includes(n) ? manualKill.filter(x => x !== n) : manualKill.length < 40 ? [...manualKill, n].sort((a, b) => a - b) : manualKill);
  }

  function autoSelect(strategy: Strategy) {
    if (!stats.length || !draws.length) return;
    setSelectedStrategy(strategy);
    const s = STRATEGIES.find(x => x.key === strategy)!;
    let killed: number[] = [];
    let reason = '';

    if (strategy === 'cold') {
      // 杀冷号: 排除遗漏最大的
      const sorted = [...stats].sort((a, b) => b.currentMiss - a.currentMiss);
      killed = sorted.slice(0, killCount).map(x => x.number);
      reason = `排除遗漏最大的${killCount}个号码，当前最大遗漏${sorted[0]?.currentMiss || 0}期`;
    } else if (strategy === 'stable') {
      // 杀热号: 排除近期过热的（出现频率过高，可能回冷）
      const sorted = [...stats].sort((a, b) => b.recent10Rate - a.recent10Rate);
      killed = sorted.slice(0, killCount).map(x => x.number);
      reason = `排除近10期过热的${killCount}个号码，最高频率${sorted[0]?.recent10Rate || 0}%`;
    } else if (strategy === 'diverse') {
      const zoneStats = [[], [], [], []] as typeof stats[];
      stats.forEach(s => {
        if (s.number <= 20) zoneStats[0].push(s);
        else if (s.number <= 40) zoneStats[1].push(s);
        else if (s.number <= 60) zoneStats[2].push(s);
        else zoneStats[3].push(s);
      });
      const perZone = Math.ceil(killCount / 4);
      zoneStats.forEach(zone => {
        const sorted = zone.sort((a, b) => b.recent10Rate - a.recent10Rate);
        killed.push(...sorted.slice(0, perZone).map(x => x.number));
      });
      killed = killed.slice(0, killCount).sort((a, b) => a - b);
      reason = `四区各排除${perZone}个偏态号码，保持分布均衡`;
    } else if (strategy === 'entropy') {
      // 杀高熵: 排除信息熵最高的号码（不确定性最大）
      const entropyResults = stats.map(s => ({
        ...s,
        entropy: calculateEntropy(s.number, draws).entropy,
      }));
      killed = entropyResults.sort((a, b) => b.entropy - a.entropy).slice(0, killCount).map(x => x.number);
      reason = `排除信息熵最高的${killCount}个号码（不确定性最大，最难预测）`;
    } else if (strategy === 'trend') {
      // 杀趋势: 排除下降趋势明显的号码
      const trendResults = stats.map(s => ({
        ...s,
        trend: trendRegression(s.number, draws),
      }));
      killed = trendResults.filter(s => s.trend.slope < -0.02)
        .sort((a, b) => a.trend.slope - b.trend.slope)
        .slice(0, killCount).map(x => x.number);
      if (killed.length < killCount) {
        const remaining = stats.filter(s => !killed.includes(s.number))
          .sort((a, b) => a.recent10Rate - b.recent10Rate);
        killed.push(...remaining.slice(0, killCount - killed.length).map(x => x.number));
      }
      reason = `排除下降趋势明显的${killCount}个号码（回归斜率<0）`;
    } else if (strategy === 'ensemble') {
      // 杀集成: 多算法综合评分最低的号码
      // Only score top 30 for performance
      const topStats = [...stats].sort((a, b) => b.hotScore - a.hotScore).slice(0, 30);
      const ensembleResults = ensembleScoring(draws, topStats);
      killed = ensembleResults.sort((a, b) => a.ensembleScore - b.ensembleScore)
        .slice(0, killCount).map(x => x.number);
      reason = `集成评分（马尔可夫+贝叶斯+熵+频率+遗漏）最低的${killCount}个号码`;
    }

    const confidence = Math.min(95, 60 + (killCount <= 15 ? 15 : killCount <= 25 ? 10 : 5));
    setAutoKill({ killed, alive: Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !killed.includes(n)), strategy: s.name, confidence, reason });
    setShowResult(true);
  }

  function applyAutoKill() {
    if (autoKill) saveKillList(autoKill.killed);
  }

  const aliveNums = Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !manualKill.includes(n));

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">🔪 杀号工具</h2>
      <div className="text-sm text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        ⚠ 杀号基于统计分析，排除可能性较低的号码，提升选号效率
      </div>

      {/* 智能杀号 */}
      <Collapsible title="🤖 智能杀号策略" step={1} badge={STRATEGIES.find(s => s.key === selectedStrategy)?.name}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {STRATEGIES.map(s => (
            <button key={s.key} onClick={() => setSelectedStrategy(s.key)}
              className={'p-4 rounded-xl text-left transition-all border-2 ' + (
                selectedStrategy === s.key ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]' : 'bg-[var(--color-bg)] border-transparent hover:border-[var(--color-primary)]/30'
              )}>
              <div className="text-2xl">{s.icon}</div>
              <div className="text-base font-bold mt-1">{s.name}</div>
              <div className="text-sm text-[var(--color-muted)] mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <label className="text-sm text-[var(--color-muted)]">杀号数量:</label>
          <div className="flex gap-1">
            {[10, 15, 20, 25, 30, 40].map(n => (
              <button key={n} onClick={() => setKillCount(n)}
                className={'px-3 py-1 rounded text-xs font-bold ' + (killCount === n ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
                {n}个
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => autoSelect(selectedStrategy)}
          className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary)]/80 transition-all">
          🎯 执行智能杀号
        </button>

        {autoKill && showResult && (
          <div className="mt-4 glass-inset p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold">{autoKill.strategy} · 排除{autoKill.killed.length}个</div>
              <div className="text-xs text-emerald-400">置信度 {autoKill.confidence}%</div>
            </div>
            <div className="text-sm text-[var(--color-muted)]">{autoKill.reason}</div>
            <div className="flex flex-wrap gap-1">
              {autoKill.killed.map(n => <NumberBall key={n} number={n} size="sm" />)}
            </div>
            <div className="text-sm text-[var(--color-muted)]">
              剩余 <span className="text-emerald-400 font-bold">{autoKill.alive.length}</span> 个号码可用
            </div>
            <div className="flex gap-2">
              <button onClick={applyAutoKill} className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 text-base font-semibold hover:bg-emerald-500/30 transition-all">
                ✓ 应用到杀号列表
              </button>
              <button onClick={() => setShowResult(false)} className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-muted)] text-sm hover:bg-[var(--color-border)] transition-all">
                取消
              </button>
            </div>
          </div>
        )}
      </Collapsible>

      {/* 手动杀号 */}
      <Collapsible title="✋ 手动杀号" step={2} badge={manualKill.length + '/40'}>
        <div className="text-sm text-[var(--color-muted)] mb-2">点击号码加入杀号列表（最多40个）</div>
        <div className="grid grid-cols-10 gap-1.5">
          {Array.from({ length: 80 }, (_, i) => i + 1).map(n => {
            const isKilled = manualKill.includes(n);
            return (
              <button key={n} onClick={() => toggleNum(n)}
                className={'aspect-square rounded-lg text-xs font-bold transition-all ' + (
                  isKilled ? 'bg-red-500/80 text-white line-through' : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:bg-[var(--color-border)]'
                )}>
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={() => saveKillList([])} className="text-xs text-red-400 hover:underline">清空杀号列表</button>
          <CopyButton text={manualKill.join(' ')} label="复制杀号" />
        </div>
      </Collapsible>

      {/* 杀号结果 */}
      <Collapsible title="📊 杀号结果" step={3} badge={aliveNums.length + '个可用'} defaultOpen={manualKill.length > 0}>
        {manualKill.length === 0 ? (
          <div className="text-center py-6 text-[var(--color-muted)] text-sm">请先选择要杀的号码</div>
        ) : (
          <div className="space-y-3">
            <div className="bg-red-500/10 rounded-lg p-3">
              <div className="text-xs text-red-400 font-semibold mb-1">已杀号码（{manualKill.length}个）</div>
              <div className="flex flex-wrap gap-1">
                {manualKill.map(n => <NumberBall key={n} number={n} size="sm" />)}
              </div>
            </div>
            <div className="bg-emerald-500/10 rounded-lg p-3">
              <div className="text-xs text-emerald-400 font-semibold mb-1">可用号码（{aliveNums.length}个）</div>
              <div className="flex flex-wrap gap-1">
                {aliveNums.map(n => <NumberBall key={n} number={n} size="sm" />)}
              </div>
            </div>
            <div className="flex gap-2">
              <CopyButton text={aliveNums.join(' ')} label="📋 复制可用号码" className="flex-1 justify-center py-2 glass-inset" />
            </div>
            <div className="text-sm text-[var(--color-muted)] text-center">
              杀号列表已保存，智能选号将自动避开这些号码
            </div>
          </div>
        )}
      </Collapsible>
    </div>
  );
}
