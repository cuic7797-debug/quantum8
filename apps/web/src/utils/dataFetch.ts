const CWL_API = "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";
// CORS proxy for browser-based fetching
const CORS_PROXIES = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
];

interface CWLDraw {
  code: string;
  date: string;
  red: string;
}

export interface FetchResult {
  draws: Array<{
    draw_number: string;
    draw_date: string;
    numbers: number[];
    sum_value: number; span: number;
    odd_count: number; even_count: number;
    big_count: number; small_count: number;
    zone1_count: number; zone2_count: number; zone3_count: number; zone4_count: number;
    consecutive_count: number; repeat_count: number;
  }>;
  count: number;
  error?: string;
}

function parseNumbers(red: string): number[] {
  return red.split(",").map(n => parseInt(n.trim(), 10)).filter(n => n >= 1 && n <= 80);
}

function calculateFeatures(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum_value = numbers.reduce((a, b) => a + b, 0);
  const span = sorted[sorted.length - 1] - sorted[0];
  const odd_count = numbers.filter(n => n % 2 === 1).length;
  const even_count = numbers.length - odd_count;
  const big_count = numbers.filter(n => n > 40).length;
  const small_count = numbers.length - big_count;
  const zone1_count = numbers.filter(n => n <= 20).length;
  const zone2_count = numbers.filter(n => n > 20 && n <= 40).length;
  const zone3_count = numbers.filter(n => n > 40 && n <= 60).length;
  const zone4_count = numbers.filter(n => n > 60).length;
  let consecutive_count = 0, streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) streak++;
    else { if (streak >= 2) consecutive_count++; streak = 1; }
  }
  if (streak >= 2) consecutive_count++;
  const repeat_count = numbers.length - new Set(numbers).size;
  return { numbers, sum_value, span, odd_count, even_count, big_count, small_count,
    zone1_count, zone2_count, zone3_count, zone4_count, consecutive_count, repeat_count };
}

async function tryFetch(url: string): Promise<any> {
  // Try direct fetch first
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.cwl.gov.cn/" },
    });
    if (resp.ok) return await resp.json();
  } catch {}

  // Try CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const resp = await fetch(proxy + encodeURIComponent(url));
      if (resp.ok) return await resp.json();
    } catch {}
  }
  return null;
}

export async function fetchFromCWL(count = 100): Promise<FetchResult> {
  try {
    const url = `${CWL_API}?name=kl8&issueCount=${count}`;
    const data = await tryFetch(url);
    if (!data) return { draws: [], count: 0, error: "无法连接福彩官网（CORS限制）" };

    const raw: CWLDraw[] = data.result || [];
    const draws = raw.map(d => {
      const numbers = parseNumbers(d.red);
      const dateStr = d.date.replace(/\(.*\)/, "").trim();
      return { draw_number: d.code, draw_date: dateStr, ...calculateFeatures(numbers) };
    }).filter(d => d.numbers.length === 20);
    return { draws, count: draws.length };
  } catch (err) {
    return { draws: [], count: 0, error: String(err) };
  }
}

export function cacheDraws(draws: any[]) {
  localStorage.setItem('quantum8_cached_draws', JSON.stringify(draws));
  localStorage.setItem('quantum8_cache_time', new Date().toISOString());
}

export function getCachedDraws(): any[] | null {
  try {
    const data = localStorage.getItem('quantum8_cached_draws');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

export function getCacheTime(): string | null {
  return localStorage.getItem('quantum8_cache_time');
}
