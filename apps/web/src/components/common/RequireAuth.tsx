import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
          <Lock size={28} className="text-[var(--color-primary)]" />
        </div>
        <div className="text-xl font-bold">请先登录</div>
        <div className="text-sm text-[var(--color-muted)]">登录后即可使用此功能</div>
        <button onClick={() => navigate('/auth')} className="btn-primary px-8 py-3 mt-2">
          登录 / 注册
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
