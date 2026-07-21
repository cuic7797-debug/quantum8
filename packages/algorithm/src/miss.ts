import type { NumberStat } from '@quantum8/types';

export function getMissIndex(stat: NumberStat): number {
  if (stat.avgMiss === 0) return 0;
  return parseFloat(((stat.currentMiss / stat.avgMiss) * 100).toFixed(1));
}

export function sortByMissIndex(stats: NumberStat[]): NumberStat[] {
  return [...stats].sort((a, b) => {
    const indexA = getMissIndex(a);
    const indexB = getMissIndex(b);
    return indexB - indexA;
  });
}

export function getMissTopN(stats: NumberStat[], n: number): NumberStat[] {
  return sortByMissIndex(stats).slice(0, n);
}

export function isOverdue(stat: NumberStat, threshold = 1.5): boolean {
  return getMissIndex(stat) >= threshold * 100;
}
