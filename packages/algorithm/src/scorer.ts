import type { NumberStat, ScoreResult } from '@quantum8/types';

export function scoreCombination(
  numbers: number[],
  stats: NumberStat[],
  totalDraws: number
): ScoreResult {
  const selected = stats.filter((s) => numbers.includes(s.number));
  const notSelected = stats.filter((s) => !numbers.includes(s.number));

  const avgHot = selected.reduce((sum, s) => sum + s.hotScore, 0) / selected.length;
  const avgMissRatio = selected.reduce((sum, s) => sum + s.missRatio, 0) / selected.length;
  const probabilityScore = Math.min(100, avgHot * 0.5 + avgMissRatio * 0.5);

  const hotColdBalance = Math.abs(avgHot - 50);
  const hotColdScore = Math.max(0, 100 - hotColdBalance * 2);

  const zones = [0, 0, 0, 0];
  numbers.forEach((n) => {
    if (n <= 20) zones[0]++;
    else if (n <= 40) zones[1]++;
    else if (n <= 60) zones[2]++;
    else zones[3]++;
  });
  const zoneStd = Math.sqrt(zones.reduce((sum, z) => sum + Math.pow(z - numbers.length / 4, 2), 0) / 4);
  const structureScore = Math.max(0, 100 - zoneStd * 20);

  const odd = numbers.filter((n) => n % 2 === 1).length;
  const oddEvenBalance = Math.abs(odd - numbers.length / 2);
  const historySimilarity = Math.max(0, 100 - oddEvenBalance * 15);

  const totalScore = parseFloat(
    (probabilityScore * 0.3 + hotColdScore * 0.25 + structureScore * 0.25 + historySimilarity * 0.2).toFixed(1)
  );

  let riskLevel: '低' | '中' | '高';
  if (totalScore >= 75) riskLevel = '低';
  else if (totalScore >= 50) riskLevel = '中';
  else riskLevel = '高';

  const reasons: string[] = [];
  if (avgHot > 60) reasons.push('所选号码近期热度较高');
  if (avgMissRatio > 80) reasons.push('号码遗漏值接近回补阈值');
  if (zoneStd < 1) reasons.push('四区分布均衡');
  if (oddEvenBalance <= 1) reasons.push('奇偶比例均衡');

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
