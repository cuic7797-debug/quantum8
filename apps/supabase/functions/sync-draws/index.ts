import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CWL_API = "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice";

function parseNumbers(red: string): number[] {
  return red.split(",").map((n) => parseInt(n.trim(), 10)).filter((n) => n >= 1 && n <= 80);
}

function calcFeatures(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const sum_value = numbers.reduce((a, b) => a + b, 0);
  const span = sorted[sorted.length - 1] - sorted[0];
  const odd_count = numbers.filter((n) => n % 2 === 1).length;
  const even_count = numbers.length - odd_count;
  const big_count = numbers.filter((n) => n > 40).length;
  const small_count = numbers.length - big_count;
  const zone1_count = numbers.filter((n) => n <= 20).length;
  const zone2_count = numbers.filter((n) => n > 20 && n <= 40).length;
  const zone3_count = numbers.filter((n) => n > 40 && n <= 60).length;
  const zone4_count = numbers.filter((n) => n > 60).length;
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

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch from CWL API
    const url = `${CWL_API}?name=kl8&issueCount=10`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://www.cwl.gov.cn/" },
    });
    if (!resp.ok) return new Response(JSON.stringify({ error: `CWL API ${resp.status}` }), { status: 500 });

    const data = await resp.json();
    const raw = data.result || [];

    // 2. Get existing draw numbers
    const { data: existing } = await supabase.from("draws").select("draw_number");
    const existSet = new Set((existing || []).map((d: any) => d.draw_number));

    let inserted = 0, skipped = 0;
    for (const d of raw) {
      const drawNumber = d.code;
      if (existSet.has(drawNumber)) { skipped++; continue; }
      const numbers = parseNumbers(d.red);
      if (numbers.length !== 20) continue;
      const dateStr = d.date.replace(/\(.*\)/, "").trim();
      const features = calcFeatures(numbers);
      const { error } = await supabase.from("draws").insert({
        draw_number: drawNumber, draw_date: dateStr, ...features,
      });
      if (!error) inserted++;
    }

    // 3. Recalculate number_stats if new data
    if (inserted > 0) {
      const { data: allDraws } = await supabase.from("draws").select("*").order("draw_date", { ascending: false });
      if (allDraws && allDraws.length > 0) {
        await supabase.from("number_stats").delete().neq("number", 0);
        const stats = [];
        for (let num = 1; num <= 80; num++) {
          const totalAppearances = allDraws.filter((d: any) => d.numbers.includes(num)).length;
          const recent10 = allDraws.slice(0, 10).filter((d: any) => d.numbers.includes(num)).length;
          const recent20 = allDraws.slice(0, 20).filter((d: any) => d.numbers.includes(num)).length;
          const recent50 = allDraws.slice(0, 50).filter((d: any) => d.numbers.includes(num)).length;
          let currentMiss = 0;
          for (const draw of allDraws) { if (draw.numbers.includes(num)) break; currentMiss++; }
          const missPeriods: number[] = [];
          let lastSeen = -1;
          for (let i = 0; i < allDraws.length; i++) {
            if (allDraws[i].numbers.includes(num)) { if (lastSeen >= 0) missPeriods.push(i - lastSeen); lastSeen = i; }
          }
          const avgMiss = missPeriods.length > 0 ? missPeriods.reduce((a, b) => a + b, 0) / missPeriods.length : 0;
          const maxMiss = missPeriods.length > 0 ? Math.max(...missPeriods) : currentMiss;
          const recentRate = (recent10 / 10) * 100;
          const deviation = recentRate - 25;
          const missRatio = avgMiss > 0 ? Math.min(100, (currentMiss / avgMiss) * 100) : 0;
          const hotScore = Math.max(0, Math.min(100, 50 + deviation * 5));
          const coldScore = Math.max(0, Math.min(100, 100 - hotScore));
          stats.push({
            number: num, total_appearances: totalAppearances,
            recent_10_rate: parseFloat(((recent10 / 10) * 100).toFixed(1)),
            recent_20_rate: parseFloat(((recent20 / 20) * 100).toFixed(1)),
            recent_50_rate: parseFloat(((recent50 / Math.min(50, allDraws.length)) * 100).toFixed(1)),
            current_miss: currentMiss, avg_miss: parseFloat(avgMiss.toFixed(1)), max_miss: maxMiss,
            miss_ratio: parseFloat(missRatio.toFixed(1)),
            hot_score: parseFloat(hotScore.toFixed(1)), cold_score: parseFloat(coldScore.toFixed(1)),
          });
        }
        for (let i = 0; i < stats.length; i += 20) {
          await supabase.from("number_stats").insert(stats.slice(i, i + 20));
        }
      }
    }

    return new Response(JSON.stringify({ message: "ok", inserted, skipped, fetched: raw.length }));
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
