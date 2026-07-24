import SumDistribution from '@/components/charts/SumDistribution';
import NumberFrequency from '@/components/charts/NumberFrequency';
import MissTrendChart from '@/components/charts/MissTrendChart';
import ColdHotTransition from '@/components/charts/ColdHotTransition';
import PeriodSelector from '@/components/common/PeriodSelector';
import { useState } from 'react';
import MissTrend from '@/components/analysis/MissTrend';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberGrid from '@/components/analysis/NumberGrid';
import HotColdRanking from '@/components/analysis/HotColdRanking';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import CorrelationMatrix from '@/components/analysis/CorrelationMatrix';
import NumberLifecycle from '@/components/analysis/NumberLifecycle';
import PatternDetection from '@/components/analysis/PatternDetection';
import ProfessionalTrends from '@/components/analysis/ProfessionalTrends';
import MissDashboard from '@/components/analysis/MissDashboard';
import NumberCompare from '@/components/analysis/NumberCompare';
import NumberHeatmap from '@/components/analysis/NumberHeatmap';
import AdvancedAnalysis from '@/components/analysis/AdvancedAnalysis';
import NLQuery from '@/components/analysis/NLQuery';
import AnomalyDetector from '@/components/analysis/AnomalyDetector';
import { t } from '@/hooks/useI18n';

export default function AnalysisPage() {
  const [period, setPeriod] = useState(100);
  const { draws, loading: ld } = useDraws(period);
  const { stats, loading: ls } = useNumberStats();
  
  if (ld || ls) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length || !stats.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  let h2 = 0, h3 = 0, nc = 0;
  draws.forEach(d => {
    const nums = [...d.numbers].sort((a, b) => a - b);
    let mx = 1, s = 1;
    for (let i = 1; i < nums.length; i++) { if (nums[i] === nums[i - 1] + 1) { s++; mx = Math.max(mx, s); } else s = 1; }
    if (mx >= 3) h3++; else if (mx >= 2) h2++; else nc++;
  });

  const topFreq = [...stats].sort((a, b) => b.totalAppearances - a.totalAppearances).slice(0, 20);
  const maxFreq = topFreq[0]?.totalAppearances || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{t('trend_analysis')}</h2>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <Collapsible title="🤖 智能查询" step={0} badge="AI">
        <NLQuery />
      </Collapsible>

      <Collapsible title="⚡ 异常检测预警" step={1} badge="实时">
        <AnomalyDetector draws={draws} />
      </Collapsible>

      <Collapsible title="📊 号码热力图与冷热排行" step={2} badge="实时">
        <NumberGrid stats={stats} />
        <div className="mt-4"><HotColdRanking stats={stats} /></div>
      </Collapsible>

      <Collapsible title="🔥 频率排行 TOP 20" step={3} defaultOpen={false}>
        <div className="space-y-1.5">
          {topFreq.map(s => (
            <div key={s.number} className="flex items-center gap-2 text-sm">
              <NumberBall number={s.number} size="sm" />
              <div className="flex-1 h-5 glass-inset overflow-hidden">
                <div className="h-full bg-blue-500 rounded" style={{ width: (s.totalAppearances / maxFreq * 100) + '%' }} />
              </div>
              <span className="text-xs font-mono w-12 text-right">{s.totalAppearances}次</span>
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="📈 专业走势图表（大小/奇偶/和值/跨度/余数/四区）" step={4}>
        <ProfessionalTrends />
      </Collapsible>

      <Collapsible title="📊 和值分布与频率分析" step={5} defaultOpen={false}>
        <SumDistribution draws={draws} />
        <div className="mt-4"><NumberFrequency draws={draws} top={20} /></div>
      </Collapsible>

      <Collapsible title="⚡ 冷热转换预警" step={6} defaultOpen={false}>
        <ColdHotTransition draws={draws} />
      </Collapsible>

      <Collapsible title="📉 遗漏趋势可视化" step={7} defaultOpen={false}>
        <MissTrendChart draws={draws} />
      </Collapsible>

      <Collapsible title="📉 高级趋势分析（均线/热力图）" step={8} defaultOpen={false}>
        <div className="mt-2">
          {stats.length > 0 && <MissTrend stats={stats} />}
        </div>
      </Collapsible>

      <Collapsible title="📉 遗漏统计仪表盘" step={9}>
        <MissDashboard />
      </Collapsible>

      <Collapsible title="🔢 号码生命周期（冷热周期）" step={10} defaultOpen={false}>
        <NumberLifecycle />
      </Collapsible>

      <Collapsible title="🌡️ 号码热力图（80号码可视化）" step={11} defaultOpen={false}>
        <NumberHeatmap />
      </Collapsible>

      <Collapsible title="🔄 号码对比" step={12} defaultOpen={false}>
        <NumberCompare />
      </Collapsible>

      <Collapsible title="🔍 号码模式识别" step={13} defaultOpen={false}>
        <PatternDetection />
      </Collapsible>

      <Collapsible title="📊 专业数据分析（AC值/012路/尾数/重号邻号/跨度/和值区间）" step={14} defaultOpen={false}>
        <AdvancedAnalysis />
      </Collapsible>

      <Collapsible title="🔗 号码共现矩阵" step={15} defaultOpen={false}>
        <CorrelationMatrix />
      </Collapsible>

      <Collapsible title="🔗 连号统计" step={16} defaultOpen={false}>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center glass-inset p-3">
            <div className="text-2xl font-bold">{h2}</div>
            <div className="text-xs text-[var(--color-muted)]">含2连号 {((h2 / draws.length) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center glass-inset p-3">
            <div className="text-2xl font-bold">{h3}</div>
            <div className="text-xs text-[var(--color-muted)]">含3连号+ {((h3 / draws.length) * 100).toFixed(1)}%</div>
          </div>
          <div className="text-center glass-inset p-3">
            <div className="text-2xl font-bold">{nc}</div>
            <div className="text-xs text-[var(--color-muted)]">无连号 {((nc / draws.length) * 100).toFixed(1)}%</div>
          </div>
        </div>
      </Collapsible>

      <Collapsible title="⏰ 遗漏排名 TOP 20" step={17} defaultOpen={false}>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {[...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 20).map((s, i) => (
            <div key={s.number} className="flex items-center gap-2 text-sm glass-inset p-2">
              <span className="text-xs text-[var(--color-muted)] w-4">{i + 1}</span>
              <NumberBall number={s.number} size="sm" />
              <span className="font-mono text-xs">{s.currentMiss}期</span>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}
