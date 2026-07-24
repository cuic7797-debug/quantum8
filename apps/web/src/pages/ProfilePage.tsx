import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCheckin, getLevel, getLevelProgress } from '@/hooks/useCheckin';
import NumberBall from '@/components/common/NumberBall';
import Collapsible from '@/components/common/Collapsible';
import { Flame, Trophy, Star, LogOut, Settings, CreditCard, Calendar, ChevronRight, Shield, Zap } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { points, todayChecked, checkinLoading, checkin } = useCheckin();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const level = points ? getLevel(points.total_points) : getLevel(0);
  const progress = points ? getLevelProgress(points.total_points) : { progress: 0, next: null };

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    navigate('/');
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-5xl">👤</div>
        <div className="text-xl text-[var(--color-muted)]">登录后查看个人中心</div>
        <button onClick={() => navigate('/auth')} className="btn-primary text-base px-8 py-3">
          登录 / 注册
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Profile Header */}
      <div className="glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10" />
        <div className="relative p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-2xl font-bold text-white">{user.email?.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold">{user.email?.split('@')[0]}</div>
              <div className="text-sm text-[var(--color-muted)]">{user.email}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{level.icon}</span>
                <span className="text-sm font-semibold" style={{ color: level.color }}>{level.name}</span>
              </div>
            </div>
          </div>

          {/* Points & Streak */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center glass-inset p-3 rounded-xl">
              <div className="text-2xl font-bold text-[var(--color-primary)]">{points?.total_points || 0}</div>
              <div className="text-sm text-[var(--color-muted)]">积分</div>
            </div>
            <div className="text-center glass-inset p-3 rounded-xl">
              <div className="text-2xl font-bold text-orange-400">{points?.current_streak || 0}</div>
              <div className="text-sm text-[var(--color-muted)]">连续签到</div>
            </div>
            <div className="text-center glass-inset p-3 rounded-xl">
              <div className="text-2xl font-bold text-amber-400">{points?.max_streak || 0}</div>
              <div className="text-sm text-[var(--color-muted)]">最长连续</div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-[var(--color-muted)]">{level.name}</span>
              {progress.next && <span className="text-[var(--color-muted)]">→ {progress.next.icon} {progress.next.name}</span>}
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progress.progress}%`, background: `linear-gradient(90deg, ${level.color}, ${progress.next?.color || level.color})` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Checkin */}
      {!todayChecked && (
        <button onClick={checkin} disabled={checkinLoading}
          className="w-full glass-card p-4 flex items-center justify-between hover:border-emerald-500/30 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
              <Calendar size={22} className="text-white" />
            </div>
            <div className="text-left">
              <div className="text-base font-bold">今日签到</div>
              <div className="text-sm text-[var(--color-muted)]">连续签到获取更多积分</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-emerald-400">+10</span>
            <ChevronRight size={18} className="text-[var(--color-muted)]" />
          </div>
        </button>
      )}

      {todayChecked && (
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
          <div>
            <div className="text-base font-semibold text-emerald-400">今日已签到</div>
            <div className="text-sm text-[var(--color-muted)]">连续 {points?.current_streak || 0} 天</div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <Collapsible title="功能入口" step={1} defaultOpen>
        <div className="space-y-1">
          {[
            { icon: <CreditCard size={20} />, label: '积分商城', desc: '购买积分包', path: '/points-store', color: 'text-amber-400' },
            { icon: <Calendar size={20} />, label: '签到中心', desc: '签到记录与日历', path: '/checkin', color: 'text-emerald-400' },
            { icon: <Trophy size={20} />, label: '我的策略', desc: '查看保存的策略', path: '/strategy', color: 'text-purple-400' },
            { icon: <Star size={20} />, label: '我的收藏', desc: '查看收藏的号码', path: '/favorites', color: 'text-blue-400' },
            { icon: <Shield size={20} />, label: '我的等级', desc: '查看等级权益', path: '/checkin', color: 'text-[var(--color-primary)]' },
            { icon: <Shield size={20} />, label: '管理员后台', desc: '管理用户与积分', path: '/admin', color: 'text-amber-400' },

          ].map(item => (
            <button key={item.label} onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors text-left">
              <div className={`${item.color}`}>{item.icon}</div>
              <div className="flex-1">
                <div className="text-base font-semibold">{item.label}</div>
                <div className="text-sm text-[var(--color-muted)]">{item.desc}</div>
              </div>
              <ChevronRight size={16} className="text-[var(--color-muted)]" />
            </button>
          ))}
        </div>
      </Collapsible>

      {/* Sign Out */}
      <button onClick={handleSignOut} disabled={signingOut}
        className="w-full glass-card p-4 flex items-center justify-center gap-2 text-red-400 hover:bg-red-500/5 hover:border-red-500/20 transition-all">
        <LogOut size={18} />
        <span className="text-base font-semibold">{signingOut ? '退出中...' : '退出登录'}</span>
      </button>
    </div>
  );
}
