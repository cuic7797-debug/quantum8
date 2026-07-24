/**
 * 号码聚类分析
 * 将80个号码按特征自动分成热/温/冷/冰4个簇
 */

export interface ClusterResult {
  number: number;
  cluster: 'hot' | 'warm' | 'cool' | 'cold';
  features: {
    frequency: number;
    recency: number;
    missTrend: number;
    volatility: number;
  };
  score: number;
}

export interface ClusterSummary {
  hot: number[];
  warm: number[];
  cool: number[];
  cold: number[];
  centroids: { hot: number; warm: number; cool: number; cold: number };
}

function calculateFeatures(
  number: number,
  draws: { numbers: number[] }[],
  lookback: number = 50
): ClusterResult['features'] {
  const recent = draws.slice(0, lookback);
  
  // Frequency
  const frequency = recent.filter(d => d.numbers.includes(number)).length / lookback;

  // Recency (how recently did it appear)
  let recency = lookback;
  for (let i = 0; i < recent.length; i++) {
    if (recent[i].numbers.includes(number)) {
      recency = i;
      break;
    }
  }
  recency = 1 - recency / lookback; // Normalize: 1 = appeared last draw, 0 = never appeared

  // Miss trend (is the miss increasing or decreasing?)
  const recent10 = draws.slice(0, 10);
  const prev10 = draws.slice(10, 20);
  const recentRate = recent10.filter(d => d.numbers.includes(number)).length / 10;
  const prevRate = prev10.length > 0 ? prev10.filter(d => d.numbers.includes(number)).length / prev10.length : 0;
  const missTrend = recentRate - prevRate; // Positive = improving, negative = declining

  // Volatility (how inconsistent is the appearance)
  const windows = 5;
  const windowSize = Math.floor(lookback / windows);
  const rates: number[] = [];
  for (let i = 0; i < windows; i++) {
    const start = i * windowSize;
    const windowDraws = recent.slice(start, start + windowSize);
    rates.push(windowDraws.filter(d => d.numbers.includes(number)).length / windowSize);
  }
  const avgRate = rates.reduce((a, b) => a + b, 0) / windows;
  const volatility = Math.sqrt(rates.reduce((s, r) => s + Math.pow(r - avgRate, 2), 0) / windows);

  return { frequency, recency, missTrend, volatility };
}

function clusterScore(features: ClusterResult['features']): number {
  return features.frequency * 35 + features.recency * 30 + (features.missTrend + 0.5) * 20 + (1 - features.volatility) * 15;
}

export function clusterNumbers(
  draws: { numbers: number[] }[],
  lookback: number = 50
): ClusterSummary {
  const results: ClusterResult[] = [];

  for (let n = 1; n <= 80; n++) {
    const features = calculateFeatures(n, draws, lookback);
    const score = clusterScore(features);
    
    let cluster: ClusterResult['cluster'];
    if (score >= 70) cluster = 'hot';
    else if (score >= 50) cluster = 'warm';
    else if (score >= 30) cluster = 'cool';
    else cluster = 'cold';

    results.push({ number: n, cluster, features, score });
  }

  const hot = results.filter(r => r.cluster === 'hot').map(r => r.number);
  const warm = results.filter(r => r.cluster === 'warm').map(r => r.number);
  const cool = results.filter(r => r.cluster === 'cool').map(r => r.number);
  const cold = results.filter(r => r.cluster === 'cold').map(r => r.number);

  return {
    hot, warm, cool, cold,
    centroids: {
      hot: hot.length > 0 ? hot.reduce((a, b) => a + b, 0) / hot.length : 0,
      warm: warm.length > 0 ? warm.reduce((a, b) => a + b, 0) / warm.length : 0,
      cool: cool.length > 0 ? cool.reduce((a, b) => a + b, 0) / cool.length : 0,
      cold: cold.length > 0 ? cold.reduce((a, b) => a + b, 0) / cold.length : 0,
    },
  };
}

export function getClusterDetails(
  draws: { numbers: number[] }[],
  lookback: number = 50
): ClusterResult[] {
  const results: ClusterResult[] = [];
  for (let n = 1; n <= 80; n++) {
    const features = calculateFeatures(n, draws, lookback);
    const score = clusterScore(features);
    let cluster: ClusterResult['cluster'];
    if (score >= 70) cluster = 'hot';
    else if (score >= 50) cluster = 'warm';
    else if (score >= 30) cluster = 'cool';
    else cluster = 'cold';
    results.push({ number: n, cluster, features, score });
  }
  return results;
}
