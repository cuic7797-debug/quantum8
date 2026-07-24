import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Crosshair, TrendingUp, FileText, Database, Scissors, Grid3X3, Shrink, Beaker, FlaskConical, Activity, Network, Clock, Star, User, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import ThemeToggle from '@/components/common/ThemeToggle';
import Disclaimer from '@/components/common/Disclaimer';
import { t } from '@/hooks/useI18n';

interface NavItem {
  path: string;
  label: string;
  icon: any;
  key: string;
}

interface NavGroup {
  name: string;
  icon: any;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    name: '总览',
    icon: Home,
    items: [
      { path: '/', label: '首页', icon: Home, key: '1' },
      { path: '/data', label: '数据管理', icon: Database, key: 'd' },
      { path: '/data-quality', label: '数据质量', icon: BarChart3, key: 'q' },
      { path: '/lottery', label: '多彩票', icon: Crosshair, key: 'l' },
    ],
  },
  {
    name: '数据分析',
    icon: BarChart3,
    items: [
      { path: '/analysis', label: '走势分析', icon: BarChart3, key: '2' },
      { path: '/time-series', label: '时序分析', icon: TrendingUp, key: 't' },
      { path: '/report', label: 'AI 分析报告', icon: FileText, key: '6' },
      { path: '/history', label: '历史开奖', icon: Clock, key: 'h' },
      { path: '/advanced-stats', label: '高级统计', icon: TrendingUp, key: 's' },
    ],
  },
  {
    name: '智能工具',
    icon: Crosshair,
    items: [
      { path: '/selection', label: '智能选号', icon: Crosshair, key: '3' },
      { path: '/kill', label: '杀号工具', icon: Scissors, key: '9' },
      { path: '/matrix', label: '旋转矩阵', icon: Grid3X3, key: '0' },
      { path: '/shrink', label: '智能缩水', icon: Shrink, key: '-' },
    ],
  },
  {
    name: '策略研究',
    icon: Beaker,
    items: [
      { path: '/strategy', label: '策略实验室', icon: Beaker, key: '4' },
      { path: '/backtest', label: '策略回测', icon: FlaskConical, key: '5' },
    ],
  },
  {
    name: '号码研究',
    icon: Activity,
    items: [
      { path: '/number-profile', label: '号码画像', icon: Activity, key: 'p' },
      { path: '/number-graph', label: '号码图谱', icon: Network, key: 'g' },
      { path: '/compare', label: '号码对比', icon: BarChart3, key: 'c' },
    ],
  },
  {
    name: '我的',
    icon: Star,
    items: [
      { path: '/favorites', label: '我的收藏', icon: Star, key: '8' },
    ],
  },
];

function NavGroupSection({ group, location, collapsed, onToggle }: {
  group: NavGroup;
  location: any;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const isActive = group.items.some(item => location.pathname === item.path);
  const hasActiveChild = group.items.some(item => location.pathname === item.path);

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all rounded-r-lg ${
          hasActiveChild
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]'
        }`}>
        <group.icon size={14} className={hasActiveChild ? 'text-[var(--color-primary)]' : ''} />
        <span className="flex-1 text-left">{group.name}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      {!collapsed && (
        <div className="ml-2 space-y-0.5">
          {group.items.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-all rounded-r-lg group nav-item ${
                  active
                    ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]'
                }`}>
                <item.icon size={16} className={active ? 'drop-shadow-[0_0_6px_rgba(59,130,246,0.4)]' : ''} />
                <span className="flex-1">{item.label}</span>
                <span className="text-[10px] opacity-0 group-hover:opacity-40 transition-opacity font-mono">{item.key}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileNavGroup({ group, location, onClose }: { group: NavGroup; location: any; onClose: () => void }) {
  const [open, setOpen] = useState(group.items.some(item => location.pathname === item.path));
  const hasActiveChild = group.items.some(item => location.pathname === item.path);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 px-5 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
          hasActiveChild ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
        }`}>
        <group.icon size={14} />
        <span className="flex-1 text-left">{group.name}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && group.items.map(item => {
        const active = location.pathname === item.path;
        return (
          <Link key={item.path} to={item.path} onClick={onClose}
            className={`flex items-center gap-3 pl-10 pr-5 py-2.5 text-sm transition-all nav-item ${
              active
                ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]'
            }`}>
            <item.icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, loading } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Auto-expand group containing active path
  useEffect(() => {
    navGroups.forEach(group => {
      if (group.items.some(item => location.pathname === item.path)) {
        setCollapsedGroups(prev => {
          const next = new Set(prev);
          next.delete(group.name);
          return next;
        });
      }
    });
  }, [location.pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const allItems = navGroups.flatMap(g => g.items);
      const item = allItems.find(n => n.key === e.key);
      if (item) { e.preventDefault(); navigate(item.path); }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [navigate]);

  function toggleGroup(name: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 glass-sidebar sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[var(--glass-border)] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm">Q8</span>
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text-primary leading-tight">Quantum8</h1>
              <p className="text-[9px] text-[var(--color-muted)]">{t('app.subtitle')}</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navGroups.map(group => (
            <NavGroupSection
              key={group.name}
              group={group}
              location={location}
              collapsed={collapsedGroups.has(group.name)}
              onToggle={() => toggleGroup(group.name)}
            />
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-[var(--glass-border)]">
          <Link to="/auth"
            className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all rounded-r-lg nav-item ${
              location.pathname === '/auth'
                ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]'
            }`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
              {loading ? (
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
              ) : user ? (
                <span className="text-xs font-bold text-white">{user.email?.charAt(0).toUpperCase()}</span>
              ) : (
                <User size={14} className="text-white" />
              )}
            </div>
            <span className="flex-1 text-xs truncate">
              {loading ? '加载中...' : user ? user.email : '登录 / 注册'}
            </span>
          </Link>
        </div>

        {/* Version */}
        <div className="px-5 py-2 border-t border-[var(--glass-border)]">
          <div className="text-[9px] text-[var(--color-muted)] opacity-40 flex justify-between">
            <span>Quantum8 v2.5</span>
            <span>1-6, p, g, t, h</span>
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
                  <span className="text-xs font-bold text-white">{user.email?.charAt(0).toUpperCase()}</span>
                ) : (
                  <User size={14} className="text-white" />
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
            <nav className="absolute left-0 top-0 bottom-0 w-64 glass-sidebar py-3 shadow-2xl shadow-black/40 overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="px-5 pb-3 border-b border-[var(--glass-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Q8</span>
                  </div>
                  <h2 className="text-base font-bold gradient-text-primary">Quantum8</h2>
                </div>
              </div>

              {navGroups.map(group => (
                <MobileNavGroup key={group.name} group={group} location={location} onClose={() => setMobileOpen(false)} />
              ))}

              <div className="border-t border-[var(--glass-border)] mt-2 pt-2">
                <Link to="/auth" onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition-all nav-item ${
                    location.pathname === '/auth'
                      ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]'
                  }`}>
                  <User size={18} />
                  <span>{user ? user.email : '登录 / 注册'}</span>
                </Link>
              </div>

              <div className="px-5 py-4 border-t border-[var(--glass-border)] mt-2">
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
