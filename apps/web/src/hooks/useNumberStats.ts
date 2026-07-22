import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import type { NumberStat } from '@quantum8/types';

export type { NumberStat };

function mapRow(row: any): NumberStat {
  return {
    number: row.number,
    totalAppearances: row.total_appearances,
    recent10Rate: row.recent_10_rate,
    recent20Rate: row.recent_20_rate,
    recent50Rate: row.recent_50_rate,
    currentMiss: row.current_miss,
    avgMiss: row.avg_miss,
    maxMiss: row.max_miss,
    missRatio: row.miss_ratio,
    hotScore: row.hot_score,
    coldScore: row.cold_score,
  };
}

export function useNumberStats() {
  const [stats, setStats] = useState<NumberStat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('number_stats')
      .select('*')
      .order('number', { ascending: true });
    setStats((data || []).map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, refetch: fetchStats };
}
