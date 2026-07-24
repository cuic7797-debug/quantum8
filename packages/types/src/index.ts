// 开奖数据
export interface Draw {
  id: string;
  drawNumber: string;
  drawDate: string;
  numbers: number[];
  sumValue: number;
  span: number;
  oddCount: number;
  evenCount: number;
  bigCount: number;
  smallCount: number;
  zone1Count: number;
  zone2Count: number;
  zone3Count: number;
  zone4Count: number;
  consecutiveCount: number;
  repeatCount: number;
}

export interface NumberStat {
  number: number;
  totalAppearances: number;
  recent10Rate: number;
  recent20Rate: number;
  recent50Rate: number;
  currentMiss: number;
  avgMiss: number;
  maxMiss: number;
  missRatio: number;
  hotScore: number;
  coldScore: number;
}

export interface NumberPair {
  numberA: number;
  numberB: number;
  coAppearCount: number;
  coAppearRate: number;
}

export type PlayType = '选一' | '选二' | '选三' | '选四' | '选五' | '选六' | '选七' | '选八' | '选九' | '选十';
export type NoteType = '单式' | '复式' | '胆拖';

export interface Selection {
  id: string;
  userId: string;
  playType: PlayType;
  noteType: NoteType;
  numbers: number[];
  danNumbers?: number[];
  tuoNumbers?: number[];
  strategy?: string;
  score?: number;
  riskLevel?: string;
  createdAt: string;
}

export interface Strategy {
  id: string;
  userId: string;
  name: string;
  description?: string;
  config: StrategyConfig;
  isPublic: boolean;
  backtestResult?: BacktestResult;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyConfig {
  hotCount: number;
  coldCount: number;
  balanceCount: number;
  zoneBalance: boolean;
  sumRange: [number, number];
  oddEvenRange: [number, number];
  maxConsecutive: number;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  playType: PlayType;
  testRounds: number;
  totalBets: number;
  hitCount: number;
  hitRate: number;
  totalCost: number;
  totalPrize: number;
  roi: number;
  maxPrize: number;
  detail?: any;
}

export interface ScoreResult {
  numbers: number[];
  probabilityScore: number;
  hotColdScore: number;
  structureScore: number;
  historySimilarity: number;
  totalScore: number;
  riskLevel: '低' | '中' | '高';
  reasons: string[];
}

// 多彩票类型
export * from './lottery';
