import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { getCached, setCache } from '@/utils/cache';

export interface NumberStat {
  number: number;
  totalAppearances: number;
  recent10Rate: number;
  recent20Rate: number;
  recent50Rate: number;
  currentMiss: number;
  avgMiss: number;
  maxMiss: number;
  missRatio: number;
  hotScore: number;
  coldScore: number;
}

function mapRow(row: any): NumberStat {
  return {
    number: row.number,
    totalAppearances: row.total_appearances ?? row.totalAppearances ?? 0,
    recent10Rate: row.recent_10_rate ?? row.recent10Rate ?? 0,
    recent20Rate: row.recent_20_rate ?? row.recent20Rate ?? 0,
    recent50Rate: row.recent_50_rate ?? row.recent50Rate ?? 0,
    currentMiss: row.current_miss ?? row.currentMiss ?? 0,
    avgMiss: row.avg_miss ?? row.avgMiss ?? 0,
    maxMiss: row.max_miss ?? row.maxMiss ?? 0,
    missRatio: row.miss_ratio ?? row.missRatio ?? 0,
    hotScore: row.hot_score ?? row.hotScore ?? 50,
    coldScore: row.cold_score ?? row.coldScore ?? 50,
  };
}

export function useNumberStats() {
  const [stats, setStats] = useState<NumberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const cacheKey = 'number_stats';
    const cached = getCached<NumberStat[]>(cacheKey);
    if (cached && cached.length > 0) {
      setStats(cached);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('number_stats')
        .select('*')
        .order('number', { ascending: true });

      if (error) {
        setError(error.message);
        setStats([]);
      } else {
        const result = (data || []).map(mapRow);
        setStats(result);
        setCache(cacheKey, result);
        setError(null);
      }
    } catch (e: any) {
      setError(e.message || 'Network error');
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
