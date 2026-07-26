import { useEffect, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { fetchFromCWL, cacheDraws, getDataFreshness } from '@/utils/dataFetch';

const SYNC_INTERVAL = 10 * 60 * 1000; // 10 minutes

export function useAutoSync() {
  const lastSyncRef = useRef(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_INTERVAL) return;

    async function sync() {
      try {
        // Only sync if data is not fresh
        const freshness = getDataFreshness();
        if (freshness.status === 'fresh') return;

        const result = await fetchFromCWL(10);
        if (result.draws.length === 0) return;

        cacheDraws(result.draws);

        const { data: existing } = await supabase.from('draws').select('draw_number');
        const existSet = new Set((existing || []).map((d: any) => d.draw_number));

        let inserted = 0;
        for (const draw of result.draws) {
          if (existSet.has(draw.draw_number)) continue;
          const { error } = await supabase.from('draws').insert(draw);
          if (!error) inserted++;
        }

        if (inserted > 0) {
          console.log(`[AutoSync] 新增 ${inserted} 期数据`);
        }
      } catch {
        // Silent fail for auto-sync
      }
      lastSyncRef.current = Date.now();
    }

    sync();
  }, []);
}
