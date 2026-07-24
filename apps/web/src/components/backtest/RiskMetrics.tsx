interface Props {
  roi: number;
  winRate: number;
  sharpeRatio: number;
  maxDrawdown: number;
  avgProfit: number;
  winProbability: number;
}

export default function RiskMetrics({ roi, winRate, sharpeRatio, maxDrawdown, avgProfit, winProbability }: Props) {
  const metrics = [
    { label: '收益率', value: `${roi > 0 ? '+' : ''}${roi.toFixed(1)}%`, icon: '📈', color: roi > 0 ? 'text-emerald-400' : 'text-red-400', desc: '总投资回报率' },
    { label: '胜率', value: `${winRate.toFixed(1)}%`, icon: '🎯', color: winRate > 50 ? 'text-emerald-400' : 'text-amber-400', desc: '中奖次数比例' },
    { label: '夏普比率', value: sharpeRatio.toFixed(3), icon: '⚖️', color: sharpeRatio > 1 ? 'text-emerald-400' : sharpeRatio > 0 ? 'text-amber-400' : 'text-red-400', desc: '风险调整后收益' },
    { label: '最大回撤', value: `-${maxDrawdown}元`, icon: '📉', color: maxDrawdown < 100 ? 'text-emerald-400' : 'text-red-400', desc: '最大亏损幅度' },
    { label: '期望收益', value: `${avgProfit > 0 ? '+' : ''}${avgProfit.toFixed(0)}元`, icon: '💰', color: avgProfit > 0 ? 'text-emerald-400' : 'text-red-400', desc: '每轮平均收益' },
    { label: '盈利概率', value: `${winProbability.toFixed(1)}%`, icon: '🎲', color: winProbability > 50 ? 'text-emerald-400' : 'text-amber-400', desc: '蒙特卡洛模拟' },
  ];

  function getRiskLevel(): { label: string; color: string; bg: string } {
    if (sharpeRatio > 1 && winRate > 60) return { label: '低风险', color: 'text-emerald-400', bg: 'bg-emerald-500/15' };
    if (sharpeRatio > 0 && winRate > 40) return { label: '中风险', color: 'text-amber-400', bg: 'bg-amber-500/15' };
    return { label: '高风险', color: 'text-red-400', bg: 'bg-red-500/15' };
  }

  const risk = getRiskLevel();

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-muted)]">📊 风险指标</h3>
        <span className={`text-xs px-3 py-1 rounded-full ${risk.bg} ${risk.color} font-bold`}>{risk.label}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="glass-inset p-3 text-center">
            <div className="text-lg">{m.icon}</div>
            <div className={`font-bold font-mono text-sm mt-1 ${m.color}`}>{m.value}</div>
            <div className="text-xs text-[var(--color-muted)]">{m.label}</div>
            <div className="text-xs text-[var(--color-muted)] opacity-60">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
