import type { NumberStat, ScoreResult } from '@quantum8/types';

export function scoreCombination(
  numbers: number[],
  stats: NumberStat[],
  totalDraws: number
): ScoreResult {
  const selected = stats.filter((s) => numbers.includes(s.number));

  // 1. Probability Score: based on hot/cold balance
  const avgHot = selected.reduce((sum, s) => sum + s.hotScore, 0) / selected.length;
  const probabilityScore = Math.min(100, avgHot);

  // 2. Hot/Cold Balance: prefer balanced distribution
  const hotCount = selected.filter(s => s.hotScore >= 60).length;
  const coldCount = selected.filter(s => s.currentMiss >= 5).length;
  const balance = Math.abs(hotCount - coldCount);
  const hotColdScore = Math.max(0, 100 - balance * 10);

  // 3. Structure Score: zone balance + odd/even balance
  const zones = [0, 0, 0, 0];
  numbers.forEach((n) => {
    if (n <= 20) zones[0]++;
    else if (n <= 40) zones[1]++;
    else if (n <= 60) zones[2]++;
    else zones[3]++;
  });
  const zoneStd = Math.sqrt(zones.reduce((sum, z) => sum + Math.pow(z - numbers.length / 4, 2), 0) / 4);
  const zoneScore = Math.max(0, 100 - zoneStd * 25);

  const odd = numbers.filter((n) => n % 2 === 1).length;
  const oddEvenBalance = Math.abs(odd - numbers.length / 2);
  const oddEvenScore = Math.max(0, 100 - oddEvenBalance * 15);

  const structureScore = (zoneScore * 0.6 + oddEvenScore * 0.4);

  // 4. History Similarity: based on miss ratio
  const avgMissRatio = selected.reduce((sum, s) => sum + s.missRatio, 0) / selected.length;
  const historySimilarity = Math.min(100, avgMissRatio);

  // 5. Total Score
  const totalScore = parseFloat(
    (probabilityScore * 0.3 + hotColdScore * 0.25 + structureScore * 0.25 + historySimilarity * 0.2).toFixed(1)
  );

  let riskLevel: '低' | '中' | '高';
  if (totalScore >= 70) riskLevel = '低';
  else if (totalScore >= 45) riskLevel = '中';
  else riskLevel = '高';

  const reasons: string[] = [];
  if (avgHot > 55) reasons.push('热度适中');
  if (balance <= 2) reasons.push('冷热均衡');
  if (zoneStd < 1.2) reasons.push('四区分布均衡');
  if (oddEvenBalance <= 1) reasons.push('奇偶比例均衡');
  if (avgMissRatio > 60) reasons.push('遗漏值接近回补');

  return {
    numbers,
    probabilityScore: parseFloat(probabilityScore.toFixed(1)),
    hotColdScore: parseFloat(hotColdScore.toFixed(1)),
    structureScore: parseFloat(structureScore.toFixed(1)),
    historySimilarity: parseFloat(historySimilarity.toFixed(1)),
    totalScore,
    riskLevel,
    reasons,
  };
}
