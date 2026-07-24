import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { getClusterDetails, clusterNumbers } from '@quantum8/algorithm';
import { t } from '@/hooks/useI18n';

export default function NumberProfilePage() {
  const { draws, loading: ld } = useDraws(100);
  const { stats, loading: ls } = useNumberStats();
  const [selected, setSelected] = useState<number>(1);

  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length || !stats.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  const stat = stats.find(s => s.number === selected);
  const clusterDetails = getClusterDetails(draws, 50);
  const clusterInfo = clusterDetails.find(c => c.number === selected);
  const clusterSummary = clusterNumbers(draws, 50);

  // Number appearance history
  const appearances: number[] = [];
  draws.forEach((d, i) => {
    if (d.numbers.includes(selected)) appearances.push(draws.length - 1 - i);
  });

  // Gap analysis
  const gaps: number[] = [];
  for (let i = 1; i < appearances.length; i++) {
    gaps.push(appearances[i - 1] - appearances[i]);
  }
  const avgGap = gaps.length > 0 ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : 'N/A';
  const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;

  // Co-occurrence with other numbers
  const coAppear = new Map<number, number>();
  draws.forEach(d => {
    if (d.numbers.includes(selected)) {
      d.numbers.forEach(n => {
        if (n !== selected) coAppear.set(n, (coAppear.get(n) || 0) + 1);
      });
    }
  });
  const topCoAppear = [...coAppear.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Zone info
  const zone = Math.ceil(selected / 20);
  const zoneColors = ['text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400'];
  const zoneNames = ['一区(1-20)', '二区(21-40)', '三区(41-60)', '四区(61-80)'];

  // Cluster color
  const clusterColor: Record<string, string> = { hot: 'text-red-400', warm: 'text-amber-400', cool: 'text-blue-400', cold: 'text-slate-400' };
  const clusterLabel: Record<string, string> = { hot: '🔥 热号', warm: '🌡️ 温号', cool: '❄️ 冷号', cold: '🧊 冰号' };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold gradient-text-primary">🔍 号码画像</h2>

      {/* Number Selector */}
      <div className="glass-card p-4">
        <div className="text-xs text-[var(--color-muted)] mb-2">选择号码查看详情:</div>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 80 }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setSelected(n)}
              className={`w-full aspect-square rounded-lg text-xs font-bold transition-all ${
                selected === n
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20 scale-110'
                  : clusterSummary.hot.includes(n) ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : clusterSummary.warm.includes(n) ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                  : clusterSummary.cool.includes(n) ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                  : 'bg-slate-500/20 text-slate-400 hover:bg-slate-500/30'
              }`}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-3 mt-2 text-[10px]">
          <span className="text-red-400">● 热号({clusterSummary.hot.length})</span>
          <span className="text-amber-400">● 温号({clusterSummary.warm.length})</span>
          <span className="text-blue-400">● 冷号({clusterSummary.cool.length})</span>
          <span className="text-slate-400">● 冰号({clusterSummary.cold.length})</span>
        </div>
      </div>

      {/* Number Profile Card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4 mb-4">
          <NumberBall number={selected} size="lg" highlight />
          <div>
            <h3 className="text-2xl font-bold font-mono">{selected.toString().padStart(2, '0')}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold ${clusterColor[clusterInfo?.cluster || 'cool']}`}>
                {clusterLabel[clusterInfo?.cluster || 'cool']}
              </span>
              <span className="text-xs text-[var(--color-muted)]">|</span>
              <span className={`text-xs ${zoneColors[zone - 1]}`}>{zoneNames[zone - 1]}</span>
              <span className="text-xs text-[var(--color-muted)]">|</span>
              <span className="text-xs text-[var(--color-muted)]">综合分: <span className="font-bold text-[var(--color-text)]">{clusterInfo?.score.toFixed(1)}</span></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: '总出现', value: stat?.totalAppearances || 0, icon: '📊', color: 'text-blue-400' },
            { label: '当前遗漏', value: stat?.currentMiss || 0, icon: '⏰', color: 'text-amber-400' },
            { label: '热度分', value: stat?.hotScore || 0, icon: '🔥', color: 'text-red-400' },
            { label: '出现率', value: ((stat?.totalAppearances || 0) / draws.length * 100).toFixed(1) + '%', icon: '📈', color: 'text-emerald-400' },
          ].map(item => (
            <div key={item.label} className="glass-inset p-3 text-center">
              <div className="text-lg">{item.icon}</div>
              <div className={`font-bold font-mono text-lg mt-1 ${item.color}`}>{item.value}</div>
              <div className="text-[10px] text-[var(--color-muted)]">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap Analysis */}
      <Collapsible title="📊 间隔分析" step={1}>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="glass-inset p-3 text-center">
            <div className="text-xs text-[var(--color-muted)]">平均间隔</div>
            <div className="font-bold font-mono text-lg">{avgGap}期</div>
          </div>
          <div className="glass-inset p-3 text-center">
            <div className="text-xs text-[var(--color-muted)]">最大遗漏</div>
            <div className="font-bold font-mono text-lg">{maxGap}期</div>
          </div>
          <div className="glass-inset p-3 text-center">
            <div className="text-xs text-[var(--color-muted)]">出现次数</div>
            <div className="font-bold font-mono text-lg">{appearances.length}次</div>
          </div>
        </div>
        <div className="text-xs text-[var(--color-muted)]">
          近100期中出现 {appearances.length} 次，平均每 {avgGap} 期出现一次。
          {maxGap > 20 ? `最长遗漏达 ${maxGap} 期，存在回补可能。` : '遗漏值处于正常范围。'}
        </div>
      </Collapsible>

      {/* Co-occurrence */}
      <Collapsible title="🔗 关联号码" step={2}>
        <div className="text-xs text-[var(--color-muted)] mb-3">与号码 {selected.toString().padStart(2, '0')} 同期出现频率最高的号码:</div>
        <div className="space-y-2">
          {topCoAppear.map(([num, count], i) => (
            <div key={num} className="flex items-center gap-3">
              <span className="text-[10px] text-[var(--color-muted)] w-4">{i + 1}</span>
              <NumberBall number={num} size="sm" />
              <div className="flex-1 h-3 glass-inset rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full"
                  style={{ width: `${(count / (topCoAppear[0]?.[1] || 1)) * 100}%` }} />
              </div>
              <span className="text-xs font-mono w-12 text-right">{count}次</span>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Appearance Timeline */}
      <Collapsible title="📅 出现时间线" step={3} defaultOpen={false}>
        <div className="flex flex-wrap gap-1">
          {draws.slice(0, 50).map((d, i) => {
            const appeared = d.numbers.includes(selected);
            return (
              <div key={d.id} className={`w-8 h-8 rounded flex items-center justify-center text-[9px] font-mono transition-all ${
                appeared ? 'bg-[var(--color-primary)] text-white shadow-md' : 'glass-inset text-[var(--color-muted)]'
              }`} title={`${d.draw_number} ${d.draw_date}`}>
                {(draws.length - i).toString().slice(-2)}
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-[var(--color-muted)] mt-2">
          蓝色 = 出现，灰色 = 未出现（近50期）
        </div>
      </Collapsible>
    </div>
  );
}
