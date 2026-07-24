/**
 * 高级回测引擎
 * 滑动窗口回测 + 风险指标 + 收益率计算
 */

export interface BacktestConfig {
  numbers: number[];
  draws: { numbers: number[]; draw_number: string; draw_date: string }[];
  betCost: number;
  prizeTable: Record<number, number>; // matchCount -> prize amount
  windowSize?: number; // sliding window size
}

export interface BacktestResult {
  totalRounds: number;
  totalCost: number;
  totalPrize: number;
  roi: number; // return on investment %
  winCount: number;
  winRate: number;
  maxWin: number;
  maxDrawdown: number;
  sharpeRatio: number;
  profitCurve: number[];
  matchDistribution: Record<number, number>;
  bestRound: { draw: string; matchCount: number; prize: number };
  worstRound: { draw: string; matchCount: number; prize: number };
  monthlyReturns: { month: string; return: number }[];
}

export function runBacktest(config: BacktestConfig): BacktestResult {
  const { numbers, draws, betCost, prizeTable, windowSize = 1 } = config;
  const numSet = new Set(numbers);

  let totalCost = 0;
  let totalPrize = 0;
  let winCount = 0;
  let maxWin = 0;
  let maxDrawdown = 0;
  let peak = 0;
  const profitCurve: number[] = [];
  const matchDistribution: Record<number, number> = {};
  let bestRound = { draw: '', matchCount: 0, prize: 0 };
  let worstRound = { draw: '', matchCount: Infinity, prize: 0 };
  const monthlyData: Record<string, { cost: number; prize: number }> = {};

  for (let i = 0; i < draws.length; i++) {
    const draw = draws[i];
    const matchCount = draw.numbers.filter(n => numSet.has(n)).length;
    const prize = prizeTable[matchCount] || 0;

    totalCost += betCost;
    totalPrize += prize;
    const profit = totalPrize - totalCost;
    profitCurve.push(profit);

    if (prize > 0) winCount++;
    if (prize > maxWin) maxWin = prize;
    matchDistribution[matchCount] = (matchDistribution[matchCount] || 0) + 1;

    if (prize > bestRound.prize || (prize === bestRound.prize && matchCount > bestRound.matchCount)) {
      bestRound = { draw: draw.draw_number, matchCount, prize };
    }
    if (matchCount < worstRound.matchCount || (matchCount === worstRound.matchCount && prize < worstRound.prize)) {
      worstRound = { draw: draw.draw_number, matchCount, prize };
    }

    // Monthly tracking
    const month = draw.draw_date?.slice(0, 7) || 'unknown';
    if (!monthlyData[month]) monthlyData[month] = { cost: 0, prize: 0 };
    monthlyData[month].cost += betCost;
    monthlyData[month].prize += prize;

    // Max drawdown
    if (profit > peak) peak = profit;
    const drawdown = peak - profit;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  const totalRounds = draws.length;
  const roi = totalCost > 0 ? ((totalPrize - totalCost) / totalCost) * 100 : 0;
  const winRate = totalRounds > 0 ? (winCount / totalRounds) * 100 : 0;

  // Sharpe ratio (simplified)
  const returns = profitCurve.slice(1).map((p, i) => p - profitCurve[i]);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const stdReturn = returns.length > 0 ? Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length) : 1;
  const sharpeRatio = stdReturn > 0 ? avgReturn / stdReturn : 0;

  // Monthly returns
  const monthlyReturns = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      return: data.cost > 0 ? ((data.prize - data.cost) / data.cost) * 100 : 0,
    }));

  return {
    totalRounds,
    totalCost,
    totalPrize,
    roi: Math.round(roi * 100) / 100,
    winCount,
    winRate: Math.round(winRate * 100) / 100,
    maxWin,
    maxDrawdown,
    sharpeRatio: Math.round(sharpeRatio * 1000) / 1000,
    profitCurve,
    matchDistribution,
    bestRound,
    worstRound,
    monthlyReturns,
  };
}

// Monte Carlo simulation
export interface MonteCarloConfig {
  numbers: number[];
  poolSize: number;
  pickCount: number;
  simulations: number;
  roundsPerSim: number;
  betCost: number;
  prizeTable: Record<number, number>;
}

export interface MonteCarloResult {
  avgProfit: number;
  medianProfit: number;
  profitStd: number;
  winProbability: number;
  lossProbability: number;
  maxProfit: number;
  minProfit: number;
  profitDistribution: { range: string; count: number; percentage: number }[];
}

export function monteCarloSimulation(config: MonteCarloConfig): MonteCarloResult {
  const { numbers, poolSize, pickCount, simulations, roundsPerSim, betCost, prizeTable } = config;
  const numSet = new Set(numbers);
  const profits: number[] = [];

  for (let sim = 0; sim < simulations; sim++) {
    let profit = 0;
    for (let round = 0; round < roundsPerSim; round++) {
      // Generate random draw
      const draw: number[] = [];
      const pool = Array.from({ length: poolSize }, (_, i) => i + 1);
      for (let i = 0; i < pickCount && pool.length > 0; i++) {
        const idx = Math.floor(Math.random() * pool.length);
        draw.push(pool[idx]);
        pool.splice(idx, 1);
      }
      const matchCount = draw.filter(n => numSet.has(n)).length;
      const prize = prizeTable[matchCount] || 0;
      profit += prize - betCost;
    }
    profits.push(profit);
  }

  profits.sort((a, b) => a - b);
  const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
  const medianProfit = profits[Math.floor(profits.length / 2)];
  const profitStd = Math.sqrt(profits.reduce((s, p) => s + Math.pow(p - avgProfit, 2), 0) / profits.length);
  const winCount = profits.filter(p => p > 0).length;
  const lossCount = profits.filter(p => p < 0).length;

  // Distribution buckets
  const min = profits[0];
  const max = profits[profits.length - 1];
  const bucketSize = Math.max(1, Math.ceil((max - min) / 10));
  const buckets: Record<string, number> = {};
  profits.forEach(p => {
    const bucketStart = Math.floor(p / bucketSize) * bucketSize;
    const key = `${bucketStart}-${bucketStart + bucketSize}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });
  const profitDistribution = Object.entries(buckets)
    .map(([range, count]) => ({ range, count, percentage: (count / simulations) * 100 }))
    .sort((a, b) => {
      const aNum = parseInt(a.range.split('-')[0]);
      const bNum = parseInt(b.range.split('-')[0]);
      return aNum - bNum;
    });

  return {
    avgProfit: Math.round(avgProfit),
    medianProfit: Math.round(medianProfit),
    profitStd: Math.round(profitStd),
    winProbability: Math.round((winCount / simulations) * 10000) / 100,
    lossProbability: Math.round((lossCount / simulations) * 10000) / 100,
    maxProfit: profits[profits.length - 1],
    minProfit: profits[0],
    profitDistribution,
  };
}
