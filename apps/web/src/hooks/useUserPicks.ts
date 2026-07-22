import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from './useAuth';

export interface UserPick {
  id: string;
  user_id: string;
  numbers: number[];
  strategy_label: string;
  play_type: string;
  note: string;
  created_at: string;
}

export function useUserPicks() {
  const { user } = useAuth();
  const [picks, setPicks] = useState<UserPick[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPicks = useCallback(async () => {
    if (!user) { setPicks([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('user_picks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setPicks(data as UserPick[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPicks(); }, [fetchPicks]);

  async function addPick(numbers: number[], strategyLabel: string, playType: string, note: string) {
    if (!user) return { error: '未登录' };
    const { data, error } = await supabase
      .from('user_picks')
      .insert({ user_id: user.id, numbers, strategy_label: strategyLabel, play_type: playType, note })
      .select()
      .single();
    if (error) return { error: error.message };
    setPicks(prev => [data as UserPick, ...prev]);
    return { data };
  }

  async function deletePick(id: string) {
    if (!user) return;
    await supabase.from('user_picks').delete().eq('id', id).eq('user_id', user.id);
    setPicks(prev => prev.filter(p => p.id !== id));
  }

  return { picks, loading, addPick, deletePick, refetch: fetchPicks };
}
