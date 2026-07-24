import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';
import { useNavigate } from 'react-router-dom';
import Collapsible from '@/components/common/Collapsible';
import { Shield, Users, Gift, Search, Check, X, ChevronRight, Star, TrendingUp, CreditCard } from 'lucide-react';

const ADMIN_EMAILS = ['704451222@qq.com'];

interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  total_points: number;
  current_streak: number;
  level: number;
}

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [grantModal, setGrantModal] = useState<string | null>(null);
  const [grantPoints, setGrantPoints] = useState(100);
  const [grantReason, setGrantReason] = useState('管理员发放');
  const [granting, setGranting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  async function loadUsers() {
    setLoading(true);
    try {
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('user_id, total_points, current_streak, level');

      const pointsMap = new Map<string, any>();
      if (pointsData) {
        pointsData.forEach((p: any) => pointsMap.set(p.user_id, p));
      }

      const { data: authUsers } = await supabase.rpc('get_all_user_emails' as any);

      if (authUsers && Array.isArray(authUsers)) {
        const profiles: UserProfile[] = authUsers.map((u: any) => {
          const pts = pointsMap.get(u.id) || { total_points: 0, current_streak: 0, level: 1 };
          return {
            id: u.id,
            email: u.email || '未知',
            created_at: u.created_at || '',
            total_points: pts.total_points,
            current_streak: pts.current_streak,
            level: pts.level || 1,
          };
        });
        setUsers(profiles);
      } else {
        const { data: allPoints } = await supabase
          .from('user_points')
          .select('*')
          .order('total_points', { ascending: false });

        if (allPoints) {
          setUsers(allPoints.map((p: any) => ({
            id: p.user_id,
            email: p.user_id.substring(0, 8) + '...',
            created_at: p.created_at || '',
            total_points: p.total_points || 0,
            current_streak: p.current_streak || 0,
            level: p.level || 1,
          })));
        }
      }
    } catch (e) {
      console.error('Load users error:', e);
    }
    setLoading(false);
  }

  async function handleGrantPoints(userId: string) {
    setGranting(true);
    try {
      const target = users.find(u => u.id === userId);
      if (!target) return;

      const newTotal = target.total_points + grantPoints;

      const { error: updateErr } = await supabase
        .from('user_points')
        .upsert({
          user_id: userId,
          total_points: newTotal,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (updateErr) {
        setToast({ msg: '更新失败: ' + updateErr.message, ok: false });
      } else {
        await supabase.from('point_transactions').insert({
          user_id: userId,
          amount: grantPoints,
          type: 'admin_grant',
          description: grantReason,
        });

        setUsers(prev => prev.map(u =>
          u.id === userId ? { ...u, total_points: newTotal } : u
        ));
        setToast({ msg: `已为用户发放 ${grantPoints} 积分`, ok: true });
        setGrantModal(null);
        setGrantPoints(100);
        setGrantReason('管理员发放');
      }
    } catch (e: any) {
      setToast({ msg: '操作失败: ' + e.message, ok: false });
    }
    setGranting(false);
    setTimeout(() => setToast(null), 3000);
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-5xl">🔐</div>
        <div className="text-xl text-[var(--color-muted)]">请先登录</div>
        <button onClick={() => navigate('/auth')} className="btn-primary px-8 py-3">去登录</button>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-5xl">🚫</div>
        <div className="text-xl text-[var(--color-muted)]">无管理员权限</div>
        <div className="text-sm text-[var(--color-muted)]">仅管理员可访问此页面</div>
      </div>
    );
  }

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsers = users.length;
  const totalPointsDistributed = users.reduce((sum, u) => sum + u.total_points, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
          <Shield size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold gradient-text-primary">管理员后台</h2>
          <div className="text-sm text-[var(--color-muted)]">管理员: {user.email}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <Users size={20} className="text-[var(--color-primary)] mx-auto mb-2" />
          <div className="text-2xl font-bold">{totalUsers}</div>
          <div className="text-sm text-[var(--color-muted)]">注册用户</div>
        </div>
        <div className="glass-card p-4 text-center">
          <Star size={20} className="text-amber-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{totalPointsDistributed}</div>
          <div className="text-sm text-[var(--color-muted)]">总积分</div>
        </div>
        <div className="glass-card p-4 text-center">
          <TrendingUp size={20} className="text-emerald-400 mx-auto mb-2" />
          <div className="text-2xl font-bold">{users.filter(u => u.current_streak > 0).length}</div>
          <div className="text-sm text-[var(--color-muted)]">活跃用户</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-muted)]" />
        <input type="text" placeholder="搜索用户邮箱..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 glass-inset rounded-xl text-base bg-transparent border-none outline-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
      </div>

      {/* User List */}
      <Collapsible title={`用户列表 (${filtered.length})`} step={1} defaultOpen>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-muted)]">暂无用户数据</div>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.id} className="glass-inset p-4 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-white">{u.email.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{u.email}</div>
                  <div className="text-xs text-[var(--color-muted)]">
                    积分: {u.total_points} · 连续: {u.current_streak}天 · 等级: L{u.level}
                  </div>
                </div>
                {u.email === '704451222@qq.com' ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 font-semibold">管理员</span>
                ) : (
                  <button onClick={() => { setGrantModal(u.id); setGrantPoints(100); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/20 transition-all flex-shrink-0">
                    <Gift size={14} />
                    发放积分
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Collapsible>

      {/* Grant Modal */}
      {grantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setGrantModal(null)}>
          <div className="glass-card w-96 max-w-[90vw] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold">发放积分</h3>
              <button onClick={() => setGrantModal(null)} className="text-[var(--color-muted)] hover:text-white text-xl">✕</button>
            </div>

            <div className="text-sm text-[var(--color-muted)] mb-4">
              目标用户: {users.find(u => u.id === grantModal)?.email}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">积分数量</label>
                <input type="number" value={grantPoints} onChange={e => setGrantPoints(Number(e.target.value))}
                  min={1} max={99999}
                  className="w-full px-4 py-3 glass-inset rounded-xl text-base bg-transparent border-none outline-none text-[var(--color-text)]" />
                <div className="flex gap-2 mt-2">
                  {[50, 100, 200, 500, 1000].map(n => (
                    <button key={n} onClick={() => setGrantPoints(n)}
                      className="px-3 py-1 rounded-lg text-xs glass-inset hover:bg-white/[0.05] transition-all">
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">发放原因</label>
                <input type="text" value={grantReason} onChange={e => setGrantReason(e.target.value)}
                  placeholder="管理员发放"
                  className="w-full px-4 py-3 glass-inset rounded-xl text-base bg-transparent border-none outline-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]" />
              </div>

              <button onClick={() => handleGrantPoints(grantModal)} disabled={granting || grantPoints <= 0}
                className="w-full btn-primary text-base py-3 flex items-center justify-center gap-2">
                {granting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard size={18} />
                    确认发放 {grantPoints} 积分
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 glass-card px-6 py-4 shadow-2xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toast.ok ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
              {toast.ok ? <Check size={20} className="text-emerald-400" /> : <X size={20} className="text-red-400" />}
            </div>
            <div className="text-base font-semibold">{toast.msg}</div>
          </div>
        </div>
      )}
    </div>
  );
}
