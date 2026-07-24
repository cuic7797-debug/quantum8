import { useDraws } from '@/hooks/useDraws';

export default function TrendAnalysis() {
  const { draws } = useDraws(50);
  if (draws.length < 10) return null;

  const recent30 = draws.slice(0, 30);

  // Moving averages for sum
  const sums = recent30.map(d => d.sum_value);
  const ma5 = sums.slice(0, 26).map((_, i) => sums.slice(i, i + 5).reduce((a, b) => a + b, 0) / 5);
  const ma10 = sums.slice(0, 21).map((_, i) => sums.slice(i, i + 10).reduce((a, b) => a + b, 0) / 10);

  // Odd/Even trend
  const odds = recent30.map(d => d.odd_count);

  // Big/Small trend
  const bigs = recent30.map(d => d.big_count);

  // Zone distribution trend
  const zone1s = recent30.map(d => d.zone1_count);
  const zone2s = recent30.map(d => d.zone2_count);
  const zone3s = recent30.map(d => d.zone3_count);
  const zone4s = recent30.map(d => d.zone4_count);

  // Span trend
  const spans = recent30.map(d => d.span);

  // Consecutive number trend
  const concs = recent30.map(d => d.consecutive_count);

  // Statistical analysis
  const sumAvg = Math.round(sums.reduce((a, b) => a + b, 0) / sums.length);
  const sumStd = Math.sqrt(sums.reduce((a, s) => a + Math.pow(s - sumAvg, 2), 0) / sums.length);
  const oddAvg = (odds.reduce((a, b) => a + b, 0) / odds.length).toFixed(1);
  const bigAvg = (bigs.reduce((a, b) => a + b, 0) / bigs.length).toFixed(1);
  const avgConsec = (concs.reduce((a, b) => a + b, 0) / concs.length).toFixed(1);

  // Trend strength (0-100)
  const sumSlope = (sums[0] - sums[Math.min(9, sums.length - 1)]) / 10;
  const trendStrength = Math.min(100, Math.abs(sumSlope) * 2);
  const trendDir = sumSlope > 5 ? '上升' : sumSlope < -5 ? '下降' : '平稳';

  // Volatility
  const volatility = sumStd < 80 ? '低' : sumStd < 150 ? '中' : '高';

  const features = [
    { label: '和值均线 MA5', values: ma5.slice(0, 15), color: 'bg-amber-500', min: Math.min(...sums), max: Math.max(...sums) },
    { label: '和值均线 MA10', values: ma10.slice(0, 15), color: 'bg-blue-500', min: Math.min(...sums), max: Math.max(...sums) },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      <div>
        <h3 className="font-semibold">📈 高级趋势分析</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">移动均线 · 多维度趋势 · 波动分析</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: '和值均值', value: '' + sumAvg, sub: '标准差 ' + sumStd.toFixed(0) },
          { label: '奇数均值', value: oddAvg + '/20', sub: '近30期' },
          { label: '大号均值', value: bigAvg + '/20', sub: '近30期' },
          { label: '连号均值', value: avgConsec, sub: '每期' },
          { label: '趋势方向', value: trendDir, sub: '强度 ' + trendStrength.toFixed(0) + '%' },
        ].map(f => (
          <div key={f.label} className="glass-inset p-2.5 text-center">
            <div className="text-xs text-[var(--color-muted)]">{f.label}</div>
            <div className="font-mono font-bold text-sm mt-0.5">{f.value}</div>
            <div className="text-xs text-[var(--color-muted)] opacity-60">{f.sub}</div>
          </div>
        ))}
      </div>

      {/* Sum trend with MA lines */}
      <div className="glass-inset p-4">
        <div className="text-xs text-[var(--color-muted)] mb-2">和值走势 + 移动均线</div>
        <div className="flex items-end gap-0.5 h-28">
          {sums.slice(0, 15).reverse().map((s, i) => {
            const min = Math.min(...sums.slice(0, 15));
            const max = Math.max(...sums.slice(0, 15));
            const range = max - min || 1;
            const h = ((s - min) / range) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 relative">
                {ma5[14 - i] !== undefined && (
                  <div className="absolute bottom-0 w-full flex justify-center">
                    <div className="w-0.5 bg-amber-400 rounded-full" style={{ height: `${((ma5[14 - i] - min) / range) * 100}%` }} />
                  </div>
                )}
                <div className="w-full bg-[var(--color-primary)]/60 rounded-t" style={{ height: `${Math.max(3, h)}%` }} />
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-[var(--color-primary)]/60" /> 和值</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-400" /> MA5</span>
        </div>
      </div>

      {/* Odd/Even + Big/Small */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-inset p-4">
          <div className="text-xs text-[var(--color-muted)] mb-2">奇偶比趋势</div>
          <div className="space-y-0.5">
            {odds.slice(0, 12).map((o, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <span className="w-4 text-[var(--color-muted)] font-mono">{recent30[i]?.draw_number.slice(-2)}</span>
                <div className="flex-1 flex h-3 rounded overflow-hidden">
                  <div className="bg-purple-500" style={{ width: (o / 20 * 100) + '%' }} />
                  <div className="bg-cyan-500" style={{ width: ((20 - o) / 20 * 100) + '%' }} />
                </div>
                <span className="w-8 text-right text-[var(--color-muted)]">{o}:{20 - o}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" /> 奇</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-cyan-500" /> 偶</span>
          </div>
        </div>

        <div className="glass-inset p-4">
          <div className="text-xs text-[var(--color-muted)] mb-2">连号/跨度趋势</div>
          <div className="space-y-0.5">
            {concs.slice(0, 12).map((c, i) => (
              <div key={i} className="flex items-center gap-1 text-xs">
                <span className="w-4 text-[var(--color-muted)] font-mono">{recent30[i]?.draw_number.slice(-2)}</span>
                <div className="flex-1 h-3 bg-[var(--color-border)] rounded overflow-hidden flex">
                  <div className="bg-orange-500/70" style={{ width: Math.min(100, c * 20) + '%' }} />
                </div>
                <span className="w-8 text-right text-[var(--color-muted)]">连{c}</span>
                <span className="w-10 text-right text-[var(--color-muted)]">跨{spans[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Zone distribution mini heatmap */}
      <div className="glass-inset p-4">
        <div className="text-xs text-[var(--color-muted)] mb-2">四区分布热力图</div>
        <div className="grid grid-cols-4 gap-1">
          {['一区', '二区', '三区', '四区'].map((z, zi) => (
            <div key={z} className="text-center">
              <div className="text-xs text-[var(--color-muted)] mb-1">{z}</div>
              {recent30.slice(0, 10).map((d, i) => {
                const vals = [d.zone1_count, d.zone2_count, d.zone3_count, d.zone4_count];
                const v = vals[zi];
                const intensity = Math.min(1, v / 8);
                return (
                  <div key={i} className="h-3 rounded-sm mb-0.5"
                    style={{ backgroundColor: `hsl(235, 85%, ${Math.round(25 + intensity * 45)}%)` }}
                    title={d.draw_number + ': ' + v + '个'} />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[var(--color-muted)] mt-1">
          <span>10期前</span><span>最新</span>
        </div>
      </div>

      <div className="text-xs text-[var(--color-muted)] text-center">波动性: {volatility} · 以上分析基于近30期数据</div>
    </div>
  );
}
