/**
 * 遗传算法选号
 * 模拟自然选择，迭代优化号码组合
 */

export interface GeneticConfig {
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteRate: number;
  targetCount: number;
  killedNumbers: number[];
}

export interface GeneticResult {
  bestCombination: number[];
  bestFitness: number;
  generation: number;
  fitnessHistory: number[];
}

function createRandomIndividual(pool: number[], count: number): number[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).sort((a, b) => a - b);
}

function fitness(
  individual: number[],
  frequency: Map<number, number>,
  missData: Map<number, number>,
  totalDraws: number
): number {
  let score = 0;

  // Frequency bonus
  individual.forEach(n => {
    const freq = (frequency.get(n) || 0) / Math.max(totalDraws, 1);
    score += freq * 30;
  });

  // Miss recovery bonus (overdue numbers)
  individual.forEach(n => {
    const miss = missData.get(n) || 0;
    if (miss > 5) score += Math.min(miss * 1.5, 15);
  });

  // Zone balance
  const zones = [0, 0, 0, 0];
  individual.forEach(n => {
    const z = Math.floor((n - 1) / 20);
    zones[Math.min(z, 3)]++;
  });
  const zoneAvg = individual.length / 4;
  const zoneVariance = zones.reduce((s, z) => s + Math.pow(z - zoneAvg, 2), 0) / 4;
  score += Math.max(0, 15 - zoneVariance * 3);

  // Odd/even balance
  const odd = individual.filter(n => n % 2 === 1).length;
  const even = individual.length - odd;
  const oeBalance = 1 - Math.abs(odd - even) / individual.length;
  score += oeBalance * 10;

  // Sum rationality
  const sum = individual.reduce((a, b) => a + b, 0);
  const idealSum = individual.length * 40.5;
  const sumDev = Math.abs(sum - idealSum) / idealSum;
  score += Math.max(0, 10 - sumDev * 20);

  // Spread (gap uniformity)
  const sorted = [...individual].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i] - sorted[i - 1]);
  const avgGap = gaps.reduce((a, b) => a + b, 0) / Math.max(gaps.length, 1);
  const gapVariance = gaps.reduce((s, g) => s + Math.pow(g - avgGap, 2), 0) / Math.max(gaps.length, 1);
  score += Math.max(0, 10 - gapVariance * 0.1);

  return score;
}

function crossover(parent1: number[], parent2: number[], pool: number[]): number[] {
  const child = new Set<number>();
  const mid = Math.floor(parent1.length / 2);
  parent1.slice(0, mid).forEach(n => child.add(n));
  parent2.slice(mid).forEach(n => child.add(n));
  
  // Fill remaining from pool
  const remaining = pool.filter(n => !child.has(n)).sort(() => Math.random() - 0.5);
  while (child.size < parent1.length && remaining.length > 0) {
    child.add(remaining.pop()!);
  }
  return [...child].sort((a, b) => a - b).slice(0, parent1.length);
}

function mutate(individual: number[], pool: number[], rate: number): number[] {
  const result = [...individual];
  for (let i = 0; i < result.length; i++) {
    if (Math.random() < rate) {
      const available = pool.filter(n => !result.includes(n));
      if (available.length > 0) {
        result[i] = available[Math.floor(Math.random() * available.length)];
      }
    }
  }
  return result.sort((a, b) => a - b);
}

export function geneticAlgorithm(
  draws: { numbers: number[] }[],
  config: GeneticConfig
): GeneticResult {
  const {
    populationSize = 100,
    generations = 50,
    mutationRate = 0.15,
    crossoverRate = 0.7,
    eliteRate = 0.1,
    targetCount = 8,
    killedNumbers = [],
  } = config;

  const pool = Array.from({ length: 80 }, (_, i) => i + 1).filter(n => !killedNumbers.includes(n));
  if (pool.length < targetCount) {
    return { bestCombination: pool.slice(0, targetCount), bestFitness: 0, generation: 0, fitnessHistory: [] };
  }

  // Build frequency and miss data
  const frequency = new Map<number, number>();
  const missData = new Map<number, number>();
  const lookback = Math.min(draws.length, 50);
  
  draws.slice(0, lookback).forEach(d => {
    d.numbers.forEach(n => frequency.set(n, (frequency.get(n) || 0) + 1));
  });

  // Calculate current miss
  for (let n = 1; n <= 80; n++) {
    let miss = 0;
    for (let i = 0; i < draws.length; i++) {
      if (draws[i].numbers.includes(n)) break;
      miss++;
    }
    missData.set(n, miss);
  }

  // Initialize population
  let population: number[][] = [];
  for (let i = 0; i < populationSize; i++) {
    population.push(createRandomIndividual(pool, targetCount));
  }

  const fitnessHistory: number[] = [];
  let bestEver: number[] = population[0];
  let bestFitnessEver = 0;

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate fitness
    const scored = population.map(ind => ({
      ind,
      score: fitness(ind, frequency, missData, lookback),
    })).sort((a, b) => b.score - a.score);

    fitnessHistory.push(scored[0].score);

    if (scored[0].score > bestFitnessEver) {
      bestFitnessEver = scored[0].score;
      bestEver = [...scored[0].ind];
    }

    // Elite selection
    const eliteCount = Math.max(2, Math.floor(populationSize * eliteRate));
    const nextPop = scored.slice(0, eliteCount).map(s => [...s.ind]);

    // Fill rest with crossover + mutation
    while (nextPop.length < populationSize) {
      const p1 = scored[Math.floor(Math.random() * Math.floor(populationSize * 0.5))].ind;
      const p2 = scored[Math.floor(Math.random() * Math.floor(populationSize * 0.5))].ind;
      
      let child: number[];
      if (Math.random() < crossoverRate) {
        child = crossover(p1, p2, pool);
      } else {
        child = [...p1];
      }

      child = mutate(child, pool, mutationRate);
      
      // Ensure valid
      if (child.length === targetCount && child.every(n => pool.includes(n))) {
        nextPop.push(child);
      }
    }

    population = nextPop;
  }

  return {
    bestCombination: bestEver,
    bestFitness: Math.round(bestFitnessEver * 100) / 100,
    generation: generations,
    fitnessHistory,
  };
}
