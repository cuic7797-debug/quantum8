import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from './useAuth';
import { getCached, setCache } from '@/utils/cache';

export interface UserPoints {
  total_points: number;
  current_streak: number;
  max_streak: number;
  last_checkin_date: string | null;
  level: number;
}

export interface CheckinResult {
  success: boolean;
  points_earned: number;
  streak: number;
  is_bonus: boolean;
  message: string;
}

const LEVELS = [
  { level: 1, name: '普通用户', min_points: 0, icon: '👤', color: '#94a3b8' },
  { level: 2, name: '活跃用户', min_points: 500, icon: '⭐', color: '#3b82f6' },
  { level: 3, name: '高级用户', min_points: 2000, icon: '💎', color: '#8b5cf6' },
  { level: 4, name: '专家用户', min_points: 5000, icon: '👑', color: '#f59e0b' },
  { level: 5, name: '大师用户', min_points: 15000, icon: '🏆', color: '#ef4444' },
];

const CONSUMPTION_RULES = [
  { action: '智能选号', points: 5, icon: '🎯' },
  { action: 'AI策略生成', points: 10, icon: '🧠' },
  { action: 'AI分析报告', points: 20, icon: '📊' },
  { action: '策略回测', points: 10, icon: '🔬' },
  { action: '号码预测评分', points: 8, icon: '🔮' },
  { action: '杀号工具', points: 3, icon: '🔪' },
];

export function getLevel(totalPoints: number) {
  let result = LEVELS[0];
  for (const l of LEVELS) {
    if (totalPoints >= l.min_points) result = l;
  }
  return result;
}

export function getLevelProgress(totalPoints: number) {
  const current = getLevel(totalPoints);
  const nextIdx = LEVELS.findIndex(l => l.level === current.level) + 1;
  if (nextIdx >= LEVELS.length) return { progress: 100, next: null };
  const next = LEVELS[nextIdx];
  const range = next.min_points - current.min_points;
  const progress = Math.min(100, Math.round(((totalPoints - current.min_points) / range) * 100));
  return { progress, next };
}

export function getCheckinBonus(streak: number): { points: number; isBonus: boolean } {
  if (streak >= 30) return { points: 60, isBonus: true };
  if (streak >= 14) return { points: 40, isBonus: true };
  if (streak >= 7) return { points: 25, isBonus: true };
  if (streak >= 3) return { points: 15, isBonus: true };
  return { points: 10, isBonus: false };
}

export function useCheckin() {
  const { user } = useAuth();
  const [points, setPoints] = useState<UserPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayChecked, setTodayChecked] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const fetchPoints = useCallback(async () => {
    if (!user) { setPoints(null); setLoading(false); return; }

    const cacheKey = `points_${user.id}`;
    const cached = getCached<UserPoints>(cacheKey);
    if (cached) {
      setPoints(cached);
      const today = new Date().toISOString().split('T')[0];
      setTodayChecked(cached.last_checkin_date === today);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Create initial points record
        const { data: newData } = await supabase
          .from('user_points')
          .insert({ user_id: user.id, total_points: 0, current_streak: 0, level: 1 })
          .select()
          .single();
        if (newData) {
          setPoints(newData);
          setCache(cacheKey, newData);
        }
      } else if (data) {
        setPoints(data);
        setCache(cacheKey, data);
        const today = new Date().toISOString().split('T')[0];
        setTodayChecked(data.last_checkin_date === today);
      }
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPoints(); }, [fetchPoints]);

  const checkin = useCallback(async (): Promise<CheckinResult | null> => {
    if (!user || !points || todayChecked) return null;
    setCheckinLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = 1;
      if (points.last_checkin_date === yesterday) {
        newStreak = points.current_streak + 1;
      }

      const bonus = getCheckinBonus(newStreak);
      const newTotal = points.total_points + bonus.points;
      const newLevel = getLevel(newTotal).level;

      // Insert checkin record
      const { error: checkinError } = await supabase
        .from('user_checkins')
        .insert({
          user_id: user.id,
          checkin_date: today,
          streak: newStreak,
          points_earned: bonus.points,
        });

      if (checkinError && checkinError.code === '23505') {
        setCheckinLoading(false);
        return { success: false, points_earned: 0, streak: 0, is_bonus: false, message: '今日已签到' };
      }

      // Update points
      const { error: pointsError } = await supabase
        .from('user_points')
        .update({
          total_points: newTotal,
          current_streak: newStreak,
          max_streak: Math.max(points.max_streak, newStreak),
          last_checkin_date: today,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      // Record transaction
      await supabase.from('point_transactions').insert({
        user_id: user.id,
        amount: bonus.points,
        type: bonus.isBonus ? 'checkin_bonus' : 'checkin',
        description: `每日签到${newStreak > 1 ? ` (连续${newStreak}天)` : ''}`,
      });

      if (!pointsError) {
        const updatedPoints: UserPoints = {
          total_points: newTotal,
          current_streak: newStreak,
          max_streak: Math.max(points.max_streak, newStreak),
          last_checkin_date: today,
          level: newLevel,
        };
        setPoints(updatedPoints);
        setTodayChecked(true);
        setCache(`points_${user.id}`, updatedPoints);

        const streakMessages = [
          newStreak >= 30 ? '🔥 连续签到30天！获得60积分！' :
          newStreak >= 14 ? '🔥 连续签到14天！获得40积分！' :
          newStreak >= 7 ? '⭐ 连续签到7天！获得25积分！' :
          newStreak >= 3 ? `连续签到${newStreak}天！获得15积分！` :
          `签到成功！获得${bonus.points}积分`,
        ];

        setCheckinLoading(false);
        return {
          success: true,
          points_earned: bonus.points,
          streak: newStreak,
          is_bonus: bonus.isBonus,
          message: streakMessages[0],
        };
      }
    } catch {}
    setCheckinLoading(false);
    return null;
  }, [user, points, todayChecked]);

  const consumePoints = useCallback(async (action: string, amount: number): Promise<boolean> => {
    if (!user || !points || points.total_points < amount) return false;

    const newTotal = points.total_points - amount;
    const newLevel = getLevel(newTotal).level;

    const { error } = await supabase
      .from('user_points')
      .update({ total_points: newTotal, level: newLevel, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);

    if (!error) {
      await supabase.from('point_transactions').insert({
        user_id: user.id,
        amount: -amount,
        type: 'consume',
        description: action,
      });

      const updated = { ...points, total_points: newTotal, level: newLevel };
      setPoints(updated);
      setCache(`points_${user.id}`, updated);
      return true;
    }
    return false;
  }, [user, points]);

  return {
    points,
    loading,
    todayChecked,
    checkinLoading,
    checkin,
    consumePoints,
    levels: LEVELS,
    consumptionRules: CONSUMPTION_RULES,
  };
}
