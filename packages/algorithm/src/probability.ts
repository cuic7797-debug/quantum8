import type { Draw, NumberStat } from '@quantum8/types';

const TOTAL_NUMBERS = 80;
const DRAW_COUNT = 20;
const THEORETICAL_RATE = (DRAW_COUNT / TOTAL_NUMBERS) * 100;

export function calculateProbability(draws: Draw[]): NumberStat[] {
  const stats: NumberStat[] = [];
  const totalDraws = draws.length;

  for (let num = 1; num <= TOTAL_NUMBERS; num++) {
    const totalAppearances = draws.filter((d) => d.numbers.includes(num)).length;
    const recent10 = draws.slice(0, 10).filter((d) => d.numbers.includes(num)).length;
    const recent20 = draws.slice(0, 20).filter((d) => d.numbers.includes(num)).length;
    const recent50 = draws.slice(0, 50).filter((d) => d.numbers.includes(num)).length;

    let currentMiss = 0;
    for (const draw of draws) {
      if (draw.numbers.includes(num)) break;
      currentMiss++;
    }

    const missPeriods: number[] = [];
    let lastSeen = -1;
    for (let i = 0; i < totalDraws; i++) {
      if (draws[i].numbers.includes(num)) {
        if (lastSeen >= 0) missPeriods.push(i - lastSeen);
        lastSeen = i;
      }
    }
    const avgMiss = missPeriods.length > 0
      ? missPeriods.reduce((a, b) => a + b, 0) / missPeriods.length
      : 0;
    const maxMiss = missPeriods.length > 0 ? Math.max(...missPeriods) : currentMiss;

    const recentRate = totalDraws > 0 ? (recent10 / 10) * 100 : 0;
    const deviation = recentRate - THEORETICAL_RATE;
    const missRatio = avgMiss > 0 ? Math.min(100, (currentMiss / avgMiss) * 100) : 0;

    const hotScore = Math.max(0, Math.min(100, 50 + deviation * 5));
    const coldScore = Math.max(0, Math.min(100, 100 - hotScore));

    stats.push({
      number: num,
      totalAppearances,
      recent10Rate: parseFloat(((recent10 / 10) * 100).toFixed(1)),
      recent20Rate: parseFloat(((recent20 / 20) * 100).toFixed(1)),
      recent50Rate: parseFloat(((recent50 / Math.min(50, totalDraws)) * 100).toFixed(1)),
      currentMiss,
      avgMiss: parseFloat(avgMiss.toFixed(1)),
      maxMiss,
      missRatio: parseFloat(missRatio.toFixed(1)),
      hotScore: parseFloat(hotScore.toFixed(1)),
      coldScore: parseFloat(coldScore.toFixed(1)),
    });
  }

  return stats;
}
