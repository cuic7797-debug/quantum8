import { useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';

interface Props { draws: Draw[]; }

interface Anomaly {
  type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  drawNumber?: string;
}

export default function AnomalyDetector({ draws }: Props) {
  const anomalies = useMemo(() => {
    if (draws.length < 20) return [];
    const results: Anomaly[] = [];
    const recent = draws.slice(0, 30);

    // 1. Sum value spikes
    const sums = recent.map(d => d.sum_value);
    const avgSum = sums.reduce((a, b) => a + b, 0) / sums.length;
    const stdSum = Math.sqrt(sums.reduce((s, x) => s + Math.pow(x - avgSum, 2), 0) / sums.length);
    recent.forEach(d => {
      if (Math.abs(d.sum_value - avgSum) > 2 * stdSum) {
        results.push({
          type: 'sum_spike',
          severity: Math.abs(d.sum_value - avgSum) > 3 * stdSum ? 'high' : 'medium',
          title: '\u548C\u503C\u5F02\u5E38: ' + d.sum_value,
          description: '\u504F\u79BB\u5747\u503C ' + (d.sum_value - avgSum).toFixed(0) + '\uFF08\u5747\u503C ' + avgSum.toFixed(0) + '\uFF0C\u6807\u51C6\u5DEE ' + stdSum.toFixed(0) + '\uFF09',
          drawNumber: d.draw_number,
        });
      }
    });

    // 2. Consecutive burst
    let consecBurst = 0;
    recent.forEach(d => { if (d.consecutive_count >= 3) consecBurst++; });
    if (consecBurst >= 3) {
      results.push({
        type: 'consecutive_burst',
        severity: consecBurst >= 5 ? 'high' : 'medium',
        title: '\u8FDE\u53F7\u7206\u53D1: \u8FD130\u671F\u4E2D' + consecBurst + '\u671F\u542B3+\u8FDE\u53F7',
        description: '\u8FDE\u53F7\u51FA\u73B0\u9891\u7387\u5F02\u5E38\u504F\u9AD8\uFF0C\u53EF\u80FD\u8FDB\u5165\u8FDE\u53F7\u6D3B\u8DC3\u671F',
      });
    }

    // 3. Zone imbalance
    const zoneTotals = [0, 0, 0, 0];
    recent.slice(0, 10).forEach(d => {
      zoneTotals[0] += d.zone1_count;
      zoneTotals[1] += d.zone2_count;
      zoneTotals[2] += d.zone3_count;
      zoneTotals[3] += d.zone4_count;
    });
    const totalNums = 10 * 20;
    const zoneNames = ['\u4E00\u533A', '\u4E8C\u533A', '\u4E09\u533A', '\u56DB\u533A'];
    const zoneRanges = ['\u4E00\u533A(1-20)', '\u4E8C\u533A(21-40)', '\u4E09\u533A(41-60)', '\u56DB\u533A(61-80)'];
    zoneTotals.forEach((z, i) => {
      const ratio = z / totalNums;
      if (ratio > 0.35 || ratio < 0.15) {
        results.push({
          type: 'zone_imbalance',
          severity: ratio > 0.4 || ratio < 0.1 ? 'high' : 'medium',
          title: zoneNames[i] + '\u504F\u6001: ' + (ratio * 100).toFixed(1) + '%',
          description: zoneRanges[i] + '\u51FA\u73B0\u6BD4\u4F8B' + (ratio > 0.25 ? '\u504F\u9AD8' : '\u504F\u4F4E') + '\uFF0C\u6B63\u5E38\u8303\u56F420-30%',
        });
      }
    });

    // 4. Odd/even skew
    const oddCounts = recent.slice(0, 10).map(d => d.odd_count);
    const avgOdd = oddCounts.reduce((a, b) => a + b, 0) / oddCounts.length;
    if (avgOdd > 14 || avgOdd < 6) {
      const skewLabel = avgOdd > 10 ? '\u504F\u5947' : '\u504F\u5076';
      results.push({
        type: 'odd_even_skew',
        severity: avgOdd > 16 || avgOdd < 4 ? 'high' : 'medium',
        title: '\u5947\u5076\u504F\u6001: \u5E73\u5747' + avgOdd.toFixed(1) + '\u5947',
        description: '\u8FD110\u671F\u5E73\u5747\u5947\u6570' + avgOdd.toFixed(1) + '\u4E2A\uFF0C' + skewLabel + '\uFF0C\u6B63\u5E38\u8303\u56F48-12',
      });
    }

    // 5. Repeat cluster
    let highRepeat = 0;
    recent.slice(0, 10).forEach(d => { if (d.repeat_count >= 5) highRepeat++; });
    if (highRepeat >= 3) {
      results.push({
        type: 'repeat_cluster',
        severity: highRepeat >= 5 ? 'high' : 'medium',
        title: '\u91CD\u53F7\u805A\u96C6: \u8FD110\u671F\u4E2D' + highRepeat + '\u671F\u91CD\u53F7\u22655\u4E2A',
        description: '\u91CD\u53F7\u51FA\u73B0\u9891\u7387\u504F\u9AD8\uFF0C\u4E0B\u671F\u91CD\u53F7\u6982\u7387\u53EF\u80FD\u964D\u4F4E',
      });
    }

    return results.sort((a, b) => {
      const sev: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (sev[b.severity] || 0) - (sev[a.severity] || 0);
    });
  }, [draws]);

  if (!anomalies.length) return null;

  const sevColors: Record<string, string> = {
    high: 'text-red-400 bg-red-500/15',
    medium: 'text-amber-400 bg-amber-500/15',
    low: 'text-blue-400 bg-blue-500/15',
  };
  const sevLabels: Record<string, string> = {
    high: '\uD83D\uDD34 \u9AD8',
    medium: '\uD83D\uDFE1 \u4E2D',
    low: '\uD83D\uDD35 \u4F4E',
  };

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">{"\u26A1 \u5F02\u5E38\u68C0\u6D4B"}</h3>
      <div className="space-y-2">
        {anomalies.map((a, i) => (
          <div key={i} className="glass-inset p-3 flex items-start gap-3">
            <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${sevColors[a.severity]}`}>
              {sevLabels[a.severity]}
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold">{a.title}</div>
              <div className="text-xs text-[var(--color-muted)] mt-0.5">{a.description}</div>
              {a.drawNumber && <div className="text-xs text-[var(--color-muted)]">{"\u671F\u53F7: " + a.drawNumber}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
