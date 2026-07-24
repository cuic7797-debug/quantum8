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

export function useNumberStats() {
  const [stats, setStats] = useState<NumberStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const cacheKey = 'number_stats';
    const cached = getCached<NumberStat[]>(cacheKey);
    if (cached) {
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
        const result = data || [];
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
