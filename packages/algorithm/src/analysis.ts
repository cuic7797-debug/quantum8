/**
 * 专业分析算法
 * AC值、012路、尾数、重号邻号跳号、跨度分布
 */

// ============ AC值（算术复杂度）============
// 衡量号码组合的分散程度，AC值越大越分散
export function calcACValue(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  const diffs = new Set<number>();
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      diffs.add(sorted[j] - sorted[i]);
    }
  }
  return diffs.size - (sorted.length - 1);
}

// 批量计算AC值分布
export function acDistribution(draws: { numbers: number[] }[]): { avg: number; min: number; max: number; histogram: number[] } {
  const acs = draws.map(d => calcACValue(d.numbers));
  const avg = acs.reduce((a, b) => a + b, 0) / acs.length;
  const histogram = new Array(Math.max(...acs) + 1).fill(0);
  acs.forEach(ac => histogram[ac]++);
  return {
    avg: parseFloat(avg.toFixed(2)),
    min: Math.min(...acs),
    max: Math.max(...acs),
    histogram,
  };
}

// ============ 012路分析 ============
// 号码除以3的余数分布
export function calc012Road(numbers: number[]): [number, number, number] {
  const road = [0, 0, 0];
  numbers.forEach(n => road[n % 3]++);
  return [road[0], road[1], road[2]];
}

export function road012Trend(draws: { numbers: number[]; draw_number?: string }[], count: number = 20): { draw: string; road: [number, number, number] }[] {
  return draws.slice(0, count).map(d => ({
    draw: d.draw_number || '',
    road: calc012Road(d.numbers),
  }));
}

// ============ 尾数分析 ============
// 0-9尾数出现频率和遗漏
export interface TailStat {
  tail: number;
  totalAppear: number;
  recentAppear: number;
  currentMiss: number;
  avgMiss: number;
  frequency: number;
}

export function tailAnalysis(draws: { numbers: number[] }[], recentCount: number = 20): TailStat[] {
  const tails: TailStat[] = [];
  for (let t = 0; t <= 9; t++) {
    const totalAppear = draws.filter(d => d.numbers.some(n => n % 10 === t)).length;
    const recentAppear = draws.slice(0, recentCount).filter(d => d.numbers.some(n => n % 10 === t)).length;

    let currentMiss = 0;
    for (const d of draws) {
      if (d.numbers.some(n => n % 10 === t)) break;
      currentMiss++;
    }

    const missPeriods: number[] = [];
    let lastSeen = -1;
    for (let i = 0; i < draws.length; i++) {
      if (draws[i].numbers.some(n => n % 10 === t)) {
        if (lastSeen >= 0) missPeriods.push(i - lastSeen);
        lastSeen = i;
      }
    }
    const avgMiss = missPeriods.length > 0 ? missPeriods.reduce((a, b) => a + b, 0) / missPeriods.length : 0;

    tails.push({
      tail: t,
      totalAppear,
      recentAppear,
      currentMiss,
      avgMiss: parseFloat(avgMiss.toFixed(1)),
      frequency: parseFloat(((totalAppear / draws.length) * 100).toFixed(1)),
    });
  }
  return tails;
}

// ============ 重号/邻号/跳号统计 ============
export interface RelationStats {
  repeatCount: number;   // 重号（与上期相同的号码）
  neighborCount: number; // 邻号（与上期号码±1的号码）
  skipCount: number;     // 跳号（与上期号码差距≥3的号码）
}

export function relationAnalysis(current: number[], previous: number[]): RelationStats {
  const prevSet = new Set(previous);
  const repeatCount = current.filter(n => prevSet.has(n)).length;

  const neighborSet = new Set<number>();
  previous.forEach(n => { neighborSet.add(n - 1); neighborSet.add(n + 1); });
  const neighborCount = current.filter(n => neighborSet.has(n) && !prevSet.has(n)).length;

  const skipCount = current.length - repeatCount - neighborCount;

  return { repeatCount, neighborCount, skipCount };
}

// 批量统计
export function relationTrend(draws: { numbers: number[] }[]): RelationStats[] {
  const results: RelationStats[] = [];
  for (let i = 0; i < draws.length - 1; i++) {
    results.push(relationAnalysis(draws[i].numbers, draws[i + 1].numbers));
  }
  return results;
}

// ============ 跨度分布分析 ============
export interface SpanDistribution {
  avg: number;
  min: number;
  max: number;
  histogram: number[];
  trend: '增大' | '减小' | '平稳';
}

export function spanDistribution(draws: { numbers: number[] }[], count: number = 30): SpanDistribution {
  const spans = draws.slice(0, count).map(d => {
    const sorted = [...d.numbers].sort((a, b) => a - b);
    return sorted[sorted.length - 1] - sorted[0];
  });

  const avg = spans.reduce((a, b) => a + b, 0) / spans.length;
  const maxSpan = Math.max(...spans);
  const histogram = new Array(maxSpan + 1).fill(0);
  spans.forEach(s => histogram[s]++);

  // 趋势
  const recent5 = spans.slice(0, 5);
  const prev5 = spans.slice(5, 10);
  const recentAvg = recent5.reduce((a, b) => a + b, 0) / 5;
  const prevAvg = prev5.length > 0 ? prev5.reduce((a, b) => a + b, 0) / prev5.length : recentAvg;
  const trend = recentAvg > prevAvg + 3 ? '增大' : recentAvg < prevAvg - 3 ? '减小' : '平稳';

  return {
    avg: parseFloat(avg.toFixed(1)),
    min: Math.min(...spans),
    max: maxSpan,
    histogram,
    trend,
  };
}

// ============ 和值概率区间 ============
export interface SumRange {
  avg: number;
  std: number;
  range68: [number, number];  // 68%置信区间（±1σ）
  range95: [number, number];  // 95%置信区间（±2σ）
  distribution: number[];     // 概率分布
}

export function sumProbabilityRange(draws: { numbers: number[] }[], pickCount: number): SumRange {
  const sums = draws.map(d => d.numbers.reduce((a, b) => a + b, 0));
  const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
  const std = Math.sqrt(sums.reduce((a, s) => a + Math.pow(s - avg, 2), 0) / sums.length);

  const min = Math.min(...sums);
  const max = Math.max(...sums);
  const distribution = new Array(max - min + 1).fill(0);
  sums.forEach(s => distribution[s - min]++);

  return {
    avg: parseFloat(avg.toFixed(0)),
    std: parseFloat(std.toFixed(0)),
    range68: [Math.round(avg - std), Math.round(avg + std)],
    range95: [Math.round(avg - std * 2), Math.round(avg + std * 2)],
    distribution,
  };
}
