import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Crosshair, FlaskConical, Clock, Beaker, FileText, Database, Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { t } from '@/hooks/useI18n';

const navItems = [
  { path: '/', label: t('nav.home'), icon: Home, key: '1' },
  { path: '/analysis', label: t('nav.trends'), icon: BarChart3, key: '2' },
  { path: '/selection', label: t('nav.pick'), icon: Crosshair, key: '3' },
  { path: '/strategy', label: t('nav.strategy'), icon: Beaker, key: '4' },
  { path: '/backtest', label: t('nav.backtest'), icon: FlaskConical, key: '5' },
  { path: '/report', label: '分析报告', icon: FileText, key: '6' },
  { path: '/data', label: '数据管理', icon: Database, key: '7' },
  { path: '/history', label: t('nav.history'), icon: Clock, key: '8' },
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
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">Quantum8</h1>
          <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{t('app.subtitle')}</p>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon, key }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all mx-2 rounded-lg group ${
                location.pathname === path
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'
              }`}>
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity">{key}</span>
            </Link>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-[var(--color-border)]">
          <Link to="/auth"
            className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-lg ${
              location.pathname === '/auth'
                ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'
            }`}>
            <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center shrink-0">
              {loading ? (
                <div className="w-3 h-3 border border-[var(--color-muted)] border-t-transparent rounded-full animate-spin" />
              ) : user ? (
                <span className="text-xs font-bold text-[var(--color-primary)]">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={14} />
              )}
            </div>
            <span className="flex-1 text-xs truncate">
              {loading ? '加载中...' : user ? user.email : '登录 / 注册'}
            </span>
          </Link>
        </div>
        <div className="px-5 py-3 border-t border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-muted)] leading-relaxed">
            ⚠ 数据分析工具<br />不构成投注建议
          </div>
          <div className="text-[10px] text-[var(--color-muted)] mt-2 opacity-50">
            快捷键: 1-8 切换页面
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[var(--color-muted)] hover:text-white">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-bold text-[var(--color-primary)]">Quantum8</h1>
          </div>
          <Link to="/auth" className="text-[var(--color-muted)] hover:text-white">
            <div className="w-7 h-7 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
              {user ? (
                <span className="text-xs font-bold text-[var(--color-primary)]">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User size={14} />
              )}
            </div>
          </Link>
        </header>

        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileOpen(false)}>
            <nav className="absolute left-0 top-0 bottom-0 w-56 bg-[var(--color-surface)] border-r border-[var(--color-border)] py-4 shadow-2xl overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="px-5 pb-4 border-b border-[var(--color-border)]">
                <h2 className="text-lg font-bold text-[var(--color-primary)]">Quantum8</h2>
              </div>
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition-all ${
                    location.pathname === path
                      ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-semibold'
                      : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'
                  }`}>
                  <Icon size={18} />
                  <span>{label}</span>
                </Link>
              ))}
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-5 py-3 text-sm transition-all border-t border-[var(--color-border)] mt-4 ${
                  location.pathname === '/auth'
                    ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'
                }`}>
                <User size={18} />
                <span>{user ? user.email : '登录 / 注册'}</span>
              </Link>
              <div className="px-5 py-4 border-t border-[var(--color-border)] mt-4">
                <div className="text-[10px] text-[var(--color-muted)]">⚠ 数据分析工具，不构成投注建议</div>
              </div>
            </nav>
          </div>
        )}

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
