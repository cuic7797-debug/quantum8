import type { Draw, NumberPair } from '@quantum8/types';

const TOTAL_NUMBERS = 80;

export function buildCoAppearMatrix(draws: Draw[]): Map<string, NumberPair> {
  const matrix = new Map<string, NumberPair>();
  const totalDraws = draws.length;

  for (let a = 1; a <= TOTAL_NUMBERS; a++) {
    for (let b = a + 1; b <= TOTAL_NUMBERS; b++) {
      const key = `${a}-${b}`;
      matrix.set(key, { numberA: a, numberB: b, coAppearCount: 0, coAppearRate: 0 });
    }
  }

  for (const draw of draws) {
    const nums = draw.numbers.sort((a, b) => a - b);
    for (let i = 0; i < nums.length; i++) {
      for (let j = i + 1; j < nums.length; j++) {
        const key = `${nums[i]}-${nums[j]}`;
        const pair = matrix.get(key);
        if (pair) pair.coAppearCount++;
      }
    }
  }

  for (const pair of matrix.values()) {
    pair.coAppearRate = totalDraws > 0
      ? parseFloat(((pair.coAppearCount / totalDraws) * 100).toFixed(2))
      : 0;
  }

  return matrix;
}

export function getTopPairs(matrix: Map<string, NumberPair>, n: number): NumberPair[] {
  return Array.from(matrix.values())
    .sort((a, b) => b.coAppearCount - a.coAppearCount)
    .slice(0, n);
}

export function getPairsForNumber(matrix: Map<string, NumberPair>, num: number): NumberPair[] {
  return Array.from(matrix.values())
    .filter((p) => p.numberA === num || p.numberB === num)
    .sort((a, b) => b.coAppearCount - a.coAppearCount);
}
