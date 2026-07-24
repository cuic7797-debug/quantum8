const CWL_API = "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";

// Multiple CORS proxy options for reliability
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

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
  source: string;
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

async function tryFetchWithTimeout(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.cwl.gov.cn/" },
    });
    clearTimeout(timer);
    if (resp.ok) return await resp.json();
  } catch { clearTimeout(timer); }
  return null;
}

export async function fetchFromCWL(count = 100): Promise<FetchResult> {
  const url = `${CWL_API}?name=kl8&issueCount=${count}`;

  // Try 1: Direct fetch (works from server/worker)
  try {
    const data = await tryFetchWithTimeout(url, 10000);
    if (data?.result) {
      const draws = parseCWLResult(data.result);
      if (draws.length > 0) return { draws, count: draws.length, source: 'cwl-direct' };
    }
  } catch {}

  // Try 2: CORS proxies
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i](url);
      const data = await tryFetchWithTimeout(proxyUrl, 12000);
      if (data?.result) {
        const draws = parseCWLResult(data.result);
        if (draws.length > 0) return { draws, count: draws.length, source: `proxy-${i + 1}` };
      }
    } catch {}
  }

  // Try 3: Return cached data as fallback
  const cached = getCachedDraws();
  if (cached && cached.length > 0) {
    return { draws: cached, count: cached.length, source: 'cache', error: '使用本地缓存数据（网络不可用）' };
  }

  return { draws: [], count: 0, source: 'none', error: '无法连接福彩官网，请检查网络或稍后重试' };
}

function parseCWLResult(result: any[]): FetchResult['draws'] {
  return result.map(d => {
    const numbers = parseNumbers(d.red);
    const dateStr = d.date?.replace(/\(.*\)/, "").trim() || "";
    return { draw_number: d.code || '', draw_date: dateStr, ...calculateFeatures(numbers) };
  }).filter(d => d.numbers.length === 20 && d.draw_number);
}

export function cacheDraws(draws: any[]) {
  try {
    // Keep last 500 draws in cache
    const toCache = draws.slice(0, 500);
    localStorage.setItem('quantum8_cached_draws', JSON.stringify(toCache));
    localStorage.setItem('quantum8_cache_time', new Date().toISOString());
  } catch {}
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

// Check data freshness
export function getDataFreshness(): { status: 'fresh' | 'stale' | 'old' | 'none'; hours: number; message: string } {
  const cacheTime = getCacheTime();
  if (!cacheTime) return { status: 'none', hours: -1, message: '无缓存数据' };
  
  const hours = Math.round((Date.now() - new Date(cacheTime).getTime()) / (1000 * 60 * 60));
  if (hours < 24) return { status: 'fresh', hours, message: `数据更新于 ${hours} 小时前` };
  if (hours < 72) return { status: 'stale', hours, message: `数据更新于 ${hours} 小时前，建议刷新` };
  return { status: 'old', hours, message: `数据已过期（${hours} 小时前），请刷新` };
}
