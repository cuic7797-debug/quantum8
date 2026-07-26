import { useAuth } from '@/hooks/useAuth';
import { useCheckin } from '@/hooks/useCheckin';
import { useNavigate } from 'react-router-dom';
import { Lock, Star, AlertTriangle } from 'lucide-react';

const ADMIN_EMAILS = ['704451222@qq.com'];

function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(admin => admin.toLowerCase() === email.toLowerCase());
}

interface PointsGateProps {
  cost: number;
  action: string;
  children: React.ReactNode;
}

export default function PointsGate({ cost, action, children }: PointsGateProps) {
  const { user, loading } = useAuth();
  const { points } = useCheckin();
  const navigate = useNavigate();

  // Don't render anything while auth is loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Lock size={28} className="text-[var(--color-primary)]" />
        </div>
        <div className="text-xl font-bold">请先登录</div>
        <div className="text-sm text-[var(--color-muted)]">登录后即可使用 {action}</div>
        <button onClick={() => navigate('/auth')} className="btn-primary px-8 py-3 mt-2">登录 / 注册</button>
      </div>
    );
  }

  if (isAdminEmail(user.email)) return <>{children}</>;

  const userPoints = points?.total_points || 0;

  if (userPoints < cost) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>
        <div className="text-xl font-bold">积分不足</div>
        <div className="text-sm text-[var(--color-muted)]">
          {action} 需要 <span className="text-amber-400 font-bold">{cost}</span> 积分
        </div>
        <div className="text-sm text-[var(--color-muted)]">
          当前余额：<span className="font-bold">{userPoints}</span> 积分
        </div>
        <div className="flex gap-3 mt-2">
          <button onClick={() => navigate('/points-store')} className="btn-primary px-6 py-2">
            <Star size={16} className="inline mr-1" /> 购买积分
          </button>
          <button onClick={() => navigate('/checkin')} className="glass-card px-6 py-2 hover:bg-white/[0.05]">
            每日签到
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function useConsumePoints() {
  const { user } = useAuth();
  const { consumePoints } = useCheckin();
  const admin = isAdminEmail(user?.email);

  async function tryConsume(action: string, cost: number): Promise<boolean> {
    if (admin) return true;
    return await consumePoints(action, cost);
  }

  return { tryConsume, isAdmin: admin };
}
