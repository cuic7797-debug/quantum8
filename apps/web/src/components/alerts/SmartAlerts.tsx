import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'opportunity';
  title: string;
  detail: string;
  numbers?: number[];
}

export default function SmartAlerts() {
  const { draws } = useDraws(50);
  const { stats } = useNumberStats();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (draws.length < 10 || !stats.length) return null;

  const alerts: Alert[] = [];
  const recent10 = draws.slice(0, 10);
  const recent5 = draws.slice(0, 5);

  const overdue = stats.filter(s => s.currentMiss >= 15).sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 5);
  if (overdue.length > 0) {
    alerts.push({
      id: 'overdue', type: 'opportunity',
      title: '⚡ ' + overdue.length + '个号码深度遗漏',
      detail: overdue.map(s => s.number + '号(' + s.currentMiss + '期)').join('、') + ' 遗漏值偏高，存在回补可能',
      numbers: overdue.map(s => s.number),
    });
  }

  const hotStreak = stats.filter(s => s.recent10Rate >= 50).sort((a, b) => b.recent10Rate - a.recent10Rate).slice(0, 5);
  if (hotStreak.length > 0) {
    alerts.push({
      id: 'hotstreak', type: 'info',
      title: '🔥 ' + hotStreak.length + '个号码持续走热',
      detail: hotStreak.map(s => s.number + '号(' + s.recent10Rate + '%)').join('、') + ' 近10期出现频率偏高',
      numbers: hotStreak.map(s => s.number),
    });
  }

  const zones = [0, 0, 0, 0];
  recent5.forEach(d => { zones[0] += d.zone1_count; zones[1] += d.zone2_count; zones[2] += d.zone3_count; zones[3] += d.zone4_count; });
  const totalN = recent5.length * 20;
  const maxZone = Math.max(...zones);
  const minZone = Math.min(...zones);
  if (maxZone - minZone > totalN * 0.15) {
    const heavy = zones.indexOf(maxZone) + 1;
    const light = zones.indexOf(minZone) + 1;
    alerts.push({
      id: 'zone', type: 'warning',
      title: '⚠️ 四区分布不均',
      detail: '近5期' + heavy + '区偏重(' + maxZone + '个)、' + light + '区偏冷(' + minZone + '个)',
    });
  }

  const consecCount = recent10.filter(d => d.consecutive_count >= 3).length;
  if (consecCount >= 4) {
    alerts.push({
      id: 'consec', type: 'info',
      title: '🔗 连号频率偏高',
      detail: '近10期有' + consecCount + '期出现3组以上连号',
    });
  }

  const sumAvg = recent10.reduce((a, d) => a + d.sum_value, 0) / recent10.length;
  const latestSum = recent5[0].sum_value;
  if (latestSum > sumAvg * 1.3 || latestSum < sumAvg * 0.7) {
    alerts.push({
      id: 'sum', type: 'warning',
      title: '📊 和值异常偏离',
      detail: '最新一期和值' + latestSum + '，近10期均值' + Math.round(sumAvg) + '，偏离' + ((latestSum / sumAvg - 1) * 100).toFixed(0) + '%',
    });
  }

  const latestRepeat = recent5[0].repeat_count;
  const avgRepeat = recent10.reduce((a, d) => a + d.repeat_count, 0) / recent10.length;
  if (latestRepeat >= 5 && latestRepeat > avgRepeat * 1.5) {
    alerts.push({
      id: 'repeat', type: 'info',
      title: '🔄 重号数量偏多',
      detail: '最新一期' + latestRepeat + '个重号，近10期均值' + avgRepeat.toFixed(1) + '个',
    });
  }

  const bigRatio = recent5[0].big_count / 20;
  if (bigRatio >= 0.7 || bigRatio <= 0.3) {
    alerts.push({
      id: 'bigsmall', type: 'warning',
      title: '⚖️ 大小号严重偏态',
      detail: '最新一期大小比' + recent5[0].big_count + ':' + recent5[0].small_count,
    });
  }

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">🚨 智能预警</h3>
        <span className="text-xs text-[var(--color-muted)]">{visible.length}条预警</span>
      </div>
      {visible.map(alert => (
        <div key={alert.id} className={'rounded-lg p-3 flex items-start gap-3 ' + (
          alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
          alert.type === 'opportunity' ? 'bg-emerald-500/10 border border-emerald-500/20' :
          'bg-blue-500/10 border border-blue-500/20'
        )}>
          <div className="flex-1">
            <div className="text-sm font-semibold">{alert.title}</div>
            <div className="text-xs text-[var(--color-muted)] mt-1">{alert.detail}</div>
            {alert.numbers && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {alert.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}
              </div>
            )}
          </div>
          <button onClick={() => setDismissed(prev => new Set([...prev, alert.id]))}
            className="text-[var(--color-muted)] hover:text-white text-xs shrink-0">✕</button>
        </div>
      ))}
      <div className="text-xs text-[var(--color-muted)] text-center">预警基于历史数据统计分析，仅供参考</div>
    </div>
  );
}
