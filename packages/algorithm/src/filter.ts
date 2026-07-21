import type { StrategyConfig } from '@quantum8/types';

const TOTAL_NUMBERS = 80;
const DRAW_COUNT = 20;

export function generateRandomCombination(count: number): number[] {
  const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result.sort((a, b) => a - b);
}

export function generateBatch(count: number, batchSize: number): number[][] {
  const batches: number[][] = [];
  for (let i = 0; i < batchSize; i++) {
    batches.push(generateRandomCombination(count));
  }
  return batches;
}

export function filterBySum(combos: number[][], range: [number, number]): number[][] {
  return combos.filter((c) => {
    const sum = c.reduce((a, b) => a + b, 0);
    return sum >= range[0] && sum <= range[1];
  });
}

export function filterByOddEven(combos: number[][], range: [number, number]): number[][] {
  return combos.filter((c) => {
    const odd = c.filter((n) => n % 2 === 1).length;
    return odd >= range[0] && odd <= range[1];
  });
}

export function filterByZone(combos: number[][]): number[][] {
  return combos.filter((c) => {
    const zones = [0, 0, 0, 0];
    c.forEach((n) => {
      if (n <= 20) zones[0]++;
      else if (n <= 40) zones[1]++;
      else if (n <= 60) zones[2]++;
      else zones[3]++;
    });
    return zones.every((z) => z >= 1 && z <= c.length - 1);
  });
}

export function filterByConsecutive(combos: number[][], maxConsecutive: number): number[][] {
  return combos.filter((c) => {
    let streak = 1;
    for (let i = 1; i < c.length; i++) {
      if (c[i] === c[i - 1] + 1) {
        streak++;
        if (streak > maxConsecutive) return false;
      } else {
        streak = 1;
      }
    }
    return true;
  });
}

export function applyFilters(combos: number[][], config: StrategyConfig): number[][] {
  let result = combos;
  result = filterBySum(result, config.sumRange);
  result = filterByOddEven(result, config.oddEvenRange);
  if (config.zoneBalance) result = filterByZone(result);
  result = filterByConsecutive(result, config.maxConsecutive);
  return result;
}
