import { useState, useMemo } from 'react';
import { useCheckin, getLevel, getLevelProgress, getCheckinBonus, type UserPoints } from '@/hooks/useCheckin';
import { useAuth } from '@/hooks/useAuth';
import Collapsible from '@/components/common/Collapsible';
import { Calendar, Flame, Trophy, Gift, TrendingUp, Star, Zap } from 'lucide-react';

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

export default function CheckinPage() {
  const { user } = useAuth();
  const { points, loading, todayChecked, checkinLoading, checkin, levels, consumptionRules } = useCheckin();
  const [result, setResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

  const level = points ? getLevel(points.total_points) : levels[0];
  const progress = points ? getLevelProgress(points.total_points) : { progress: 0, next: null };

  async function handleCheckin() {
    const res = await checkin();
    if (res) {
      setResult(res);
      setShowResult(true);
      setTimeout(() => setShowResult(false), 3000);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-4xl">🔐</div>
        <div className="text-lg text-[var(--color-muted)]">请先登录后使用签到功能</div>
        <a href="/auth" className="btn-primary">去登录</a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-base text-[var(--color-muted)]">加载中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-primary">每日签到</h2>
        {points && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{level.icon}</span>
            <span className="font-bold" style={{ color: level.color }}>{level.name}</span>
          </div>
        )}
      </div>

      {/* Checkin Card */}
      <div className="glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-accent)]/5" />
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-sm text-[var(--color-muted)] mb-1">今日签到</div>
              <div className="text-3xl font-bold">
                {points?.total_points || 0}
                <span className="text-base font-normal text-[var(--color-muted)] ml-2">积分</span>
              </div>
            </div>
            <button
              onClick={handleCheckin}
              disabled={todayChecked || checkinLoading}
              className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                todayChecked
                  ? 'bg-[var(--color-surface)] text-[var(--color-muted)] cursor-not-allowed border border-[var(--glass-border)]'
                  : 'bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {checkinLoading ? '签到中...' : todayChecked ? '✓ 已签到' : '签到'}
            </button>
          </div>

          {/* Streak */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center glass-inset p-3">
              <Flame size={20} className="mx-auto mb-1 text-orange-400" />
              <div className="text-2xl font-bold text-orange-400">{points?.current_streak || 0}</div>
              <div className="text-sm text-[var(--color-muted)]">连续签到</div>
            </div>
            <div className="text-center glass-inset p-3">
              <Trophy size={20} className="mx-auto mb-1 text-amber-400" />
              <div className="text-2xl font-bold text-amber-400">{points?.max_streak || 0}</div>
              <div className="text-sm text-[var(--color-muted)]">最长连续</div>
            </div>
            <div className="text-center glass-inset p-3">
              <Star size={20} className="mx-auto mb-1 text-purple-400" />
              <div className="text-2xl font-bold text-purple-400">{points?.total_points || 0}</div>
              <div className="text-sm text-[var(--color-muted)]">总积分</div>
            </div>
          </div>
        </div>
      </div>

      {/* Streak Bonus Info */}
      <Collapsible title="签到奖励规则" step={1} defaultOpen>
        <div className="space-y-3">
          {[
            { streak: '1天', points: 10, icon: '📅', color: 'text-blue-400' },
            { streak: '3天+', points: 15, icon: '🔥', color: 'text-orange-400' },
            { streak: '7天+', points: 25, icon: '⭐', color: 'text-amber-400' },
            { streak: '14天+', points: 40, icon: '💎', color: 'text-purple-400' },
            { streak: '30天+', points: 60, icon: '👑', color: 'text-red-400' },
          ].map(item => (
            <div key={item.streak} className="flex items-center justify-between glass-inset p-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-base font-semibold">连续签到 {item.streak}</span>
              </div>
              <span className={`text-base font-bold ${item.color}`}>+{item.points} 积分</span>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Calendar */}
      <Collapsible title="签到日历" step={2}>
        <div className="glass-inset p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] px-3 py-1 rounded hover:bg-white/5">
              ←
            </button>
            <span className="text-base font-bold">{viewYear}年 {monthNames[viewMonth]}</span>
            <button onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }}
              className="text-[var(--color-muted)] hover:text-[var(--color-text)] px-3 py-1 rounded hover:bg-white/5">
              →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {['日', '一', '二', '三', '四', '五', '六'].map(d => (
              <div key={d} className="text-sm text-[var(--color-muted)] py-1">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = dateStr === today.toISOString().split('T')[0];
              const isChecked = points?.last_checkin_date === dateStr && viewMonth === today.getMonth() && viewYear === today.getFullYear();
              return (
                <div key={i} className={`text-sm py-1.5 rounded-lg transition-all ${
                  isToday ? 'bg-[var(--color-primary)] text-white font-bold' :
                  isChecked ? 'bg-emerald-500/20 text-emerald-400' :
                  'text-[var(--color-muted)]'
                }`}>
                  {day}
                </div>
              );
            })}
          </div>
        </div>
      </Collapsible>

      {/* Level Progress */}
      <Collapsible title="等级进度" step={3}>
        <div className="space-y-4">
          <div className="glass-inset p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{level.icon}</span>
                <div>
                  <div className="text-base font-bold" style={{ color: level.color }}>{level.name}</div>
                  <div className="text-sm text-[var(--color-muted)]">{points?.total_points || 0} 积分</div>
                </div>
              </div>
              {progress.next && (
                <div className="text-right">
                  <div className="text-sm text-[var(--color-muted)]">下一等级</div>
                  <div className="text-sm font-semibold">{progress.next.icon} {progress.next.name}</div>
                  <div className="text-xs text-[var(--color-muted)]">还需 {progress.next.min_points - (points?.total_points || 0)} 积分</div>
                </div>
              )}
            </div>
            <div className="w-full h-3 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress.progress}%`, background: `linear-gradient(90deg, ${level.color}, ${progress.next?.color || level.color})` }} />
            </div>
          </div>

          <div className="space-y-2">
            {levels.map(l => (
              <div key={l.level} className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                (points?.total_points || 0) >= l.min_points ? 'glass-inset' : 'opacity-50'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.icon}</span>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: l.color }}>{l.name}</div>
                    <div className="text-xs text-[var(--color-muted)]">{l.min_points}+ 积分</div>
                  </div>
                </div>
                {(points?.total_points || 0) >= l.min_points && (
                  <span className="text-xs text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">已解锁</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Collapsible>

      {/* Points Usage */}
      <Collapsible title="积分用途" step={4}>
        <div className="space-y-2">
          {consumptionRules.map(rule => (
            <div key={rule.action} className="flex items-center justify-between glass-inset p-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{rule.icon}</span>
                <span className="text-sm font-semibold">{rule.action}</span>
              </div>
              <span className="text-sm font-bold text-amber-400">-{rule.points} 积分</span>
            </div>
          ))}
        </div>
      </Collapsible>

      {/* Checkin Result Toast */}
      {showResult && result && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-card px-6 py-4 shadow-2xl shadow-black/30 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{result.success ? '🎉' : 'ℹ️'}</span>
            <div>
              <div className="text-base font-bold">{result.message}</div>
              {result.success && (
                <div className="text-sm text-[var(--color-muted)]">+{result.points_earned} 积分 · 连续{result.streak}天</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
