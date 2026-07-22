import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from './useAuth';

export interface UserStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export function useUserStrategies() {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<UserStrategy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStrategies = useCallback(async () => {
    if (!user) { setStrategies([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('user_strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setStrategies(data as UserStrategy[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchStrategies(); }, [fetchStrategies]);

  async function addStrategy(name: string, description: string, config: Record<string, unknown>) {
    if (!user) return { error: '未登录' };
    const { data, error } = await supabase
      .from('user_strategies')
      .insert({ user_id: user.id, name, description, config })
      .select()
      .single();
    if (error) return { error: error.message };
    setStrategies(prev => [data as UserStrategy, ...prev]);
    return { data };
  }

  async function updateStrategy(id: string, updates: Partial<Pick<UserStrategy, 'name' | 'description' | 'config'>>) {
    if (!user) return { error: '未登录' };
    const { error } = await supabase
      .from('user_strategies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);
    if (!error) fetchStrategies();
    return { error: error?.message };
  }

  async function deleteStrategy(id: string) {
    if (!user) return;
    await supabase.from('user_strategies').delete().eq('id', id).eq('user_id', user.id);
    setStrategies(prev => prev.filter(s => s.id !== id));
  }

  return { strategies, loading, addStrategy, updateStrategy, deleteStrategy, refetch: fetchStrategies };
}
