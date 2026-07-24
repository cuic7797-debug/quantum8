import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials')) return '邮箱或密码错误';
  if (msg.includes('already registered') || msg.includes('User already registered')) return '该邮箱已注册';
  if (msg.includes('Password should be at least')) return '密码至少需要6位';
  if (msg.includes('Unable to validate email')) return '邮箱格式不正确';
  if (msg.includes('Email not confirmed')) return '请先验证邮箱';
  if (msg.includes('Signup is disabled')) return '注册功能暂时关闭';
  if (msg.includes('rate limit')) return '操作太频繁，请稍后再试';
  return msg || '操作失败，请重试';
}

export default function AuthPage() {
  const { signIn, signUp, user, signOut } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  if (user) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="glass-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mx-auto">
            <span className="text-2xl">👤</span>
          </div>
          <h2 className="text-2xl font-bold">个人中心</h2>
          <p className="text-sm text-[var(--color-muted)]">{user.email}</p>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="glass-inset p-3">
              <div className="text-lg font-bold">☁️</div>
              <div className="text-sm text-[var(--color-muted)]">云端同步</div>
            </div>
            <div className="glass-inset p-3">
              <div className="text-lg font-bold text-emerald-400">✓</div>
              <div className="text-sm text-[var(--color-muted)]">已登录</div>
            </div>
          </div>
          <button onClick={signOut}
            className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-400 font-semibold hover:bg-red-500/20 transition-all">
            退出登录
          </button>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password);

    if (result.error) {
      setError(translateError(result.error));
    } else if (mode === 'register') {
      setSuccess('注册成功！正在登录...');
      setTimeout(() => {
        signIn(email, password);
      }, 500);
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="glass-card p-6 space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold">{mode === 'login' ? '登录' : '注册'}</h2>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {mode === 'login' ? '登录后可云端同步策略和选号记录' : '创建账号，数据云端同步'}
          </p>
        </div>

        {error && <div className="text-sm text-red-400 bg-red-500/10 rounded-lg px-4 py-2">{error}</div>}
        {success && <div className="text-sm text-emerald-400 bg-emerald-500/10 rounded-lg px-4 py-2">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">邮箱</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm"
              placeholder="your@email.com" />
          </div>
          <div>
            <label className="text-sm text-[var(--color-muted)] mb-1 block">密码</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-sm"
              placeholder="至少6位" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold hover:bg-[var(--color-primary)]/80 disabled:opacity-50 transition-all shadow-lg shadow-[var(--color-primary)]/25">
            {loading ? '处理中...' : mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="text-center">
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess(''); }}
            className="text-xs text-[var(--color-primary)] hover:underline">
            {mode === 'login' ? '没有账号？点击注册' : '已有账号？点击登录'}
          </button>
        </div>
      </div>

      <div className="text-center text-sm text-[var(--color-muted)]">
        登录使用 Supabase Auth，数据安全加密存储
      </div>
    </div>
  );
}
