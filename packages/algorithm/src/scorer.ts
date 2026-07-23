import type { NumberStat, ScoreResult } from '@quantum8/types';

export function scoreCombination(
  numbers: number[],
  stats: NumberStat[],
  totalDraws: number
): ScoreResult {
  const selected = stats.filter(s => numbers.includes(s.number));

  // 1. Probability score (基于热度和频率)
  const avgHot = selected.reduce((sum, s) => sum + s.hotScore, 0) / selected.length;
  const recentRate = selected.reduce((sum, s) => sum + s.recent10Rate, 0) / selected.length;
  const probabilityScore = Math.min(100, Math.max(0, avgHot * 0.6 + recentRate * 0.4));

  // 2. Hot/Cold balance (冷热均衡度)
  const hotCount = selected.filter(s => s.hotScore >= 60).length;
  const coldCount = selected.filter(s => s.currentMiss >= 5).length;
  const warmCount = numbers.length - hotCount - coldCount;
  const balance = Math.abs(hotCount - coldCount);
  const hotColdScore = Math.max(0, 100 - balance * 8 - Math.abs(warmCount - numbers.length * 0.3) * 5);

  // 3. Structure score (结构均衡度)
  const zones = [0, 0, 0, 0];
  numbers.forEach(n => {
    if (n <= 20) zones[0]++;
    else if (n <= 40) zones[1]++;
    else if (n <= 60) zones[2]++;
    else zones[3]++;
  });
  const expected = numbers.length / 4;
  const zoneStd = Math.sqrt(zones.reduce((sum, z) => sum + Math.pow(z - expected, 2), 0) / 4);
  const zoneScore = Math.max(0, 100 - zoneStd * 20);

  const odd = numbers.filter(n => n % 2 === 1).length;
  const oddEvenBalance = Math.abs(odd - numbers.length / 2);
  const oddEvenScore = Math.max(0, 100 - oddEvenBalance * 12);

  // 连号评估
  const sorted = [...numbers].sort((a, b) => a - b);
  let consecCount = 0;
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) streak++;
    else { if (streak >= 2) consecCount++; streak = 1; }
  }
  if (streak >= 2) consecCount++;
  const consecScore = Math.max(0, 100 - consecCount * 15);

  // 大小比评估
  const bigCount = numbers.filter(n => n > 40).length;
  const bigSmallBalance = Math.abs(bigCount - numbers.length / 2);
  const bigSmallScore = Math.max(0, 100 - bigSmallBalance * 12);

  const structureScore = zoneScore * 0.3 + oddEvenScore * 0.25 + consecScore * 0.25 + bigSmallScore * 0.2;

  // 4. History similarity (基于遗漏比的回补概率)
  const avgMissRatio = selected.length > 0
    ? selected.reduce((sum, s) => sum + (isNaN(s.missRatio) ? 50 : s.missRatio), 0) / selected.length
    : 50;
  const avgCurrentMiss = selected.reduce((sum, s) => sum + s.currentMiss, 0) / selected.length;
  const avgMaxMiss = selected.reduce((sum, s) => sum + s.maxMiss, 0) / selected.length;
  const missRecovery = avgMaxMiss > 0 ? (avgCurrentMiss / avgMaxMiss) * 100 : 50;
  const historySimilarity = Math.min(100, Math.max(0, avgMissRatio * 0.5 + missRecovery * 0.3 + avgCurrentMiss * 2));

  // 5. 和值合理性评估
  const sum = numbers.reduce((a, b) => a + b, 0);
  const expectedSum = numbers.length * 40.5;
  const sumDeviation = Math.abs(sum - expectedSum) / expectedSum;
  const sumScore = Math.max(0, 100 - sumDeviation * 200);

  // 6. 号码间距评估
  let avgGap = 0;
  for (let i = 1; i < sorted.length; i++) avgGap += sorted[i] - sorted[i - 1];
  avgGap /= Math.max(1, sorted.length - 1);
  const idealGap = 80 / numbers.length;
  const gapScore = Math.max(0, 100 - Math.abs(avgGap - idealGap) * 3);

  // Weighted total
  const totalScore = parseFloat(
    (probabilityScore * 0.25 +
     hotColdScore * 0.2 +
     structureScore * 0.2 +
     historySimilarity * 0.15 +
     sumScore * 0.1 +
     gapScore * 0.1).toFixed(1)
  );

  // Risk level
  let riskLevel: '低' | '中' | '高';
  if (totalScore >= 65) riskLevel = '低';
  else if (totalScore >= 40) riskLevel = '中';
  else riskLevel = '高';

  // Reasons
  const reasons: string[] = [];
  if (avgHot > 55) reasons.push('热度适中');
  if (balance <= 2) reasons.push('冷热均衡');
  if (zoneStd < 1.2) reasons.push('四区均衡');
  if (oddEvenBalance <= 1) reasons.push('奇偶均衡');
  if (consecCount <= 2) reasons.push('连号适中');
  if (avgMissRatio > 60) reasons.push('遗漏回补');
  if (sumScore > 70) reasons.push('和值合理');
  if (gapScore > 70) reasons.push('间距均匀');

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
