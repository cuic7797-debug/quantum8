import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';
import { calcACValue, tailAnalysis, relationTrend, spanDistribution, sumProbabilityRange } from '@quantum8/algorithm';

export default function AdvancedAnalysis() {
  const { draws } = useDraws(50);
  const { stats } = useNumberStats();
  const [tab, setTab] = useState<'ac' | '012' | 'tail' | 'relation' | 'span' | 'sum'>('ac');
  if (!draws.length || !stats.length) return null;

  const tabs = [
    { key: 'ac' as const, label: 'AC值', icon: '🔢' },
    { key: '012' as const, label: '012路', icon: '🛣️' },
    { key: 'tail' as const, label: '尾数', icon: '🔤' },
    { key: 'relation' as const, label: '重号邻号', icon: '🔗' },
    { key: 'span' as const, label: '跨度', icon: '↕️' },
    { key: 'sum' as const, label: '和值区间', icon: '➕' },
  ];

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <h3 className="font-semibold">📊 专业数据分析</h3>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ' + (tab === t.key ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-bg)] text-[var(--color-muted)]')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* AC值 */}
      {tab === 'ac' && (
        <div className="space-y-3">
          <div className="bg-[var(--color-bg)] rounded-lg p-3 text-xs text-[var(--color-muted)]">
            AC值 = 不同差值个数 - (号码数-1)，越大越分散
          </div>
          <div className="space-y-1.5">
            {draws.slice(0, 15).map(d => {
              const ac = calcACValue(d.numbers);
              return (
                <div key={d.draw_number} className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[var(--color-muted)] w-10">{d.draw_number.slice(-3)}</span>
                  <div className="flex-1 h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: Math.min(100, ac / 15 * 100) + '%' }} />
                  </div>
                  <span className="text-xs font-mono w-6 text-right">{ac}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 012路 */}
      {tab === '012' && (
        <div className="space-y-2">
          {draws.slice(0, 12).map(d => {
            const road = [0, 0, 0];
            d.numbers.forEach(n => road[n % 3]++);
            return (
              <div key={d.draw_number} className="flex items-center gap-1">
                <span className="text-[10px] font-mono text-[var(--color-muted)] w-8">{d.draw_number.slice(-3)}</span>
                <div className="flex-1 flex h-5 rounded overflow-hidden">
                  <div className="bg-blue-500 flex items-center justify-center text-[9px] text-white" style={{ width: (road[0] / 20 * 100) + '%' }}>{road[0]}</div>
                  <div className="bg-emerald-500 flex items-center justify-center text-[9px] text-white" style={{ width: (road[1] / 20 * 100) + '%' }}>{road[1]}</div>
                  <div className="bg-amber-500 flex items-center justify-center text-[9px] text-white" style={{ width: (road[2] / 20 * 100) + '%' }}>{road[2]}</div>
                </div>
                <span className="text-[9px] font-mono w-14 text-right text-[var(--color-muted)]">{road[0]}:{road[1]}:{road[2]}</span>
              </div>
            );
          })}
          <div className="flex gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> 0路(余0)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> 1路(余1)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> 2路(余2)</span>
          </div>
        </div>
      )}

      {/* 尾数分析 */}
      {tab === 'tail' && (() => {
        const tails = tailAnalysis(draws, 20);
        const maxFreq = Math.max(...tails.map(t => t.frequency));
        return (
          <div className="space-y-1.5">
            {tails.map(t => (
              <div key={t.tail} className="flex items-center gap-2">
                <span className="text-xs font-bold w-6">{t.tail}尾</span>
                <div className="flex-1 h-3 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: (t.frequency / maxFreq * 100) + '%' }} />
                </div>
                <span className="text-[10px] font-mono w-10 text-right">{t.frequency}%</span>
                <span className="text-[10px] font-mono w-8 text-right text-[var(--color-muted)]">漏{t.currentMiss}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* 重号邻号跳号 */}
      {tab === 'relation' && (() => {
        const rels = relationTrend(draws);
        return (
          <div className="space-y-1.5">
            {rels.slice(0, 15).map((r, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="font-mono text-[var(--color-muted)] w-10">{draws[i]?.draw_number.slice(-3)}</span>
                <div className="flex-1 flex h-4 rounded overflow-hidden">
                  <div className="bg-emerald-500" style={{ width: (r.repeatCount / 20 * 100) + '%' }} title={'重号:' + r.repeatCount} />
                  <div className="bg-amber-500" style={{ width: (r.neighborCount / 20 * 100) + '%' }} title={'邻号:' + r.neighborCount} />
                  <div className="bg-blue-500" style={{ width: (r.skipCount / 20 * 100) + '%' }} title={'跳号:' + r.skipCount} />
                </div>
                <span className="w-16 text-right text-[var(--color-muted)]">
                  <span className="text-emerald-400">{r.repeatCount}</span>/
                  <span className="text-amber-400">{r.neighborCount}</span>/
                  <span className="text-blue-400">{r.skipCount}</span>
                </span>
              </div>
            ))}
            <div className="flex gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> 重号</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" /> 邻号</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> 跳号</span>
            </div>
          </div>
        );
      })()}

      {/* 跨度分布 */}
      {tab === 'span' && (() => {
        const sd = spanDistribution(draws, 30);
        const maxH = Math.max(...sd.histogram);
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[var(--color-bg)] rounded-lg p-2 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">平均跨度</div>
                <div className="font-bold font-mono">{sd.avg}</div>
              </div>
              <div className="bg-[var(--color-bg)] rounded-lg p-2 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">范围</div>
                <div className="font-bold font-mono">{sd.min}-{sd.max}</div>
              </div>
              <div className="bg-[var(--color-bg)] rounded-lg p-2 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">趋势</div>
                <div className={'font-bold ' + (sd.trend === '增大' ? 'text-emerald-400' : sd.trend === '减小' ? 'text-red-400' : 'text-[var(--color-muted)]')}>{sd.trend}</div>
              </div>
            </div>
            <div className="flex items-end gap-0.5 h-20">
              {sd.histogram.slice(0, 40).map((count, i) => (
                <div key={i} className="flex-1 bg-emerald-500/60 rounded-t" style={{ height: maxH > 0 ? (count / maxH * 100) + '%' : '2%' }} />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-[var(--color-muted)]"><span>{sd.min}</span><span>{sd.max}</span></div>
          </div>
        );
      })()}

      {/* 和值概率区间 */}
      {tab === 'sum' && (() => {
        const sr = sumProbabilityRange(draws, 20);
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[var(--color-bg)] rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">平均和值</div>
                <div className="font-bold font-mono text-lg">{sr.avg}</div>
              </div>
              <div className="bg-[var(--color-bg)] rounded-lg p-2.5 text-center">
                <div className="text-[10px] text-[var(--color-muted)]">标准差</div>
                <div className="font-bold font-mono text-lg">{sr.std}</div>
              </div>
            </div>
            <div className="bg-[var(--color-bg)] rounded-lg p-3">
              <div className="text-xs font-semibold mb-2">概率区间</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-muted)] w-16">68%区间</span>
                  <div className="flex-1 h-4 bg-[var(--color-border)] rounded relative">
                    <div className="absolute h-full bg-emerald-500/40 rounded" style={{
                      left: ((sr.range68[0] - 100) / 8) + '%',
                      width: ((sr.range68[1] - sr.range68[0]) / 8) + '%',
                    }} />
                  </div>
                  <span className="text-[10px] font-mono w-16 text-right">{sr.range68[0]}-{sr.range68[1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-muted)] w-16">95%区间</span>
                  <div className="flex-1 h-4 bg-[var(--color-border)] rounded relative">
                    <div className="absolute h-full bg-amber-500/30 rounded" style={{
                      left: ((sr.range95[0] - 100) / 8) + '%',
                      width: ((sr.range95[1] - sr.range95[0]) / 8) + '%',
                    }} />
                  </div>
                  <span className="text-[10px] font-mono w-16 text-right">{sr.range95[0]}-{sr.range95[1]}</span>
                </div>
              </div>
              <div className="text-[10px] text-[var(--color-muted)] mt-2">* 仅基于历史分布统计，不代表预测</div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
