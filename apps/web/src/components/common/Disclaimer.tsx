export default function Disclaimer() {
  return (
    <div className="glass-card border-l-2 border-l-amber-500/40 text-sm text-[var(--color-muted)] leading-relaxed" style={{ padding: '12px 16px' }}>
      <div className="font-semibold text-amber-400/90 mb-1 text-sm">⚠ 免责声明</div>
      <p className="opacity-80">Quantum8 是一款数据分析工具，所有分析结果基于历史数据统计，仅供参考研究使用，不构成任何投注建议。</p>
      <p className="mt-1 opacity-70">彩票开奖结果为随机事件，任何分析方法都无法保证准确性。请理性购彩，量力而行。</p>
    </div>
  );
}
