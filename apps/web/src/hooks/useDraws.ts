import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';

export interface Draw {
  id: string;
  draw_number: string;
  draw_date: string;
  numbers: number[];
  sum_value: number;
  span: number;
  odd_count: number;
  even_count: number;
  big_count: number;
  small_count: number;
  zone1_count: number;
  zone2_count: number;
  zone3_count: number;
  zone4_count: number;
  consecutive_count: number;
  repeat_count: number;
}

export function useDraws(limit = 20) {
  const [draws, setDraws] = useState<Draw[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDraws() {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .order('draw_date', { ascending: false })
        .limit(limit);

      if (error) {
        setError(error.message);
      } else {
        setDraws(data || []);
      }
      setLoading(false);
    }
    fetchDraws();
  }, [limit]);

  return { draws, loading, error };
}
