/**
 * 多彩票数据获取工具
 */
import { LOTTERY_CONFIGS, type LotteryType, type LotteryConfig } from '@quantum8/types';
import { supabase } from './supabase';

// Current active lottery (persisted in localStorage)
let currentLottery: LotteryType = (localStorage.getItem('quantum8_lottery') as LotteryType) || 'kl8';

export function getCurrentLottery(): LotteryType {
  const saved = localStorage.getItem('quantum8_lottery') as LotteryType;
  if (saved && LOTTERY_CONFIGS[saved]) currentLottery = saved;
  return currentLottery;
}

export function setCurrentLottery(type: LotteryType) {
  currentLottery = type;
  localStorage.setItem('quantum8_lottery', type);
}

export function getLotteryConfig(type?: LotteryType): LotteryConfig {
  return LOTTERY_CONFIGS[type || currentLottery];
}

// Parse CWL API response for different lottery types
function parseCWLResponse(data: any[], type: LotteryType): any[] {
  const config = LOTTERY_CONFIGS[type];
  return data.map((item: any) => {
    const redNums = (item.red || '').split(',').map(Number).filter(Boolean);
    const blueNums = (item.blue || '').split(',').map(Number).filter(Boolean);
    const kl8Nums = (item.red || '').split(',').map(Number).filter(Boolean);
    
    let numbers: number[];
    let bonusNumbers: number[] | undefined;

    if (type === 'kl8') {
      numbers = kl8Nums;
      bonusNumbers = undefined;
    } else if (type === 'ssq') {
      numbers = redNums;
      bonusNumbers = blueNums;
    } else { // dlt
      numbers = redNums;
      bonusNumbers = blueNums;
    }

    if (!numbers.length) return null;

    const allNums = numbers;
    const sumValue = allNums.reduce((a, b) => a + b, 0);
    const oddCount = allNums.filter(n => n % 2 === 1).length;
    const evenCount = allNums.length - oddCount;
    const bigCount = allNums.filter(n => n > config.mainPool / 2).length;
    const smallCount = allNums.length - bigCount;
    
    // Zone distribution (for kl8: 4 zones of 20; for ssq: 3 zones; for dlt: 3 zones)
    const zoneSize = Math.ceil(config.mainPool / (type === 'kl8' ? 4 : 3));
    const zones = type === 'kl8' ? [0, 0, 0, 0] : [0, 0, 0];
    allNums.forEach(n => {
      const z = Math.min(Math.floor((n - 1) / zoneSize), zones.length - 1);
      zones[z]++;
    });

    // Consecutive count
    const sorted = [...allNums].sort((a, b) => a - b);
    let consec = 0;
    let maxConsec = 0;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === sorted[i - 1] + 1) { consec++; maxConsec = Math.max(maxConsec, consec); }
      else consec = 0;
    }

    return {
      lottery_type: type,
      draw_number: item.code || item.issue || '',
      draw_date: item.date || '',
      numbers,
      bonus_numbers: bonusNumbers,
      sum_value: sumValue,
      odd_count: oddCount,
      even_count: evenCount,
      big_count: bigCount,
      small_count: smallCount,
      zone1_count: zones[0] || 0,
      zone2_count: zones[1] || 0,
      zone3_count: zones[2] || 0,
      zone4_count: zones[3] || 0,
      consecutive_count: maxConsec,
      span: sorted.length > 1 ? sorted[sorted.length - 1] - sorted[0] : 0,
      repeat_count: 0,
    };
  }).filter(Boolean);
}

// Fetch from CWL API
export async function fetchLotteryData(type: LotteryType, count: number = 100): Promise<any[]> {
  const config = LOTTERY_CONFIGS[type];
  try {
    const resp = await fetch(`${config.apiEndpoint}&issueCount=${count}`, {
      headers: { 'Referer': 'https://www.cwl.gov.cn/' },
    });
    const data = await resp.json();
    if (data?.result) {
      return parseCWLResponse(data.result, type);
    }
  } catch {}
  return [];
}

// Save to Supabase
export async function saveLotteryDraws(draws: any[]): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;
  
  for (const draw of draws) {
    const { error } = await supabase
      .from('lottery_draws')
      .upsert(draw, { onConflict: 'lottery_type,draw_number', ignoreDuplicates: true });
    if (error) {
      if (error.code === '23505') skipped++;
      else console.error('Save error:', error);
    } else {
      inserted++;
    }
  }
  
  return { inserted, skipped };
}

// Get draws from Supabase
export async function getLotteryDraws(type: LotteryType, limit: number = 100): Promise<any[]> {
  const { data, error } = await supabase
    .from('lottery_draws')
    .select('*')
    .eq('lottery_type', type)
    .order('draw_number', { ascending: false })
    .limit(limit);
  
  if (error || !data) return [];
  return data;
}
