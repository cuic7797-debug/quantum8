import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CWL_ORIGINS = [
  "https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice?name=kl8&issueCount=10",
];
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

function parseNumbers(red: string): number[] {
  return red.split(",").map((n: string) => parseInt(n.trim(), 10)).filter((n: number) => n >= 1 && n <= 80);
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

async function tryFetch(url: string, timeoutMs = 10000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.cwl.gov.cn/",
        "Accept": "application/json",
      },
    });
    clearTimeout(timer);
    if (resp.ok) return await resp.json();
  } catch { clearTimeout(timer); }
  return null;
}

serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cwlUrl = CWL_ORIGINS[0];
    let data: any = null;

    // Try direct first
    data = await tryFetch(cwlUrl);

    // Try CORS proxies
    if (!data?.result) {
      for (const proxy of CORS_PROXIES) {
        data = await tryFetch(proxy(cwlUrl), 15000);
        if (data?.result) break;
      }
    }

    if (!data?.result) {
      return new Response(JSON.stringify({ error: "All fetch methods failed", fetched: 0, inserted: 0 }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    const draws = data.result
      .map((d: any) => {
        const numbers = parseNumbers(d.red);
        const dateStr = d.date?.replace(/\(.*\)/, "").trim() || "";
        return { draw_number: d.code || "", draw_date: dateStr, ...calculateFeatures(numbers) };
      })
      .filter((d: any) => d.numbers.length === 20 && d.draw_number);

    const { data: existing } = await supabase.from("draws").select("draw_number");
    const existSet = new Set((existing || []).map((d: any) => d.draw_number));

    let inserted = 0;
    for (const draw of draws) {
      if (existSet.has(draw.draw_number)) continue;
      const { error } = await supabase.from("draws").insert(draw);
      if (!error) inserted++;
    }

    return new Response(JSON.stringify({
      success: true, fetched: draws.length, inserted,
      latest: draws[0]?.draw_number || "none",
    }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
