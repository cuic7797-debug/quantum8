import { useDraws } from '@/hooks/useDraws';
import NumberBall from '@/components/common/NumberBall';

export default function PatternDetection() {
  const { draws } = useDraws(30);
  if (draws.length < 10) return null;

  const recent20 = draws.slice(0, 20);

  // Pattern 1: Repeating numbers (numbers that appear in consecutive draws)
  const repeats: { num: number; streak: number }[] = [];
  for (let num = 1; num <= 80; num++) {
    let streak = 0;
    for (const d of recent20) {
      if (d.numbers.includes(num)) streak++;
      else break;
    }
    if (streak >= 2) repeats.push({ num, streak });
  }
  repeats.sort((a, b) => b.streak - a.streak);

  // Pattern 2: Mirror numbers (numbers that sum to 81)
  const mirrorPairs: { a: number; b: number; coCount: number }[] = [];
  for (let a = 1; a <= 40; a++) {
    const b = 81 - a;
    let coCount = 0;
    recent20.forEach(d => {
      if (d.numbers.includes(a) && d.numbers.includes(b)) coCount++;
    });
    if (coCount >= 2) mirrorPairs.push({ a, b, coCount });
  }
  mirrorPairs.sort((a, b) => b.coCount - a.coCount);

  // Pattern 3: End-digit clustering (same last digit appearing)
  const endDigitCount = new Map<number, number>();
  recent20.forEach(d => {
    const lastDigits = new Set(d.numbers.map(n => n % 10));
    lastDigits.forEach(ld => endDigitCount.set(ld, (endDigitCount.get(ld) || 0) + 1));
  });
  const topEndDigits = [...endDigitCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Pattern 4: Odd/Even streaks
  const oeStreaks: { type: string; count: number }[] = [];
  let streakType = ''; let streakLen = 0;
  recent20.forEach(d => {
    const dominated = d.odd_count > d.even_count ? '奇多' : d.odd_count < d.even_count ? '偶多' : '均衡';
    if (dominated === streakType) streakLen++;
    else { if (streakType) oeStreaks.push({ type: streakType, count: streakLen }); streakType = dominated; streakLen = 1; }
  });
  if (streakType) oeStreaks.push({ type: streakType, count: streakLen });
  const longStreaks = oeStreaks.filter(s => s.count >= 3);

  // Pattern 5: Head/Tail analysis (numbers ending in specific digits)
  const headTail: { digit: number; recent: number; expected: number }[] = [];
  for (let d = 0; d <= 9; d++) {
    const recent = recent20.filter(draw => draw.numbers.some(n => n % 10 === d)).length;
    headTail.push({ digit: d, recent, expected: Math.round(recent20.length * 0.25 * 10) / 10 });
  }

  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-4">
      <div>
        <h3 className="font-semibold">🔍 号码模式识别</h3>
        <p className="text-xs text-[var(--color-muted)] mt-1">发现隐藏的号码规律和模式</p>
      </div>

      {/* Repeating numbers */}
      {repeats.length > 0 && (
        <div className="bg-[var(--color-bg)] rounded-lg p-3">
          <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">🔁 连续出现（重号延续）</div>
          <div className="space-y-1">
            {repeats.slice(0, 5).map(r => (
              <div key={r.num} className="flex items-center gap-2">
                <NumberBall number={r.num} size="sm" />
                <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: (r.streak / 20 * 100) + '%' }} />
                </div>
                <span className="text-xs font-mono text-[var(--color-muted)]">{r.streak}期连续</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mirror pairs */}
      {mirrorPairs.length > 0 && (
        <div className="bg-[var(--color-bg)] rounded-lg p-3">
          <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">🪞 镜像对（和为81）</div>
          <div className="flex flex-wrap gap-2">
            {mirrorPairs.slice(0, 8).map(p => (
              <div key={p.a} className="flex items-center gap-1 bg-[var(--color-surface)] rounded-lg px-2 py-1">
                <NumberBall number={p.a} size="sm" />
                <span className="text-[10px] text-[var(--color-muted)]">↔</span>
                <NumberBall number={p.b} size="sm" />
                <span className="text-[10px] text-[var(--color-primary)] ml-1">{p.coCount}次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End digit clustering */}
      <div className="bg-[var(--color-bg)] rounded-lg p-3">
        <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">🎯 尾数聚类</div>
        <div className="grid grid-cols-5 gap-2">
          {topEndDigits.map(([digit, count]) => (
            <div key={digit} className="text-center bg-[var(--color-surface)] rounded-lg p-2">
              <div className="text-lg font-bold font-mono">尾{digit}</div>
              <div className="text-[10px] text-[var(--color-muted)]">{count}期出现</div>
            </div>
          ))}
        </div>
      </div>

      {/* Odd/Even streaks */}
      {longStreaks.length > 0 && (
        <div className="bg-[var(--color-bg)] rounded-lg p-3">
          <div className="text-xs font-semibold text-[var(--color-muted)] mb-2">⚖️ 奇偶连续偏态</div>
          <div className="flex flex-wrap gap-2">
            {longStreaks.map((s, i) => (
              <div key={i} className={'rounded-lg px-3 py-1.5 text-xs font-semibold ' + (
                s.type === '奇多' ? 'bg-purple-500/15 text-purple-400' : 'bg-cyan-500/15 text-cyan-400'
              )}>
                {s.type} 连续{s.count}期
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10px] text-[var(--color-muted)] text-center">模式识别基于近20期数据，仅供参考</div>
    </div>
  );
}
