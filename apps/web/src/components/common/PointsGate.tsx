import { useAuth } from '@/hooks/useAuth';
import { useCheckin } from '@/hooks/useCheckin';
import { useNavigate } from 'react-router-dom';
import { Lock, Star, AlertTriangle } from 'lucide-react';

const ADMIN_EMAILS = ['704451222@qq.com'];

interface PointsGateProps {
  cost: number;
  action: string;
  children: React.ReactNode;
}

export default function PointsGate({ cost, action, children }: PointsGateProps) {
  const { user } = useAuth();
  const { points } = useCheckin();
  const navigate = useNavigate();

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

  const isAdmin = ADMIN_EMAILS.includes(user.email || '');
  if (isAdmin) return <>{children}</>;

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

// Hook to consume points after action
export function useConsumePoints() {
  const { user } = useAuth();
  const { consumePoints } = useCheckin();
  const isAdmin = user && ['704451222@qq.com'].includes(user.email || '');

  async function tryConsume(action: string, cost: number): Promise<boolean> {
    if (isAdmin) return true;
    return await consumePoints(action, cost);
  }

  return { tryConsume, isAdmin };
}
