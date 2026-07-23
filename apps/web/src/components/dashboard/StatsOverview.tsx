import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';

export default function StatsOverview() {
  const { draws } = useDraws(50);
  const { stats } = useNumberStats();
  if (draws.length < 10 || !stats.length) return null;

  const recent10 = draws.slice(0, 10);
  const hotCount = stats.filter(s => s.hotScore >= 60).length;
  const coldCount = stats.filter(s => s.currentMiss >= 10).length;
  const avgSum = Math.round(recent10.reduce((a, d) => a + d.sum_value, 0) / recent10.length);
  const avgOdd = (recent10.reduce((a, d) => a + d.odd_count, 0) / recent10.length).toFixed(1);

  const totalNums = recent10.length * 20;
  const zones = [0, 0, 0, 0];
  recent10.forEach(d => { zones[0] += d.zone1_count; zones[1] += d.zone2_count; zones[2] += d.zone3_count; zones[3] += d.zone4_count; });
  const zoneStd = Math.sqrt(zones.reduce((s, z) => s + Math.pow(z - totalNums / 4, 2), 0) / 4);
  const zoneScore = Math.max(0, Math.round(100 - zoneStd * 2));

  const uniqueNums = new Set<number>();
  recent10.forEach(d => d.numbers.forEach(n => uniqueNums.add(n)));
  const coverage = Math.round((uniqueNums.size / 80) * 100);

  let totalRepeat = 0;
  recent10.forEach(d => { totalRepeat += d.repeat_count; });
  const avgRepeat = (totalRepeat / recent10.length).toFixed(1);

  const sum5 = recent10.slice(0, 5).reduce((a, d) => a + d.sum_value, 0) / 5;
  const sum5prev = recent10.slice(5, 10).reduce((a, d) => a + d.sum_value, 0) / 5;
  const trendDir = sum5 > sum5prev + 20 ? '上升' : sum5 < sum5prev - 20 ? '下降' : '平稳';

  const metrics = [
    { label: '热号', value: hotCount + '个', icon: '🔥', color: 'text-red-400', glow: 'shadow-red-500/10' },
    { label: '冷号', value: coldCount + '个', icon: '❄️', color: 'text-blue-400', glow: 'shadow-blue-500/10' },
    { label: '均和', value: '' + avgSum, icon: '📊', color: 'text-amber-400', glow: 'shadow-amber-500/10' },
    { label: '奇偶比', value: avgOdd + ':10', icon: '⚖️', color: 'text-purple-400', glow: 'shadow-purple-500/10' },
    { label: '四区均衡', value: zoneScore + '分', icon: '🎯', color: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
    { label: '号码覆盖', value: coverage + '%', icon: '🌐', color: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
    { label: '和值趋势', value: trendDir, icon: '📈', color: trendDir === '上升' ? 'text-emerald-400' : trendDir === '下降' ? 'text-red-400' : 'text-gray-400', glow: 'shadow-green-500/10' },
    { label: '重号均值', value: avgRepeat, icon: '🔄', color: 'text-orange-400', glow: 'shadow-orange-500/10' },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">📊 关键指标仪表盘</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map(m => (
          <div key={m.label} className={`glass-inset p-3 text-center shadow-lg ${m.glow} hover:scale-[1.02] transition-transform duration-200`}>
            <div className="text-lg">{m.icon}</div>
            <div className={`font-bold font-mono text-sm mt-1 ${m.color}`}>{m.value}</div>
            <div className="text-[10px] text-[var(--color-muted)] mt-0.5">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
