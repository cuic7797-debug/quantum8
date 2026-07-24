import { useMemo } from 'react';
import type { Draw } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

interface Props {
  draws: Draw[];
  number?: number;
}

export default function CalendarHeatmap({ draws, number }: Props) {
  const data = useMemo(() => {
    if (!draws.length) return { cells: [], months: [], maxFreq: 1 };
    
    // Build date -> numbers map
    const dateMap = new Map<string, Set<number>>();
    draws.forEach(d => {
      dateMap.set(d.draw_date, new Set(d.numbers));
    });

    // Get date range (last 90 days)
    const sortedDates = draws.map(d => d.draw_date).sort();
    const lastDate = new Date(sortedDates[sortedDates.length - 1]);
    const firstDate = new Date(lastDate);
    firstDate.setDate(firstDate.getDate() - 89);

    const cells: { date: string; day: number; month: string; count: number; numbers: number[] }[] = [];
    const months: { label: string; x: number }[] = [];
    let lastMonth = '';

    for (let d = new Date(firstDate); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().slice(0, 10);
      const dayNums = dateMap.get(dateStr);
      const count = number ? (dayNums?.has(number) ? 1 : 0) : (dayNums?.size || 0);
      
      const month = d.toLocaleDateString('zh-CN', { month: 'short' });
      if (month !== lastMonth) {
        months.push({ label: month, x: cells.length });
        lastMonth = month;
      }

      cells.push({
        date: dateStr,
        day: d.getDay(),
        month,
        count,
        numbers: dayNums ? [...dayNums] : [],
      });
    }

    const maxFreq = Math.max(...cells.map(c => c.count), 1);
    return { cells, months, maxFreq };
  }, [draws, number]);

  const cellSize = 14;
  const gap = 2;
  const width = 53 * (cellSize + gap);
  const height = 7 * (cellSize + gap);

  function getColor(count: number): string {
    if (count === 0) return 'rgba(148,163,184,0.05)';
    const intensity = count / data.maxFreq;
    if (number) {
      return count > 0 ? '#3b82f6' : 'rgba(148,163,184,0.05)';
    }
    if (intensity < 0.25) return 'rgba(59,130,246,0.15)';
    if (intensity < 0.5) return 'rgba(59,130,246,0.35)';
    if (intensity < 0.75) return 'rgba(59,130,246,0.6)';
    return '#3b82f6';
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">
          📅 出现日历 {number ? `（号码 ${number.toString().padStart(2, '0')}）` : '（全部号码）'}
        </h3>
        <span className="text-[10px] text-[var(--color-muted)]">近90天</span>
      </div>
      
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${width + 30} ${height + 20}`} className="w-full" style={{ minWidth: 300, maxWidth: '100%' }}>
          {/* Month labels */}
          {data.months.map((m, i) => (
            <text key={i} x={m.x * (cellSize + gap) + 30} y={10} fill="#64748b" fontSize={9}>
              {m.label}
            </text>
          ))}

          {/* Day labels */}
          {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
            <text key={i} x={10} y={22 + i * (cellSize + gap) + cellSize / 2} fill="#64748b" fontSize={8} dominantBaseline="middle">
              {i % 2 === 1 ? d : ''}
            </text>
          ))}

          {/* Cells */}
          {data.cells.map((cell, i) => {
            const col = Math.floor(i / 7);
            const row = cell.day;
            const x = col * (cellSize + gap) + 30;
            const y = row * (cellSize + gap) + 16;
            return (
              <rect key={i} x={x} y={y} width={cellSize} height={cellSize} rx={2}
                fill={getColor(cell.count)}
                >
                <title>{cell.date}: {number ? (cell.count > 0 ? '出现' : '未出现') : `${cell.count}个号码`}</title>
              </rect>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--color-muted)]">
        <span>少</span>
        {[0.05, 0.15, 0.35, 0.6, 1].map((intensity, i) => (
          <div key={i} className="w-3 h-3 rounded" style={{ background: number ? (i === 4 ? '#3b82f6' : 'rgba(148,163,184,0.05)') : `rgba(59,130,246,${intensity})` }} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
