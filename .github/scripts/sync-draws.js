const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const CWL_API = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=kl8&issueCount=10';

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.cwl.gov.cn/',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(new Error(`Parse error: ${data.slice(0,200)}`)); } });
    }).on('error', reject);
  });
}

function supabaseReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, SUPABASE_URL);
    const opts = {
      method, hostname: url.hostname, path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function parseNumbers(red) {
  return red.split(',').map(n => parseInt(n.trim())).filter(n => n >= 1 && n <= 80);
}

function calcFeatures(numbers) {
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

async function main() {
  console.log(`[${new Date().toISOString()}] Starting sync...`);

  // 1. Fetch from CWL API
  let data;
  try {
    data = await fetchJSON(CWL_API);
  } catch (e) {
    console.error('Failed to fetch CWL API:', e.message);
    process.exit(1);
  }

  if (!data?.result?.length) {
    console.log('No data from CWL API');
    process.exit(0);
  }

  console.log(`Fetched ${data.result.length} draws`);

  // 2. Get existing
  const existing = await supabaseReq('GET', '/rest/v1/draws?select=draw_number');
  const existSet = new Set(existing.map(d => d.draw_number));

  // 3. Insert new
  let inserted = 0, skipped = 0;
  for (const d of data.result) {
    if (existSet.has(d.code)) { skipped++; continue; }
    const numbers = parseNumbers(d.red);
    if (numbers.length !== 20) continue;
    const dateStr = d.date.replace(/\(.*\)/, '').trim();
    const features = calcFeatures(numbers);
    await supabaseReq('POST', '/rest/v1/draws', { draw_number: d.code, draw_date: dateStr, ...features });
    inserted++;
    console.log(`  + ${d.code} (${dateStr})`);
  }

  console.log(`Inserted: ${inserted}, Skipped: ${skipped}`);

  // 4. Update stats if new data
  if (inserted > 0) {
    console.log('Updating number stats...');
    const allDraws = await supabaseReq('GET', '/rest/v1/draws?select=*&order=draw_date.desc&limit=200');
    if (Array.isArray(allDraws) && allDraws.length > 0) {
      await supabaseReq('DELETE', '/rest/v1/number_stats?number=neq.0');
      const stats = [];
      for (let num = 1; num <= 80; num++) {
        const totalAppearances = allDraws.filter(d => d.numbers?.includes(num)).length;
        const recent10 = allDraws.slice(0, 10).filter(d => d.numbers?.includes(num)).length;
        const recent20 = allDraws.slice(0, 20).filter(d => d.numbers?.includes(num)).length;
        const recent50 = allDraws.slice(0, 50).filter(d => d.numbers?.includes(num)).length;
        let currentMiss = 0;
        for (const draw of allDraws) { if (draw.numbers?.includes(num)) break; currentMiss++; }
        const missPeriods = [];
        let lastSeen = -1;
        for (let i = 0; i < allDraws.length; i++) {
          if (allDraws[i].numbers?.includes(num)) { if (lastSeen >= 0) missPeriods.push(i - lastSeen); lastSeen = i; }
        }
        const avgMiss = missPeriods.length > 0 ? missPeriods.reduce((a, b) => a + b, 0) / missPeriods.length : 0;
        const maxMiss = missPeriods.length > 0 ? Math.max(...missPeriods) : currentMiss;
        const recentRate = (recent10 / 10) * 100;
        const deviation = recentRate - 25;
        const missRatio = avgMiss > 0 ? Math.min(100, (currentMiss / avgMiss) * 100) : 0;
        const hotScore = Math.max(0, Math.min(100, 50 + deviation * 5));
        const coldScore = Math.max(0, Math.min(100, 100 - hotScore));
        stats.push({ number: num, total_appearances: totalAppearances,
          recent_10_rate: parseFloat(((recent10 / 10) * 100).toFixed(1)),
          recent_20_rate: parseFloat(((recent20 / 20) * 100).toFixed(1)),
          recent_50_rate: parseFloat(((recent50 / Math.min(50, allDraws.length)) * 100).toFixed(1)),
          current_miss: currentMiss, avg_miss: parseFloat(avgMiss.toFixed(1)), max_miss: maxMiss,
          miss_ratio: parseFloat(missRatio.toFixed(1)),
          hot_score: parseFloat(hotScore.toFixed(1)), cold_score: parseFloat(coldScore.toFixed(1)) });
      }
      for (let i = 0; i < stats.length; i += 20) {
        await supabaseReq('POST', '/rest/v1/number_stats', stats.slice(i, i + 20));
      }
      console.log(`Updated ${stats.length} number stats`);
    }
  }

  console.log('Sync complete!');
}

main().catch(e => { console.error('Error:', e.message); process.exit(1); });
