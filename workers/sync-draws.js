// Cloudflare Worker - 每日自动同步开奖数据
// 部署方式: wrangler deploy
// 触发方式: wrangler cron 添加定时触发

const SUPABASE_URL = 'https://gomowvpstlmwcvvgnujo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_7Sl3_rntp_65_3xK4nDu2g_KXqMdgbq';
const CWL_API = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=kl8&issueCount=10';

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(syncDraws());
  },

  async fetch(request, env, ctx) {
    // 手动触发同步
    if (request.url.includes('/sync')) {
      const result = await syncDraws();
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
    return new Response('Quantum8 Data Sync Worker', { status: 200 });
  },
};

async function syncDraws() {
  try {
    // Fetch from CWL API
    const resp = await fetch(CWL_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.cwl.gov.cn/',
      },
    });
    const data = await resp.json();
    if (!data?.result?.length) return { error: 'No data from API', inserted: 0 };

    // Get existing draws
    const existResp = await fetch(`${SUPABASE_URL}/rest/v1/draws?select=draw_number`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
    });
    const existing = await existResp.json();
    const existSet = new Set(existing.map(d => d.draw_number));

    let inserted = 0;
    for (const d of data.result) {
      if (existSet.has(d.code)) continue;
      const numbers = d.red.split(',').map(n => parseInt(n.trim())).filter(n => n >= 1 && n <= 80);
      if (numbers.length !== 20) continue;

      const sorted = [...numbers].sort((a, b) => a - b);
      const features = {
        numbers,
        sum_value: numbers.reduce((a, b) => a + b, 0),
        span: sorted[sorted.length - 1] - sorted[0],
        odd_count: numbers.filter(n => n % 2 === 1).length,
        even_count: numbers.filter(n => n % 2 === 0).length,
        big_count: numbers.filter(n => n > 40).length,
        small_count: numbers.filter(n => n <= 40).length,
        zone1_count: numbers.filter(n => n <= 20).length,
        zone2_count: numbers.filter(n => n > 20 && n <= 40).length,
        zone3_count: numbers.filter(n => n > 40 && n <= 60).length,
        zone4_count: numbers.filter(n => n > 60).length,
        consecutive_count: 0,
        repeat_count: 0,
      };

      // Calculate consecutive
      let consec = 0, streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === sorted[i - 1] + 1) streak++;
        else { if (streak >= 2) consec++; streak = 1; }
      }
      if (streak >= 2) consec++;
      features.consecutive_count = consec;

      const dateStr = d.date.replace(/\(.*\)/, '').trim();
      await fetch(`${SUPABASE_URL}/rest/v1/draws`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ draw_number: d.code, draw_date: dateStr, ...features }),
      });
      inserted++;
    }

    // Update number_stats if new data
    if (inserted > 0) {
      const allResp = await fetch(`${SUPABASE_URL}/rest/v1/draws?select=*&order=draw_date.desc&limit=200`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      const allDraws = await allResp.json();

      if (Array.isArray(allDraws) && allDraws.length > 0) {
        // Delete old stats
        await fetch(`${SUPABASE_URL}/rest/v1/number_stats?number=neq.0`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
        });

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
          const recentRate = (recent10 / 10) * 100;
          const deviation = recentRate - 25;
          const hotScore = Math.max(0, Math.min(100, 50 + deviation * 5));
          const coldScore = Math.max(0, Math.min(100, 100 - hotScore));
          const missRatio = avgMiss > 0 ? Math.min(100, (currentMiss / avgMiss) * 100) : 0;
          stats.push({
            number: num, total_appearances: totalAppearances,
            recent_10_rate: parseFloat(((recent10 / 10) * 100).toFixed(1)),
            recent_20_rate: parseFloat(((recent20 / 20) * 100).toFixed(1)),
            recent_50_rate: parseFloat(((recent50 / Math.min(50, allDraws.length)) * 100).toFixed(1)),
            current_miss: currentMiss, avg_miss: parseFloat(avgMiss.toFixed(1)),
            max_miss: missPeriods.length > 0 ? Math.max(...missPeriods) : currentMiss,
            miss_ratio: parseFloat(missRatio.toFixed(1)),
            hot_score: parseFloat(hotScore.toFixed(1)), cold_score: parseFloat(coldScore.toFixed(1)),
          });
        }
        for (let i = 0; i < stats.length; i += 20) {
          await fetch(`${SUPABASE_URL}/rest/v1/number_stats`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
            body: JSON.stringify(stats.slice(i, i + 20)),
          });
        }
      }
    }

    return { success: true, inserted, skipped: data.result.length - inserted };
  } catch (e) {
    return { error: e.message };
  }
}
