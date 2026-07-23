/**
 * Quantum8 高级算法模块
 * 包含：马尔可夫链、贝叶斯推断、信息熵、关联规则、集成评分
 */

// ============ 马尔可夫链转移概率 ============
// 分析号码出现的状态转移规律

export interface MarkovResult {
  number: number;
  transitionProb: number;  // 从"未出现"到"出现"的转移概率
  stateHistory: number[];   // 最近10期的状态序列 (1=出现, 0=未出现)
  predictedProb: number;    // 下一期出现的预测概率
}

export function markovTransition(
  number: number,
  draws: { numbers: number[] }[],
  lookback: number = 30
): MarkovResult {
  const recent = draws.slice(0, lookback);
  const states = recent.map(d => d.numbers.includes(number) ? 1 : 0);

  // 计算转移矩阵
  let t00 = 0, t01 = 0, t10 = 0, t11 = 0;
  for (let i = 1; i < states.length; i++) {
    if (states[i - 1] === 0 && states[i] === 0) t00++;
    if (states[i - 1] === 0 && states[i] === 1) t01++;
    if (states[i - 1] === 1 && states[i] === 0) t10++;
    if (states[i - 1] === 1 && states[i] === 1) t11++;
  }

  const from0 = t00 + t01;
  const from1 = t10 + t11;
  const transitionProb = from0 > 0 ? t01 / from0 : 0.25;
  const stayProb = from1 > 0 ? t11 / from1 : 0.25;

  // 当前状态是0（未出现），预测下一期
  const currentState = states[0] || 0;
  const predictedProb = currentState === 0 ? transitionProb : stayProb;

  return {
    number,
    transitionProb: parseFloat(transitionProb.toFixed(4)),
    stateHistory: states.slice(0, 10),
    predictedProb: parseFloat(predictedProb.toFixed(4)),
  };
}

// ============ 贝叶斯推断 ============
// 结合先验概率和观测数据计算后验概率

export interface BayesianResult {
  number: number;
  priorProb: number;      // 先验概率 (理论出现率)
  likelihood: number;      // 似然度 (基于近期数据)
  posteriorProb: number;   // 后验概率
  confidence: number;      // 置信度
}

export function bayesianInference(
  number: number,
  draws: { numbers: number[] }[],
  priorWeight: number = 0.3
): BayesianResult {
  const totalDraws = draws.length;
  const theoreticalRate = 20 / 80; // 20个号码从80个中选

  // 先验概率
  const priorProb = theoreticalRate;

  // 似然度：基于近10期数据
  const recent10 = draws.slice(0, 10);
  const recentAppear = recent10.filter(d => d.numbers.includes(number)).length;
  const likelihood = recentAppear / 10;

  // 近20期数据
  const recent20 = draws.slice(0, 20);
  const recent20Appear = recent20.filter(d => d.numbers.includes(number)).length;
  const likelihood20 = recent20Appear / 20;

  // 贝叶斯更新：后验 = (先验 × 似然) / 证据
  const combinedLikelihood = likelihood * 0.7 + likelihood20 * 0.3;
  const posteriorProb = (priorProb * (1 - priorWeight) + combinedLikelihood * priorWeight);

  // 置信度基于数据量
  const confidence = Math.min(0.95, 0.5 + totalDraws * 0.005);

  return {
    number,
    priorProb: parseFloat(priorProb.toFixed(4)),
    likelihood: parseFloat(combinedLikelihood.toFixed(4)),
    posteriorProb: parseFloat(posteriorProb.toFixed(4)),
    confidence: parseFloat(confidence.toFixed(4)),
  };
}

// ============ 信息熵分析 ============
// 评估号码出现的不确定性/混乱度

export interface EntropyResult {
  number: number;
  entropy: number;          // 信息熵 (越高越不确定)
  stability: number;        // 稳定性 (1 - 归一化熵)
  predictability: number;   // 可预测性分数
}

export function calculateEntropy(
  number: number,
  draws: { numbers: number[] }[],
  window: number = 20
): EntropyResult {
  const recent = draws.slice(0, window);
  const states = recent.map(d => d.numbers.includes(number) ? 1 : 0);

  // 计算概率分布
  const p1 = states.filter(s => s === 1).length / states.length;
  const p0 = 1 - p1;

  // 信息熵 H = -p1*log2(p1) - p0*log2(p0)
  let entropy = 0;
  if (p1 > 0) entropy -= p1 * Math.log2(p1);
  if (p0 > 0) entropy -= p0 * Math.log2(p0);

  // 归一化到 0-1
  const maxEntropy = 1; // 二元分布最大熵
  const normalizedEntropy = entropy / maxEntropy;

  const stability = 1 - normalizedEntropy;
  const predictability = stability * (p1 > 0.3 ? 1 : 0.5);

  return {
    number,
    entropy: parseFloat(entropy.toFixed(4)),
    stability: parseFloat(stability.toFixed(4)),
    predictability: parseFloat(predictability.toFixed(4)),
  };
}

// ============ 关联规则挖掘 (Apriori) ============
// 发现号码之间的频繁共现模式

export interface AssociationRule {
  antecedent: number[];     // 前项（条件号码）
  consequent: number[];     // 后项（结果号码）
  support: number;          // 支持度
  confidence: number;       // 置信度
  lift: number;             // 提升度
}

export function findAssociationRules(
  draws: { numbers: number[] }[],
  minSupport: number = 0.05,
  minConfidence: number = 0.3,
  maxAntecedent: number = 3
): AssociationRule[] {
  const totalDraws = draws.length;
  const rules: AssociationRule[] = [];

  // 统计单个号码频率
  const freq = new Map<number, number>();
  draws.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));

  // 频繁1-项集
  const frequent1 = [...freq.entries()]
    .filter(([_, count]) => count / totalDraws >= minSupport)
    .map(([num]) => num)
    .sort((a, b) => (freq.get(b) || 0) - (freq.get(a) || 0))
    .slice(0, 20); // 取top 20

  // 生成2-项集和3-项集的关联规则
  for (let i = 0; i < frequent1.length; i++) {
    for (let j = i + 1; j < frequent1.length; j++) {
      const pair = [frequent1[i], frequent1[j]];
      const pairCount = draws.filter(d => pair.every(n => d.numbers.includes(n))).length;
      const pairSupport = pairCount / totalDraws;

      if (pairSupport >= minSupport) {
        // A → B 的置信度
        const confAB = pairCount / (freq.get(pair[0]) || 1);
        const confBA = pairCount / (freq.get(pair[1]) || 1);
        const expectedRate = (freq.get(pair[0]) || 0) / totalDraws;

        if (confAB >= minConfidence) {
          rules.push({
            antecedent: [pair[0]],
            consequent: [pair[1]],
            support: parseFloat(pairSupport.toFixed(4)),
            confidence: parseFloat(confAB.toFixed(4)),
            lift: parseFloat((confAB / (expectedRate || 0.25)).toFixed(4)),
          });
        }
        if (confBA >= minConfidence) {
          rules.push({
            antecedent: [pair[1]],
            consequent: [pair[0]],
            support: parseFloat(pairSupport.toFixed(4)),
            confidence: parseFloat(confBA.toFixed(4)),
            lift: parseFloat((confBA / ((freq.get(pair[0]) || 0) / totalDraws || 0.25)).toFixed(4)),
          });
        }
      }
    }
  }

  return rules.sort((a, b) => b.lift - a.lift).slice(0, 30);
}

// ============ 集成评分 (Ensemble) ============
// 综合多种算法的评分，类似随机森林的思想

export interface EnsembleResult {
  number: number;
  markovScore: number;
  bayesianScore: number;
  entropyScore: number;
  frequencyScore: number;
  missScore: number;
  ensembleScore: number;    // 加权集成总分
  rank: number;
}

export function ensembleScoring(
  draws: { numbers: number[] }[],
  stats: { number: number; hotScore: number; currentMiss: number; avgMiss: number; missRatio: number; recent10Rate: number }[]
): EnsembleResult[] {
  const results: EnsembleResult[] = [];

  for (const stat of stats) {
    // 马尔可夫得分
    const markov = markovTransition(stat.number, draws);
    const markovScore = markov.predictedProb * 100;

    // 贝叶斯得分
    const bayesian = bayesianInference(stat.number, draws);
    const bayesianScore = bayesian.posteriorProb * 100;

    // 熵得分（稳定性高的得分高）
    const entropy = calculateEntropy(stat.number, draws);
    const entropyScore = entropy.stability * 100;

    // 频率得分
    const frequencyScore = stat.recent10Rate;

    // 遗漏回补得分
    const missScore = Math.min(100, stat.missRatio);

    // 加权集成
    const ensembleScore = (
      markovScore * 0.20 +
      bayesianScore * 0.20 +
      entropyScore * 0.15 +
      frequencyScore * 0.25 +
      missScore * 0.20
    );

    results.push({
      number: stat.number,
      markovScore: parseFloat(markovScore.toFixed(1)),
      bayesianScore: parseFloat(bayesianScore.toFixed(1)),
      entropyScore: parseFloat(entropyScore.toFixed(1)),
      frequencyScore: parseFloat(frequencyScore.toFixed(1)),
      missScore: parseFloat(missScore.toFixed(1)),
      ensembleScore: parseFloat(ensembleScore.toFixed(1)),
      rank: 0,
    });
  }

  // 排序并分配排名
  results.sort((a, b) => b.ensembleScore - a.ensembleScore);
  results.forEach((r, i) => r.rank = i + 1);

  return results;
}

// ============ 趋势回归分析 ============
// 线性回归预测号码出现趋势

export interface TrendResult {
  number: number;
  slope: number;           // 斜率（正=上升趋势，负=下降趋势）
  intercept: number;
  r2: number;              // R² 拟合度
  predicted: number;       // 下一期预测值
  trend: '上升' | '下降' | '平稳';
}

export function trendRegression(
  number: number,
  draws: { numbers: number[] }[],
  window: number = 20
): TrendResult {
  const recent = draws.slice(0, window);
  // 滑动窗口出现率
  const rates: number[] = [];
  for (let i = 0; i < recent.length - 4; i++) {
    const windowDraws = recent.slice(i, i + 5);
    const appear = windowDraws.filter(d => d.numbers.includes(number)).length;
    rates.push(appear / 5);
  }

  if (rates.length < 3) {
    return { number, slope: 0, intercept: 0.25, r2: 0, predicted: 0.25, trend: '平稳' };
  }

  // 线性回归 y = ax + b
  const n = rates.length;
  const xMean = (n - 1) / 2;
  const yMean = rates.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0, ssXX = 0, ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (rates[i] - yMean);
    ssXX += (i - xMean) * (i - xMean);
  }

  const slope = ssXX > 0 ? ssXY / ssXX : 0;
  const intercept = yMean - slope * xMean;

  // R²
  for (let i = 0; i < n; i++) {
    const predicted = intercept + slope * i;
    ssRes += (rates[i] - predicted) ** 2;
    ssTot += (rates[i] - yMean) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  // 预测下一期
  const predicted = Math.max(0, Math.min(1, intercept + slope * n));

  const trend = slope > 0.02 ? '上升' : slope < -0.02 ? '下降' : '平稳';

  return {
    number,
    slope: parseFloat(slope.toFixed(4)),
    intercept: parseFloat(intercept.toFixed(4)),
    r2: parseFloat(r2.toFixed(4)),
    predicted: parseFloat(predicted.toFixed(4)),
    trend,
  };
}
