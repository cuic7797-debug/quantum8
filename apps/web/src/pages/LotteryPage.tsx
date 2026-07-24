import { useState, useEffect } from 'react';
import { LOTTERY_CONFIGS, type LotteryType } from '@quantum8/types';
import LotterySelector from '@/components/common/LotterySelector';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { getCurrentLottery, fetchLotteryData, saveLotteryDraws, getLotteryDraws } from '@/utils/lotteryData';
import { t } from '@/hooks/useI18n';

export default function LotteryPage() {
  const [lottery, setLottery] = useState<LotteryType>(getCurrentLottery());
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const config = LOTTERY_CONFIGS[lottery];

  useEffect(() => {
    loadDraws();
  }, [lottery]);

  async function loadDraws() {
    setLoading(true);
    const data = await getLotteryDraws(lottery, 100);
    setDraws(data);
    setLoading(false);
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMsg('正在从福彩官网获取数据...');
    try {
      const data = await fetchLotteryData(lottery, 100);
      if (data.length > 0) {
        const result = await saveLotteryDraws(data);
        setSyncMsg(`✅ 同步完成: 新增 ${result.inserted} 期，跳过 ${result.skipped} 期`);
        await loadDraws();
      } else {
        setSyncMsg('⚠️ 未获取到数据，请稍后重试');
      }
    } catch (e) {
      setSyncMsg('❌ 同步失败: ' + (e as Error).message);
    }
    setSyncing(false);
    setTimeout(() => setSyncMsg(''), 5000);
  }

  // Statistics
  const stats = draws.length > 0 ? {
    total: draws.length,
    dateRange: `${draws[draws.length - 1]?.draw_date || ''} ~ ${draws[0]?.draw_date || ''}`,
    avgSum: Math.round(draws.reduce((a, d) => a + d.sum_value, 0) / draws.length),
    // Frequency
    freq: (() => {
      const f = new Map<number, number>();
      draws.forEach(d => d.numbers.forEach((n: number) => f.set(n, (f.get(n) || 0) + 1)));
      return [...f.entries()].sort((a, b) => b[1] - a[1]);
    })(),
  } : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold gradient-text-primary">🎰 多彩票分析</h2>
        <LotterySelector onChange={setLottery} />
      </div>

      {/* Config Card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-4xl">{config.icon}</div>
          <div>
            <h3 className="text-lg font-bold">{config.name}</h3>
            <div className="text-sm text-[var(--color-muted)]">
              {config.mainPick} 个号码 / {config.mainPool} 选 {config.mainPick}
              {config.bonusPick ? ` + ${config.bonusPick} 个特别号 (${config.bonusPool})` : ''}
            </div>
            <div className="text-sm text-[var(--color-muted)] mt-0.5">
              开奖日: {config.drawDays} · 开奖时间: {config.drawTime}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={handleSync} disabled={syncing}
            className="btn-primary text-sm disabled:opacity-50">
            {syncing ? '⏳ 同步中...' : '🔄 同步数据'}
          </button>
          {syncMsg && <span className="text-sm text-[var(--color-muted)]">{syncMsg}</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-muted)]">{t('loading')}</div>
      ) : draws.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <div className="text-4xl mb-3">{config.icon}</div>
          <div className="text-sm text-[var(--color-muted)]">暂无 {config.name} 数据</div>
          <div className="text-sm text-[var(--color-muted)] mt-1">点击上方"同步数据"按钮获取</div>
        </div>
      ) : (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: '总期数', value: stats.total, icon: '📊', color: 'text-blue-400' },
                { label: '平均和值', value: stats.avgSum, icon: '📈', color: 'text-amber-400' },
                { label: '号码范围', value: `${config.mainRange[0]}-${config.mainRange[1]}`, icon: '🎯', color: 'text-emerald-400' },
                { label: '数据范围', value: stats.dateRange.split('~')[1]?.trim() || '', icon: '⏰', color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label} className="glass-card p-3 text-center">
                  <div className="text-lg">{item.icon}</div>
                  <div className={`font-bold font-mono text-sm mt-1 ${item.color}`}>{item.value}</div>
                  <div className="text-sm text-[var(--color-muted)]">{item.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Frequency TOP 20 */}
          {stats && (
            <Collapsible title={`🔥 号码频率 TOP 20（${config.shortName}）`} step={1}>
              <div className="space-y-1.5">
                {stats.freq.slice(0, 20).map(([num, count], i) => {
                  const maxFreq = stats.freq[0]?.[1] || 1;
                  const pct = (count / maxFreq) * 100;
                  return (
                    <div key={num} className="flex items-center gap-2 group">
                      <span className="text-sm text-[var(--color-muted)] w-4 text-right shrink-0">{i + 1}</span>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0"
                        style={{ background: `${config.color}20`, color: config.color }}>
                        {num.toString().padStart(2, '0')}
                      </span>
                      <div className="flex-1 h-5 glass-inset rounded overflow-hidden relative">
                        <div className="h-full rounded transition-all duration-500"
                          style={{ width: `${pct}%`, background: config.color }} />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-mono text-[var(--color-muted)] group-hover:text-[var(--color-text)]">
                          {count}次 ({((count / draws.length) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Collapsible>
          )}

          {/* Draw History */}
          <Collapsible title={`📋 最近开奖（${Math.min(30, draws.length)}期）`} step={2}>
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {draws.slice(0, 30).map((draw: any) => (
                <div key={draw.id || draw.draw_number} className="flex items-center gap-4 py-2 px-2 border-b border-[var(--glass-border)]/50 hover:bg-white/[0.02] rounded transition-colors">
                  <div className="w-24 shrink-0">
                    <div className="font-mono text-xs font-bold">{draw.draw_number}</div>
                    <div className="text-sm text-[var(--color-muted)]">{draw.draw_date}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {draw.numbers?.map((n: number) => (
                      <span key={n} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono"
                        style={{ background: `${config.color}20`, color: config.color }}>
                        {n.toString().padStart(2, '0')}
                      </span>
                    ))}
                  </div>
                  {draw.bonus_numbers && draw.bonus_numbers.length > 0 && (
                    <div className="flex gap-1 shrink-0">
                      {draw.bonus_numbers.map((n: number) => (
                        <span key={n} className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                          {n.toString().padStart(2, '0')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Collapsible>
        </>
      )}
    </div>
  );
}
