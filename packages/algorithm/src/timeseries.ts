/**
 * 时间序列分析
 * 自相关分析 + 时间序列分解 + 布林带
 */

export interface AutocorrelationResult {
  lags: number[];
  acf: number[];
  significantLags: number[];
  period: number | null;
}

// 自相关函数
export function autocorrelation(data: number[], maxLag: number = 30): AutocorrelationResult {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const variance = data.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n;
  
  if (variance === 0) return { lags: [], acf: [], significantLags: [], period: null };

  const lags: number[] = [];
  const acf: number[] = [];

  for (let lag = 1; lag <= Math.min(maxLag, n - 1); lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (data[i] - mean) * (data[i + lag] - mean);
    }
    acf.push(sum / (n * variance));
    lags.push(lag);
  }

  // Significance threshold (95% confidence)
  const threshold = 1.96 / Math.sqrt(n);
  const significantLags = lags.filter((_, i) => Math.abs(acf[i]) > threshold);

  // Detect period from ACF peaks
  let period: number | null = null;
  let maxAc = 0;
  for (let i = 1; i < acf.length; i++) {
    if (acf[i] > maxAc && acf[i] > threshold) {
      maxAc = acf[i];
      period = lags[i];
    }
  }

  return { lags, acf, significantLags, period };
}

export interface DecompositionResult {
  trend: number[];
  seasonal: number[];
  residual: number[];
  period: number;
}

// 时间序列分解 (移动平均法)
export function decompose(data: number[], period: number = 7): DecompositionResult {
  const n = data.length;
  const halfPeriod = Math.floor(period / 2);
  
  // Trend: centered moving average
  const trend: number[] = new Array(n).fill(0);
  for (let i = halfPeriod; i < n - halfPeriod; i++) {
    let sum = 0;
    for (let j = i - halfPeriod; j <= i + halfPeriod; j++) {
      sum += data[j];
    }
    trend[i] = sum / period;
  }
  // Fill edges
  for (let i = 0; i < halfPeriod; i++) trend[i] = trend[halfPeriod];
  for (let i = n - halfPeriod; i < n; i++) trend[i] = trend[n - halfPeriod - 1];

  // Detrended
  const detrended = data.map((v, i) => v - trend[i]);

  // Seasonal: average of same phase
  const seasonalAvg = new Array(period).fill(0);
  const seasonalCount = new Array(period).fill(0);
  for (let i = 0; i < n; i++) {
    const phase = i % period;
    seasonalAvg[phase] += detrended[i];
    seasonalCount[phase]++;
  }
  const seasonal = seasonalAvg.map((s, i) => seasonalCount[i] > 0 ? s / seasonalCount[i] : 0);

  // Remove seasonal mean to center
  const sMean = seasonal.reduce((a, b) => a + b, 0) / period;
  const centeredSeasonal = seasonal.map(s => s - sMean);

  // Build full seasonal series
  const seasonalSeries: number[] = [];
  for (let i = 0; i < n; i++) {
    seasonalSeries.push(centeredSeasonal[i % period]);
  }

  // Residual
  const residual = data.map((v, i) => v - trend[i] - seasonalSeries[i]);

  return { trend, seasonal: seasonalSeries, residual, period };
}

export interface BollingerBands {
  upper: number[];
  middle: number[];
  lower: number[];
  bandwidth: number[];
}

// 布林带
export function bollingerBands(data: number[], period: number = 20, stdDev: number = 2): BollingerBands {
  const n = data.length;
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  const bandwidth: number[] = [];

  for (let i = 0; i < n; i++) {
    const windowStart = Math.max(0, i - period + 1);
    const window = data.slice(windowStart, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / window.length;
    const std = Math.sqrt(window.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / window.length);

    middle.push(mean);
    upper.push(mean + stdDev * std);
    lower.push(mean - stdDev * std);
    bandwidth.push(mean > 0 ? (2 * stdDev * std) / mean * 100 : 0);
  }

  return { upper, middle, lower, bandwidth };
}

// 移动平均线
export function movingAverage(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - period + 1);
    const window = data.slice(start, i + 1);
    result.push(window.reduce((a, b) => a + b, 0) / window.length);
  }
  return result;
}
