export default function Disclaimer() {
  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3 text-[10px] text-[var(--color-muted)] leading-relaxed">
      <div className="font-semibold text-amber-400 mb-1">⚠ 免责声明</div>
      <p>Quantum8 是一款数据分析工具，所有分析结果基于历史数据统计，仅供参考研究使用，不构成任何投注建议。</p>
      <p className="mt-1">彩票开奖结果为随机事件，任何分析方法都无法保证准确性。请理性购彩，量力而行。</p>
      <p className="mt-1">© 2026 Quantum8 · 数据分析工具 · 不构成投注建议</p>
    </div>
  );
}
