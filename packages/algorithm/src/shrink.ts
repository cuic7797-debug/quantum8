/**
 * 智能缩水算法
 * 大复式 → 可承受注数，保持覆盖率最大化
 */

function comb(n: number, k: number): number {
  if (k > n || k < 0) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1);
  return Math.round(r);
}

function getCombos(arr: number[], k: number): number[][] {
  if (k === 0 || arr.length < k) return k === 0 ? [[]] : [];
  const result: number[][] = [];
  for (let i = 0; i <= arr.length - k; i++) {
    for (const rest of getCombos(arr.slice(i + 1), k - 1)) {
      result.push([arr[i], ...rest]);
    }
  }
  return result;
}

// 计算号码对覆盖率
function calcPairCoverage(bets: number[][], pool: number[]): number {
  const allPairs = new Set<string>();
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      allPairs.add(`${pool[i]}-${pool[j]}`);
    }
  }
  const coveredPairs = new Set<string>();
  for (const bet of bets) {
    for (let a = 0; a < bet.length; a++) {
      for (let b = a + 1; b < bet.length; b++) {
        coveredPairs.add(`${bet[a]}-${bet[b]}`);
      }
    }
  }
  return allPairs.size > 0 ? coveredPairs.size / allPairs.size : 0;
}

// 计算单号覆盖率
function calcNumberCoverage(bets: number[][], pool: number[]): number {
  const covered = new Set<number>();
  bets.forEach(bet => bet.forEach(n => covered.add(n)));
  return pool.length > 0 ? covered.size / pool.length : 0;
}

export interface ShrinkResult {
  bets: number[][];
  pairCoverage: number;
  numberCoverage: number;
  originalCount: number;
  shrunkCount: number;
  compressionRatio: number;
  strategy: string;
}

// 贪心缩水：最大化覆盖率
export function greedyShrink(pool: number[], pickCount: number, maxBets: number): ShrinkResult {
  const allCombos = getCombos(pool, pickCount);
  if (allCombos.length <= maxBets) {
    return {
      bets: allCombos,
      pairCoverage: calcPairCoverage(allCombos, pool),
      numberCoverage: calcNumberCoverage(allCombos, pool),
      originalCount: allCombos.length,
      shrunkCount: allCombos.length,
      compressionRatio: 1,
      strategy: '无需缩水',
    };
  }

  const selected: number[][] = [];
  const coveredPairs = new Set<string>();
  const remaining = [...allCombos];

  while (selected.length < maxBets && remaining.length > 0) {
    let bestIdx = 0;
    let bestGain = -1;

    for (let i = 0; i < Math.min(remaining.length, 500); i++) {
      const combo = remaining[i];
      let newPairs = 0;
      for (let a = 0; a < combo.length; a++) {
        for (let b = a + 1; b < combo.length; b++) {
          if (!coveredPairs.has(`${combo[a]}-${combo[b]}`)) newPairs++;
        }
      }
      if (newPairs > bestGain) {
        bestGain = newPairs;
        bestIdx = i;
      }
    }

    const best = remaining.splice(bestIdx, 1)[0];
    selected.push(best);
    for (let a = 0; a < best.length; a++) {
      for (let b = a + 1; b < best.length; b++) {
        coveredPairs.add(`${best[a]}-${best[b]}`);
      }
    }
  }

  return {
    bets: selected,
    pairCoverage: calcPairCoverage(selected, pool),
    numberCoverage: calcNumberCoverage(selected, pool),
    originalCount: allCombos.length,
    shrunkCount: selected.length,
    compressionRatio: parseFloat((selected.length / allCombos.length).toFixed(6)),
    strategy: '贪心覆盖率最大化',
  };
}

// 加权缩水：结合覆盖率+评分
export function weightedShrink(
  pool: number[], pickCount: number, maxBets: number,
  stats: { number: number; hotScore: number; recent10Rate: number }[],
  draws: { numbers: number[] }[]
): ShrinkResult {
  const allCombos = getCombos(pool, pickCount);
  if (allCombos.length <= maxBets) {
    return {
      bets: allCombos,
      pairCoverage: calcPairCoverage(allCombos, pool),
      numberCoverage: calcNumberCoverage(allCombos, pool),
      originalCount: allCombos.length,
      shrunkCount: allCombos.length,
      compressionRatio: 1,
      strategy: '无需缩水',
    };
  }

  // 预计算每个号码的评分
  const scoreMap = new Map<number, number>();
  stats.forEach(s => scoreMap.set(s.number, s.hotScore));

  const selected: number[][] = [];
  const coveredPairs = new Set<string>();
  const remaining = [...allCombos];

  while (selected.length < maxBets && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < Math.min(remaining.length, 500); i++) {
      const combo = remaining[i];
      let newPairs = 0;
      for (let a = 0; a < combo.length; a++) {
        for (let b = a + 1; b < combo.length; b++) {
          if (!coveredPairs.has(`${combo[a]}-${combo[b]}`)) newPairs++;
        }
      }
      // 覆盖率增益 + 号码热度加权
      const comboScore = combo.reduce((sum, n) => sum + (scoreMap.get(n) || 50), 0) / combo.length;
      const gain = newPairs + comboScore * 0.05;

      if (gain > bestScore) {
        bestScore = gain;
        bestIdx = i;
      }
    }

    const best = remaining.splice(bestIdx, 1)[0];
    selected.push(best);
    for (let a = 0; a < best.length; a++) {
      for (let b = a + 1; b < best.length; b++) {
        coveredPairs.add(`${best[a]}-${best[b]}`);
      }
    }
  }

  return {
    bets: selected,
    pairCoverage: calcPairCoverage(selected, pool),
    numberCoverage: calcNumberCoverage(selected, pool),
    originalCount: allCombos.length,
    shrunkCount: selected.length,
    compressionRatio: parseFloat((selected.length / allCombos.length).toFixed(6)),
    strategy: '加权覆盖率+热度',
  };
}
