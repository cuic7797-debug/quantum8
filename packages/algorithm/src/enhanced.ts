/**
 * Quantum8 增强算法模块
 * 冷热转换预警 / 和值跨度预测区间 / 智能缩水增强
 */

// ============ 冷热转换预警 ============
export interface ColdHotAlert {
  number: number;
  transition: '冷转热' | '热转冷' | '维持热' | '维持冷' | '温号';
  severity: '高' | '中' | '低';
  confidence: number;
  detail: string;
}

export function detectColdHotTransitions(
  draws: { numbers: number[] }[],
  window: number = 20,
  threshold: number = 0.3
): ColdHotAlert[] {
  const alerts: ColdHotAlert[] = [];
  if (draws.length < window) return alerts;

  for (let num = 1; num <= 80; num++) {
    const oldWindow = draws.slice(window, window * 2).map(d => d.numbers.includes(num) ? 1 : 0) as number[];
    const newWindow = draws.slice(0, window).map(d => d.numbers.includes(num) ? 1 : 0) as number[];

    const oldRate = oldWindow.reduce((a, b) => a + b, 0) / oldWindow.length;
    const newRate = newWindow.reduce((a, b) => a + b, 0) / newWindow.length;

    const diff = newRate - oldRate;

    let transition: ColdHotAlert['transition'];
    let severity: ColdHotAlert['severity'];
    let confidence: number;

    if (oldRate < threshold && newRate >= threshold) {
      transition = '冷转热';
      severity = Math.abs(diff) > 0.4 ? '高' : Math.abs(diff) > 0.2 ? '中' : '低';
      confidence = Math.min(0.95, 0.5 + Math.abs(diff));
    } else if (oldRate >= threshold && newRate < threshold) {
      transition = '热转冷';
      severity = Math.abs(diff) > 0.4 ? '高' : Math.abs(diff) > 0.2 ? '中' : '低';
      confidence = Math.min(0.95, 0.5 + Math.abs(diff));
    } else if (oldRate >= threshold && newRate >= threshold) {
      transition = '维持热';
      severity = '低';
      confidence = 0.6;
    } else if (oldRate < threshold && newRate < threshold) {
      transition = '维持冷';
      severity = '低';
      confidence = 0.6;
    } else {
      transition = '温号';
      severity = '低';
      confidence = 0.5;
    }

    if (transition === '冷转热' || transition === '热转冷') {
      alerts.push({
        number: num,
        transition,
        severity,
        confidence: parseFloat(confidence.toFixed(2)),
        detail: `前${window}期出现率 ${(newRate * 100).toFixed(1)}% → ${transition === '冷转热' ? '上升' : '下降'} ${(Math.abs(diff) * 100).toFixed(1)}%`,
      });
    }
  }

  return alerts.sort((a, b) => {
    const sevOrder = { '高': 0, '中': 1, '低': 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}

// ============ 和值预测区间 ============
export interface SumPrediction {
  mean: number;
  std: number;
  interval68: [number, number];  // 68% 置信区间
  interval95: [number, number];  // 95% 置信区间
  probabilityRanges: { range: string; probability: number }[];
  trend: '上升' | '下降' | '平稳';
}

export function predictSumRange(draws: { sum_value: number }[], window: number = 50): SumPrediction {
  const recent = draws.slice(0, window);
  const sums = recent.map(d => d.sum_value);

  const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
  const std = Math.sqrt(sums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / sums.length);

  const interval68: [number, number] = [Math.round(mean - std), Math.round(mean + std)];
  const interval95: [number, number] = [Math.round(mean - 2 * std), Math.round(mean + 2 * std)];

  // Probability ranges
  const ranges = [
    { min: 0, max: 400, label: '<400' },
    { min: 400, max: 500, label: '400-500' },
    { min: 500, max: 600, label: '500-600' },
    { min: 600, max: 700, label: '600-700' },
    { min: 700, max: 800, label: '700-800' },
    { min: 800, max: 900, label: '800-900' },
    { min: 900, max: 9999, label: '>900' },
  ];

  const probabilityRanges = ranges.map(r => ({
    range: r.label,
    probability: parseFloat(((sums.filter(s => s >= r.min && s < r.max).length / sums.length) * 100).toFixed(1)),
  }));

  // Trend
  const half = Math.floor(sums.length / 2);
  const firstHalf = sums.slice(0, half);
  const secondHalf = sums.slice(half);
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const trend = firstAvg - secondAvg > 20 ? '上升' : secondAvg - firstAvg > 20 ? '下降' : '平稳';

  return {
    mean: parseFloat(mean.toFixed(1)),
    std: parseFloat(std.toFixed(1)),
    interval68,
    interval95,
    probabilityRanges,
    trend,
  };
}

// ============ 跨度预测区间 ============
export interface SpanPrediction {
  mean: number;
  std: number;
  interval68: [number, number];
  interval95: [number, number];
  distribution: { span: string; count: number; probability: number }[];
}

export function predictSpanRange(draws: { span: number }[], window: number = 50): SpanPrediction {
  const recent = draws.slice(0, window);
  const spans = recent.map(d => d.span);

  const mean = spans.reduce((a, b) => a + b, 0) / spans.length;
  const std = Math.sqrt(spans.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / spans.length);

  const interval68: [number, number] = [Math.round(mean - std), Math.round(mean + std)];
  const interval95: [number, number] = [Math.round(Math.max(0, mean - 2 * std)), Math.round(mean + 2 * std)];

  const ranges = [
    { min: 0, max: 20, label: '0-20' },
    { min: 20, max: 30, label: '20-30' },
    { min: 30, max: 40, label: '30-40' },
    { min: 40, max: 50, label: '40-50' },
    { min: 50, max: 60, label: '50-60' },
    { min: 60, max: 70, label: '60-70' },
    { min: 70, max: 80, label: '70-80' },
  ];

  const distribution = ranges.map(r => {
    const count = spans.filter(s => s >= r.min && s < r.max).length;
    return {
      span: r.label,
      count,
      probability: parseFloat(((count / spans.length) * 100).toFixed(1)),
    };
  }).filter(d => d.count > 0);

  return {
    mean: parseFloat(mean.toFixed(1)),
    std: parseFloat(std.toFixed(1)),
    interval68,
    interval95,
    distribution,
  };
}

// ============ 智能缩水增强 ============
export interface SmartShrinkResult {
  originalCount: number;
  shrunkCount: number;
  coverageRate: number;
  groups: number[][];
  method: string;
}

export function smartShrinkEnhanced(
  numbers: number[],
  targetCount: number,
  draws: { numbers: number[] }[],
  method: 'frequency' | 'miss' | 'ensemble' = 'ensemble'
): SmartShrinkResult {
  if (numbers.length <= targetCount) {
    return { originalCount: numbers.length, shrunkCount: numbers.length, coverageRate: 100, groups: [numbers], method: '无需缩水' };
  }

  // Score each number based on method
  const scores = new Map<number, number>();
  const recent = draws.slice(0, 30);

  for (const num of numbers) {
    let score = 0;
    const freq = recent.filter(d => d.numbers.includes(num)).length;
    const miss = (() => {
      for (let i = 0; i < draws.length; i++) {
        if (draws[i].numbers.includes(num)) return i;
      }
      return draws.length;
    })();

    if (method === 'frequency') {
      score = freq;
    } else if (method === 'miss') {
      score = miss;
    } else {
      // Ensemble: weight frequency and miss
      score = freq * 0.5 + (miss / draws.length) * 50;
    }
    scores.set(num, score);
  }

  // Sort by score descending, take top targetCount
  const sorted = [...numbers].sort((a, b) => (scores.get(b) || 0) - (scores.get(a) || 0));
  const shrunk = sorted.slice(0, targetCount).sort((a, b) => a - b);

  const coverageRate = (targetCount / numbers.length) * 100;

  return {
    originalCount: numbers.length,
    shrunkCount: shrunk.length,
    coverageRate: parseFloat(coverageRate.toFixed(1)),
    groups: [shrunk],
    method: method === 'frequency' ? '频率优先' : method === 'miss' ? '遗漏优先' : '集成评分',
  };
}
