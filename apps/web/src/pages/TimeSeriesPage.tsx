import { useState, useMemo } from 'react';
import { useDraws } from '@/hooks/useDraws';
import Collapsible from '@/components/common/Collapsible';
import PeriodSelector from '@/components/common/PeriodSelector';
import { autocorrelation, decompose, bollingerBands, movingAverage } from '@quantum8/algorithm';
import { t } from '@/hooks/useI18n';

export default function TimeSeriesPage() {
  const { draws, loading: ld } = useDraws(200);
  const [period, setPeriod] = useState(100);
  const [selectedMetric, setSelectedMetric] = useState<'sum' | 'odd' | 'span'>('sum');

  const chartHeight = 200;
  const chartWidth = 800;

  const metricLabels = { sum: '和值', odd: '奇数个数', span: '跨度' };

  const recentDraws = useMemo(() => {
    if (!draws.length) return [];
    return draws.slice(0, period).reverse();
  }, [draws, period]);

  const metrics = useMemo(() => {
    return recentDraws.map(d => ({
      sum: d.sum_value,
      odd: d.odd_count,
      span: d.span,
    }));
  }, [recentDraws]);

  const data = useMemo(() => metrics.map(m => m[selectedMetric]), [metrics, selectedMetric]);
  const labels = useMemo(() => recentDraws.map(d => d.draw_number), [recentDraws]);

  const acf = useMemo(() => autocorrelation(data, 30), [data]);
  const decomposition = useMemo(() => decompose(data, 7), [data]);
  const bb = useMemo(() => bollingerBands(data, 20, 2), [data]);
  const ma5 = useMemo(() => movingAverage(data, 5), [data]);
  const ma10 = useMemo(() => movingAverage(data, 10), [data]);
  const ma20 = useMemo(() => movingAverage(data, 20), [data]);

  const dataMin = useMemo(() => data.length ? Math.min(...data) : 0, [data]);
  const dataMax = useMemo(() => data.length ? Math.max(...data) : 100, [data]);
  const dataPadding = (dataMax - dataMin) * 0.1;
  const yMin = dataMin - dataPadding;
  const yMax = dataMax + dataPadding;

  function dataToPath(values: number[], yLow: number, yHigh: number): string {
    if (!values.length) return '';
    const range = yHigh - yLow || 1;
    return values.map((v, i) => {
      const x = (i / (values.length - 1)) * chartWidth;
      const y = chartHeight - ((v - yLow) / range) * chartHeight;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    }).join(' ');
  }

  if (ld) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-primary">📈 时间序列分析</h2>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="glass-card p-3 flex gap-2">
        {(['sum', 'odd', 'span'] as const).map(m => (
          <button key={m} onClick={() => setSelectedMetric(m)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              selectedMetric === m
                ? 'bg-[var(--color-primary)] text-white shadow'
                : 'glass-inset text-[var(--color-muted)] hover:bg-white/10'
            }`}>
            {metricLabels[m]}
          </button>
        ))}
      </div>

      <Collapsible title={`📊 ${metricLabels[selectedMetric]}走势 + 布林带`} step={1}>
        <div className="glass-inset p-3 overflow-x-auto">
          <svg viewBox={`-30 -10 ${chartWidth + 40} ${chartHeight + 40}`} className="w-full" style={{ minWidth: 400 }}>
            {[0, 0.25, 0.5, 0.75, 1].map(p => {
              const y = chartHeight * p;
              const val = yMax - (yMax - yMin) * p;
              return (
                <g key={p}>
                  <line x1={0} y1={y} x2={chartWidth} y2={y} stroke="rgba(148,163,184,0.08)" />
                  <text x={-5} y={y + 3} textAnchor="end" fill="#64748b" fontSize={8}>{Math.round(val)}</text>
                </g>
              );
            })}
            <path d={dataToPath(bb.upper, yMin, yMax)} fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth={1} />
            <path d={dataToPath(bb.lower, yMin, yMax)} fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth={1} />
            <path d={dataToPath(bb.middle, yMin, yMax)} fill="none" stroke="rgba(139,92,246,0.5)" strokeWidth={1} strokeDasharray="4,4" />
            <path d={dataToPath(data, yMin, yMax)} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
            <path d={dataToPath(ma5, yMin, yMax)} fill="none" stroke="#10b981" strokeWidth={1} opacity={0.7} />
            <path d={dataToPath(ma10, yMin, yMax)} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.7} />
            <path d={dataToPath(ma20, yMin, yMax)} fill="none" stroke="#ef4444" strokeWidth={1} opacity={0.7} />
            {data.map((v, i) => {
              const x = (i / (data.length - 1)) * chartWidth;
              const y = chartHeight - ((v - yMin) / (yMax - yMin)) * chartHeight;
              return <circle key={i} cx={x} cy={y} r={2} fill="#3b82f6" />;
            })}
            {data.filter((_, i) => i % Math.ceil(data.length / 8) === 0).map((_, idx) => {
              const i = idx * Math.ceil(data.length / 8);
              const x = (i / (data.length - 1)) * chartWidth;
              return (
                <text key={i} x={x} y={chartHeight + 15} textAnchor="middle" fill="#64748b" fontSize={7}>
                  {labels[i]?.slice(-4)}
                </text>
              );
            })}
          </svg>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-xs">
          <span className="text-blue-400">● 数据</span>
          <span className="text-emerald-400">● MA5</span>
          <span className="text-amber-400">● MA10</span>
          <span className="text-red-400">● MA20</span>
          <span className="text-purple-400">● 布林带</span>
        </div>
      </Collapsible>

      <Collapsible title="📉 趋势分解（趋势 + 季节 + 残差）" step={2}>
        <div className="space-y-3">
          {[
            { label: '趋势分量', d: decomposition.trend, color: '#3b82f6', desc: '长期趋势方向' },
            { label: '季节分量', d: decomposition.seasonal, color: '#10b981', desc: `周期=${decomposition.period}期的循环模式` },
            { label: '残差分量', d: decomposition.residual, color: '#f59e0b', desc: '随机波动部分' },
          ].map(({ label, d, color, desc }) => {
            const dMin = d.length ? Math.min(...d) : 0;
            const dMax = d.length ? Math.max(...d) : 1;
            return (
              <div key={label} className="glass-inset p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-sm text-[var(--color-muted)]">{desc}</span>
                </div>
                <svg viewBox={`0 0 ${chartWidth} 60`} className="w-full" style={{ minWidth: 300 }}>
                  <line x1={0} y1={30} x2={chartWidth} y2={30} stroke="rgba(148,163,184,0.1)" strokeDasharray="4,4" />
                  <path d={d.map((v, i) => {
                    const x = (i / (d.length - 1 || 1)) * chartWidth;
                    const range = (dMax - dMin) / 2 || 1;
                    const y = 30 - ((v - (dMax + dMin) / 2) / range) * 25;
                    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                  }).join(' ')} fill="none" stroke={color} strokeWidth={1.5} />
                </svg>
              </div>
            );
          })}
        </div>
      </Collapsible>

      <Collapsible title="🔗 自相关分析" step={3} defaultOpen={false}>
        <div className="glass-inset p-3 overflow-x-auto">
          <svg viewBox={`-30 -10 ${chartWidth + 40} ${chartHeight + 40}`} className="w-full" style={{ minWidth: 400 }}>
            <line x1={0} y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="rgba(148,163,184,0.2)" />
            <line x1={0} y1={chartHeight * 0.28} x2={chartWidth} y2={chartHeight * 0.28} stroke="rgba(239,68,68,0.3)" strokeDasharray="4,4" />
            <line x1={0} y1={chartHeight * 0.72} x2={chartWidth} y2={chartHeight * 0.72} stroke="rgba(239,68,68,0.3)" strokeDasharray="4,4" />
            {acf.acf.map((v, i) => {
              const x = (i / (acf.acf.length - 1 || 1)) * chartWidth;
              const barHeight = Math.abs(v) * chartHeight * 0.45;
              const y = v >= 0 ? chartHeight / 2 - barHeight : chartHeight / 2;
              const isSignificant = acf.significantLags.includes(acf.lags[i]);
              return (
                <rect key={i} x={x - 4} y={y} width={8} height={Math.max(barHeight, 1)}
                  fill={isSignificant ? '#3b82f6' : 'rgba(148,163,184,0.3)'}
                  rx={2} />
              );
            })}
            {acf.lags.filter((_, i) => i % 5 === 0).map((lag, i) => {
              const x = (lag / (acf.lags.length || 1)) * chartWidth;
              return <text key={i} x={x} y={chartHeight + 15} textAnchor="middle" fill="#64748b" fontSize={8}>{lag}</text>;
            })}
          </svg>
        </div>
        <div className="mt-2 text-sm text-[var(--color-muted)]">
          {acf.period ? (
            <span>检测到周期性: <span className="font-bold text-[var(--color-primary)]">{acf.period}期</span>，可能存在{acf.period}期的循环规律</span>
          ) : (
            <span>未检测到显著周期性</span>
          )}
          <span className="ml-2">| 显著滞后阶: {acf.significantLags.slice(0, 5).join(', ') || '无'}</span>
        </div>
      </Collapsible>

      <Collapsible title="📊 统计摘要" step={4} defaultOpen={false}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: '均值', value: data.length ? (data.reduce((a, b) => a + b, 0) / data.length).toFixed(1) : 'N/A' },
            { label: '标准差', value: data.length ? Math.sqrt(data.reduce((s, x) => { const m = data.reduce((a, b) => a + b, 0) / data.length; return s + Math.pow(x - m, 2); }, 0) / data.length).toFixed(1) : 'N/A' },
            { label: '最大值', value: data.length ? Math.max(...data).toString() : 'N/A' },
            { label: '最小值', value: data.length ? Math.min(...data).toString() : 'N/A' },
            { label: '偏度', value: data.length > 2 ? (() => {
              const mean = data.reduce((a, b) => a + b, 0) / data.length;
              const std = Math.sqrt(data.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / data.length);
              return std > 0 ? (data.reduce((s, x) => s + Math.pow((x - mean) / std, 3), 0) / data.length).toFixed(2) : '0';
            })() : 'N/A' },
            { label: '峰度', value: data.length > 2 ? (() => {
              const mean = data.reduce((a, b) => a + b, 0) / data.length;
              const std = Math.sqrt(data.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / data.length);
              return std > 0 ? (data.reduce((s, x) => s + Math.pow((x - mean) / std, 4), 0) / data.length - 3).toFixed(2) : '0';
            })() : 'N/A' },
            { label: '布林带宽', value: bb.bandwidth.length ? (bb.bandwidth[bb.bandwidth.length - 1]?.toFixed(1) + '%') : 'N/A' },
            { label: '数据点', value: data.length + '期' },
          ].map(s => (
            <div key={s.label} className="glass-inset p-3 text-center">
              <div className="text-sm text-[var(--color-muted)]">{s.label}</div>
              <div className="font-bold font-mono text-sm mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      </Collapsible>
    </div>
  );
}
