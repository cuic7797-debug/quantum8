import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import { t } from '@/hooks/useI18n';

export default function ReportPage() {
  const { draws, loading: ld } = useDraws(50);
  const { stats, loading: ls } = useNumberStats();

  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length || !stats.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  const latest = draws[0];
  const recent10 = draws.slice(0, 10);
  const recent20 = draws.slice(0, 20);

  // Hot numbers (top 10 by hotScore)
  const hotTop10 = [...stats].sort((a, b) => b.hotScore - a.hotScore).slice(0, 10);

  // Cold numbers (top 10 by currentMiss)
  const coldTop10 = [...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 10);

  // Overdue numbers (high missRatio)
  const overdue = [...stats].sort((a, b) => b.missRatio - a.missRatio).slice(0, 5);

  // Recent frequency trend
  const freq10 = new Map<number, number>();
  const freq20 = new Map<number, number>();
  recent10.forEach(d => d.numbers.forEach(n => freq10.set(n, (freq10.get(n) || 0) + 1)));
  recent20.forEach(d => d.numbers.forEach(n => freq20.set(n, (freq20.get(n) || 0) + 1)));

  // Rising numbers (recent10 rate > recent20 rate)
  const rising = [...stats].filter(s => s.recent10Rate > s.recent20Rate).sort((a, b) => b.recent10Rate - a.recent10Rate).slice(0, 5);

  // Falling numbers (recent10 rate < recent20 rate)
  const falling = [...stats].filter(s => s.recent10Rate < s.recent20Rate).sort((a, b) => a.recent10Rate - b.recent10Rate).slice(0, 5);

  // Zone balance
  const zones = [0, 0, 0, 0];
  recent10.forEach(d => {
    zones[0] += d.zone1_count;
    zones[1] += d.zone2_count;
    zones[2] += d.zone3_count;
    zones[3] += d.zone4_count;
  });
  const totalNums = recent10.length * 20;
  const zonePercents = zones.map(z => ((z / totalNums) * 100).toFixed(1));

  // Odd/Even trend
  const oddCounts = recent10.map(d => d.odd_count);
  const avgOdd = (oddCounts.reduce((a, b) => a + b, 0) / oddCounts.length).toFixed(1);

  // Sum trend
  const sums = recent10.map(d => d.sum_value);
  const avgSum = Math.round(sums.reduce((a, b) => a + b, 0) / sums.length);
  const sumMin = Math.min(...sums);
  const sumMax = Math.max(...sums);

  // Consecutive analysis
  let hasConsec = 0;
  recent10.forEach(d => { if (d.consecutive_count > 0) hasConsec++; });

  // Number pair co-occurrence (top pairs in recent 10)
  const pairCount = new Map<string, number>();
  recent10.forEach(d => {
    const nums = d.numbers.sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        pairCount.set(key, (pairCount.get(key) || 0) + 1);
      }
    }
  });
  const topPairs = [...pairCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">AI 分析报告</h2>
      <div className="text-xs text-[var(--color-muted)] bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2">
        ⚠ 以下分析基于近50期历史数据统计，仅供参考，不构成投注建议。
      </div>

      {/* Report Header */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">Quantum8 数据分析报告</h3>
            <p className="text-xs text-[var(--color-muted)]">基于近 {draws.length} 期数据 · {latest.draw_date} 更新</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--color-muted)]">最新一期</div>
            <div className="font-mono font-bold">{latest.draw_number}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {latest.numbers.map(n => <NumberBall key={n} number={n} size="md" />)}
        </div>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="glass-inset p-2"><div className="text-[var(--color-muted)]">和值</div><div className="font-bold font-mono">{latest.sum_value}</div></div>
          <div className="glass-inset p-2"><div className="text-[var(--color-muted)]">奇偶</div><div className="font-bold font-mono">{latest.odd_count}:{latest.even_count}</div></div>
          <div className="glass-inset p-2"><div className="text-[var(--color-muted)]">大小</div><div className="font-bold font-mono">{latest.big_count}:{latest.small_count}</div></div>
          <div className="glass-inset p-2"><div className="text-[var(--color-muted)]">跨度</div><div className="font-bold font-mono">{latest.span}</div></div>
        </div>
      </div>

      {/* Key Findings */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold">📊 关键发现</h3>
        <div className="space-y-3">
          <div className="glass-inset p-3">
            <div className="text-sm font-medium mb-1">热号趋势</div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              近10期热号 TOP 3：
              <span className="text-red-400 font-mono"> {hotTop10.slice(0, 3).map(s => s.number.toString().padStart(2, '0')).join('、')}</span>
              ，出现频率分别为 {hotTop10.slice(0, 3).map(s => `${s.recent10Rate}%`).join('、')}。
              热度分均在 {hotTop10[0]?.hotScore} 以上，处于活跃状态。
            </p>
          </div>
          <div className="glass-inset p-3">
            <div className="text-sm font-medium mb-1">冷号遗漏</div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              当前遗漏最长的号码：
              <span className="text-blue-400 font-mono"> {coldTop10.slice(0, 3).map(s => s.number.toString().padStart(2, '0')).join('、')}</span>
              ，已分别遗漏 {coldTop10.slice(0, 3).map(s => `${s.currentMiss}期`).join('、')}。
              {overdue[0]?.missRatio > 80 ? '部分号码遗漏值偏高，存在回补可能。' : '遗漏值处于正常范围。'}
            </p>
          </div>
          <div className="glass-inset p-3">
            <div className="text-sm font-medium mb-1">号码走势</div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              上升趋势：
              <span className="text-emerald-400 font-mono"> {rising.slice(0, 3).map(s => s.number.toString().padStart(2, '0')).join('、')}</span>
              （近10期频率 &gt; 近20期）。
              下降趋势：
              <span className="text-amber-400 font-mono"> {falling.slice(0, 3).map(s => s.number.toString().padStart(2, '0')).join('、')}</span>
              （近10期频率 &lt; 近20期）。
            </p>
          </div>
          <div className="glass-inset p-3">
            <div className="text-sm font-medium mb-1">结构特征</div>
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              近10期平均奇偶比 <span className="font-mono">{avgOdd}:10</span>，
              平均和值 <span className="font-mono">{avgSum}</span>（范围 {sumMin}-{sumMax}），
              四区分布 {zonePercents[0]}%:{zonePercents[1]}%:{zonePercents[2]}%:{zonePercents[3]}%，
              {Math.abs(parseFloat(zonePercents[0]) - 25) < 5 ? '分布较为均衡。' : '一区偏重。'}
              {hasConsec > 5 ? '连号出现频率较高（' + hasConsec + '/10期）。' : '连号出现频率适中。'}
            </p>
          </div>
        </div>
      </div>

      {/* Hot/Cold Numbers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">🔥 热号 TOP 10</h3>
          <div className="space-y-2">
            {hotTop10.map((s, i) => (
              <div key={s.number} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-muted)] w-4">{i + 1}</span>
                  <NumberBall number={s.number} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--color-muted)]">频{s.recent10Rate}%</span>
                  <span className="font-mono font-bold text-red-400">{s.hotScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="font-semibold mb-3">❄️ 冷号 TOP 10</h3>
          <div className="space-y-2">
            {coldTop10.map((s, i) => (
              <div key={s.number} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-muted)] w-4">{i + 1}</span>
                  <NumberBall number={s.number} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--color-muted)]">漏{s.currentMiss}期</span>
                  <span className="font-mono font-bold text-blue-400">{s.missRatio || '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Pairs */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">🔗 常见号码组合（近10期共现）</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {topPairs.map(([pair, count], i) => {
            const [a, b] = pair.split('-').map(Number);
            return (
              <div key={pair} className="glass-inset p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <NumberBall number={a} size="sm" />
                  <span className="text-[var(--color-muted)]">+</span>
                  <NumberBall number={b} size="sm" />
                </div>
                <div className="text-xs text-[var(--color-muted)]">{count}次</div>
              </div>
            );
          })}
        </div>
      </div>


      {/* Distribution Analysis */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">📊 号码分布分析</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="glass-inset p-3">
            <div className="text-xs text-[var(--color-muted)] mb-1">一区(1-20)</div>
            <div className="text-lg font-bold font-mono">{zonePercents[0]}%</div>
            <div className="text-[10px] text-[var(--color-muted)]">{'>'}25% 偏重</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-xs text-[var(--color-muted)] mb-1">二区(21-40)</div>
            <div className="text-lg font-bold font-mono">{zonePercents[1]}%</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-xs text-[var(--color-muted)] mb-1">三区(41-60)</div>
            <div className="text-lg font-bold font-mono">{zonePercents[2]}%</div>
          </div>
          <div className="glass-inset p-3">
            <div className="text-xs text-[var(--color-muted)] mb-1">四区(61-80)</div>
            <div className="text-lg font-bold font-mono">{zonePercents[3]}%</div>
          </div>
        </div>
      </div>

      {/* Odd/Even Analysis */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">⚖️ 奇偶分析</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-inset p-3 text-center">
            <div className="text-xs text-[var(--color-muted)]">近10期平均奇数</div>
            <div className="text-lg font-bold font-mono text-purple-400">{avgOdd}</div>
          </div>
          <div className="glass-inset p-3 text-center">
            <div className="text-xs text-[var(--color-muted)]">奇偶比趋势</div>
            <div className="text-sm font-bold">
              {parseFloat(avgOdd) > 10.5 ? '奇数偏多' : parseFloat(avgOdd) < 9.5 ? '偶数偏多' : '均衡'}
            </div>
          </div>
          <div className="glass-inset p-3 text-center">
            <div className="text-xs text-[var(--color-muted)]">最新开奖奇偶</div>
            <div className="text-lg font-bold font-mono">{latest.odd_count}:{latest.even_count}</div>
          </div>
        </div>
      </div>

      {/* Overdue Numbers */}
      <div className="glass-card p-5">
        <h3 className="font-semibold mb-3">⏰ 遗漏回补分析</h3>
        <div className="space-y-2">
          {overdue.map((s, i) => (
            <div key={s.number} className="flex items-center gap-3 py-2 px-3 glass-inset">
              <NumberBall number={s.number} size="sm" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">号码 {s.number}</span>
                  <span className="text-xs text-[var(--color-muted)]">遗漏{s.currentMiss}期</span>
                </div>
                <div className="h-1.5 bg-[var(--color-border)] rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: Math.min(100, s.missRatio) + '%' }} />
                </div>
              </div>
              <span className="text-xs font-mono text-amber-400">{s.missRatio}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[var(--color-primary)]/10 rounded-xl border border-[var(--color-primary)]/20 p-5">
        <h3 className="font-semibold mb-2">📋 综合评估</h3>
        <div className="space-y-1 text-xs text-[var(--color-muted)]">
          <p>• 近期号码热度{hotTop10.slice(0, 3).length >= 3 ? '较高' : '适中'}，关注{hotTop10.slice(0, 3).map(s => s.number).join('、')}号趋势</p>
          <p>• 冷号{coldTop10.slice(0, 3).map(s => s.number).join('、')}遗漏较深，存在回补可能</p>
          <p>• 四区分布{Math.abs(parseFloat(zonePercents[0]) - 25) < 5 ? '较为均衡' : '存在一定偏态'}</p>
          <p>• 奇偶比{parseFloat(avgOdd) > 11 ? '偏奇' : parseFloat(avgOdd) < 9 ? '偏偶' : '均衡'}</p>
          <p>• 连号出现频率{hasConsec > 5 ? '偏高' : '适中'}，结构{hasConsec > 5 ? '较复杂' : '较规整'}</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-[10px] text-[var(--color-muted)] py-4">
        Quantum8 v1.0 · 以上分析仅供参考，不构成投注建议 · 彩票有风险，投注需理性
      </div>
    </div>
  );
}
