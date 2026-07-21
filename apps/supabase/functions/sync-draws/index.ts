import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const DRAW_API = 'https://www.cwl.gov.cn/cwl_admin/front/cwlkj/search/kjxx/findDrawNotice';
const GAME_CODE = 'kl8';

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const response = await fetch(
      `${DRAW_API}?name=${GAME_CODE}&issueCount=30&issueStart=&issueEnd=&dayStart=&dayEnd=&pageNo=1&pageSize=30&systemType=PC`,
      { headers: { 'Referer': 'https://www.cwl.gov.cn/' } }
    );
    const data = await response.json();
    const draws = data.result || [];

    let added = 0;
    for (const draw of draws) {
      const drawNumber = draw.code;
      const drawDate = draw.date?.split('T')[0];
      const numbers: number[] = draw.red?.split(',').map(Number).sort((a, b) => a - b) || [];
      if (numbers.length !== 20 || !drawNumber) continue;

      const { data: existing } = await supabase
        .from('draws')
        .select('id')
        .eq('draw_number', drawNumber)
        .maybeSingle();
      if (existing) continue;

      const sumValue = numbers.reduce((a, b) => a + b, 0);
      const oddCount = numbers.filter((n) => n % 2 === 1).length;
      const zones = [0, 0, 0, 0];
      numbers.forEach((n) => {
        if (n <= 20) zones[0]++;
        else if (n <= 40) zones[1]++;
        else if (n <= 60) zones[2]++;
        else zones[3]++;
      });

      let consecutiveCount = 0;
      let streak = 1;
      for (let i = 1; i < numbers.length; i++) {
        if (numbers[i] === numbers[i - 1] + 1) streak++;
        else { if (streak >= 2) consecutiveCount++; streak = 1; }
      }
      if (streak >= 2) consecutiveCount++;

      await supabase.from('draws').insert({
        draw_number: drawNumber,
        draw_date: drawDate,
        numbers,
        sum_value: sumValue,
        span: numbers[19] - numbers[0],
        odd_count: oddCount,
        even_count: 20 - oddCount,
        big_count: numbers.filter((n) => n >= 41).length,
        small_count: numbers.filter((n) => n <= 40).length,
        zone1_count: zones[0],
        zone2_count: zones[1],
        zone3_count: zones[2],
        zone4_count: zones[3],
        consecutive_count: consecutiveCount,
        repeat_count: 0,
      });
      added++;
    }

    await supabase.from('sync_logs').insert({
      source: 'cwl_api',
      status: 'success',
      records_added: added,
      latest_draw: draws[0]?.code || null,
    });

    return new Response(JSON.stringify({ success: true, added }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    await supabase.from('sync_logs').insert({
      source: 'cwl_api',
      status: 'failed',
      error_message: String(err),
    });
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
