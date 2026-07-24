/**
 * 多彩票类型定义
 */

export type LotteryType = 'kl8' | 'ssq' | 'dlt';

export interface LotteryConfig {
  id: LotteryType;
  name: string;
  shortName: string;
  drawDays: string;
  drawTime: string;
  mainPool: number;
  mainPick: number;
  bonusPool?: number;
  bonusPick?: number;
  mainRange: [number, number];
  bonusRange?: [number, number];
  drawCount: number;
  apiEndpoint: string;
  icon: string;
  color: string;
}

export const LOTTERY_CONFIGS: Record<LotteryType, LotteryConfig> = {
  kl8: {
    id: 'kl8',
    name: '快乐8',
    shortName: '快乐八',
    drawDays: '每天',
    drawTime: '21:30',
    mainPool: 80,
    mainPick: 20,
    mainRange: [1, 80],
    drawCount: 20,
    apiEndpoint: 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=kl8&issueCount=100',
    icon: '🎱',
    color: '#3b82f6',
  },
  ssq: {
    id: 'ssq',
    name: '双色球',
    shortName: '双色球',
    drawDays: '周二、四、日',
    drawTime: '21:15',
    mainPool: 33,
    mainPick: 6,
    bonusPool: 16,
    bonusPick: 1,
    mainRange: [1, 33],
    bonusRange: [1, 16],
    drawCount: 7,
    apiEndpoint: 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=ssq&issueCount=100',
    icon: '🔴🔵',
    color: '#ef4444',
  },
  dlt: {
    id: 'dlt',
    name: '大乐透',
    shortName: '大乐透',
    drawDays: '周一、三、六',
    drawTime: '21:10',
    mainPool: 35,
    mainPick: 5,
    bonusPool: 12,
    bonusPick: 2,
    mainRange: [1, 35],
    bonusRange: [1, 12],
    drawCount: 7,
    apiEndpoint: 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=dlt&issueCount=100',
    icon: '⭐🌟',
    color: '#f59e0b',
  },
};

export interface LotteryDraw {
  id: string;
  lottery_type: LotteryType;
  draw_number: string;
  draw_date: string;
  numbers: number[];
  bonus_numbers?: number[];
  sum_value: number;
  odd_count: number;
  even_count: number;
  big_count: number;
  small_count: number;
  zone1_count: number;
  zone2_count: number;
  zone3_count: number;
  zone4_count: number;
  consecutive_count: number;
  span: number;
  repeat_count: number;
}

export interface LotteryNumberStat {
  number: number;
  lottery_type: LotteryType;
  totalAppearances: number;
  currentMiss: number;
  hotScore: number;
  recent10Rate: number;
  recent20Rate: number;
  missRatio: number;
}
