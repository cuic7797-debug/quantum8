import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Crosshair, Network, Activity, Clock2, FlaskConical, Clock, Beaker, FileText, Database, Menu, X, User, Scissors, Grid3X3, Shrink, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/common/ThemeToggle';
import Disclaimer from '@/components/common/Disclaimer';
import { t } from '@/hooks/useI18n';

const navItems = [
  { path: '/', label: t('nav.home'), icon: Home, key: '1' },
  { path: '/analysis', label: t('nav.trends'), icon: BarChart3, key: '2' },
  { path: '/selection', label: t('nav.pick'), icon: Crosshair, key: '3' },
  { path: '/strategy', label: t('nav.strategy'), icon: Beaker, key: '4' },
  { path: '/backtest', label: t('nav.backtest'), icon: FlaskConical, key: '5' },
  { path: '/report', label: '分析报告', icon: FileText, key: '6' },
  { path: '/data', label: '数据管理', icon: Database, key: '7' },
  { path: '/kill', label: '杀号工具', icon: Scissors, key: '9' },
  { path: '/matrix', label: '旋转矩阵', icon: Grid3X3, key: '0' },
  { path: '/shrink', label: '智能缩水', icon: Shrink, key: '-' },
  { path: '/favorites', label: '我的收藏', icon: Star, key: '8' },
  { path: '/history', label: t('nav.history'), icon: Clock, key: '8' },
  { path: '/number-profile', label: '号码画像', icon: Activity, key: 'p' },
  { path: '/number-graph', label: '号码图谱', icon: Network, key: 'g' },
  { path: '/time-series', label: '时序分析', icon: Clock2, key: 't' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const item = navItems.find(n => n.key === e.key);
      if (item) { e.preventDefault(); navigate(item.path); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 glass-sidebar sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-[var(--glass-border)] flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold gradient-text-primary">Quantum8</h1>
            <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{t('app.subtitle')}</p>
          </div>
          <ThemeToggle />
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon, key }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all mx-2 rounded-r-lg group nav-item ${
                  active
                    ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                }`}>
                <Icon size={18} className={active ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]' : ''} />
                <span className="flex-1">{label}</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-40 transition-opacity font-mono">{key}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-3 border-t border-[var(--glass-border)] flex items-center gap-2">
          <Link to="/auth"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-r-lg nav-item ${
              location.pathname === '/auth'
                ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
            }`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              {loading ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : user ? (
                <span className="text-xs font-bold text-white">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={14} className="text-white" />
              )}
            </div>
            <span className="flex-1 text-xs truncate">
              {loading ? '加载中...' : user ? user.email : '登录 / 注册'}
            </span>
          </Link>
        </div>
        <div className="px-5 py-3 border-t border-[var(--glass-border)]">
          <div className="text-[10px] text-[var(--color-muted)] opacity-40">
            快捷键: 1-9, 0, -, 8
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass-header sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[var(--color-muted)] hover:text-[var(--color-text)] p-1 rounded-lg hover:bg-white/5">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-bold gradient-text-primary">Quantum8</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/auth" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-blue-500/20">
                {user ? (
                  <span className="text-xs font-bold text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User size={14} className="text-white" />
                )}
              </div>
            </Link>
          </div>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <nav className="absolute left-0 top-0 bottom-0 w-60 glass-sidebar py-4 shadow-2xl shadow-black/40 overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="px-5 pb-4 border-b border-[var(--glass-border)]">
                <h2 className="text-lg font-bold gradient-text-primary">Quantum8</h2>
              </div>
              {navItems.map(({ path, label, icon: Icon }) => {
                const active = location.pathname === path;
                return (
                  <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-5 py-3 text-sm transition-all nav-item ${
                      active
                        ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                        : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                    }`}>
                    <Icon size={18} />
                    <span>{label}</span>
                  </Link>
                );
              })}
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-all border-t border-[var(--glass-border)] mt-4 nav-item ${
                  location.pathname === '/auth'
                    ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
                }`}>
                <User size={18} />
                <span>{user ? user.email : '登录 / 注册'}</span>
              </Link>
              <div className="px-5 py-4 border-t border-[var(--glass-border)] mt-4">
                <div className="text-[10px] text-[var(--color-muted)]">⚠ 数据分析工具，不构成投注建议</div>
              </div>
            </nav>
          </div>
        )}

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          <Disclaimer />
          {children}
        </main>
      </div>
    </div>
  );
}
