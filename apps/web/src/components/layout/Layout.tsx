import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Crosshair, TrendingUp, FileText, Database, Scissors, Grid3X3, Shrink, Beaker, FlaskConical, Activity, Network, Clock, Star, User, Menu, X, ChevronDown, Brain, Target, Trophy, Calendar, CreditCard } from "lucide-react";
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCheckin } from '@/hooks/useCheckin';
import ThemeToggle from '@/components/common/ThemeToggle';
import Disclaimer from '@/components/common/Disclaimer';

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
      { path: '/dashboard', label: '我的仪表盘', icon: BarChart3, key: 'z' },
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
      { path: '/prediction-score', label: '号码预测评分', icon: Target, key: 'r' },
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
      { path: '/ai-playbook', label: 'AI 策略生成器', icon: Brain, key: 'b' },
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
      { path: '/strategy-market', label: '策略市场', icon: Star, key: 'm' },
      { path: '/leaderboard', label: '策略排行榜', icon: Trophy, key: 'w' },
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
      { path: '/checkin', label: '每日签到', icon: Calendar, key: 'i' },
      { path: '/points-store', label: '积分商城', icon: CreditCard, key: 'x' },
      { path: '/profile', label: '个人中心', icon: User, key: 'u' },
    ],
  },
];

function NavGroupSection({ group, location, collapsed, onToggle }: {
  group: NavGroup;
  location: any;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const hasActiveChild = group.items.some(item => location.pathname === item.path);

  return (
    <div className="mb-1">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-semibold uppercase tracking-wider transition-all rounded-r-lg ${
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
                <span className="text-xs opacity-0 group-hover:opacity-40 transition-opacity font-mono">{item.key}</span>
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
    <div className="mb-1">
      <button onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-sm font-semibold uppercase tracking-wider transition-all ${
          hasActiveChild ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'
        }`}>
        <group.icon size={14} />
        <span className="flex-1 text-left">{group.name}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && (
        <div className="ml-4 space-y-0.5">
          {group.items.map(item => (
            <Link key={item.path} to={item.path} onClick={onClose}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all nav-item ${
                location.pathname === item.path
                  ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { user, loading } = useAuth();
  const { points, todayChecked } = useCheckin();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const allItems = navGroups.flatMap(g => g.items);
      const item = allItems.find(i => i.key === e.key);
      if (item) {
        e.preventDefault();
        navigate(item.path);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  function toggleGroup(name: string) {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 glass-sidebar border-r border-[var(--glass-border)] sticky top-0 h-screen overflow-y-auto shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-[var(--glass-border)]">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-sm">Q8</span>
            </div>
            <div>
              <h1 className="text-base font-bold gradient-text-primary">Quantum8</h1>
              <div className="text-[10px] text-[var(--color-muted)]">快乐八数据分析平台</div>
            </div>
          </Link>
        </div>

        {/* Theme Toggle */}
        <div className="px-5 py-2 border-b border-[var(--glass-border)] flex items-center justify-between">
          <span className="text-xs text-[var(--color-muted)]">主题</span>
          <ThemeToggle />
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
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

        {/* Version */}
        <div className="px-5 py-2 border-t border-[var(--glass-border)]">
          <div className="text-[10px] text-[var(--color-muted)] opacity-40 flex justify-between">
            <span>Quantum8 v5.2</span>
            <span>1-6, b, w, i, x, u</span>
          </div>
        </div>
      </aside>

      {/* Right Side: Header + Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Desktop Header - Login/Avatar at Top Right */}
        <header className="hidden lg:flex items-center justify-end gap-4 px-6 py-3 glass-header sticky top-0 z-30 border-b border-[var(--glass-border)]">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Points Badge */}
              <Link to="/checkin" className="flex items-center gap-1.5 glass-card px-3 py-1.5 text-sm hover:border-amber-500/30 transition-all">
                <Star size={14} className="text-amber-400" />
                <span className="font-bold">{points?.total_points || 0}</span>
                <span className="text-[var(--color-muted)]">积分</span>
              </Link>

              {/* Today Checkin */}
              {!todayChecked && (
                <Link to="/checkin" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-semibold hover:bg-emerald-500/25 transition-all">
                  <Calendar size={14} />
                  <span>签到</span>
                </Link>
              )}

              {/* User Avatar */}
              <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-xs font-bold text-white">{user.email?.charAt(0).toUpperCase()}</span>
                </div>
                <span className="text-sm text-[var(--color-muted)] max-w-[120px] truncate">{user.email?.split('@')[0]}</span>
              </Link>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary text-sm px-5 py-2">
              登录 / 注册
            </Link>
          )}
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 glass-header sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-[var(--color-muted)] hover:text-[var(--color-text)] p-1 rounded-lg hover:bg-white/5">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-bold gradient-text-primary">Quantum8</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/profile" className="text-[var(--color-muted)] hover:text-[var(--color-text)]">
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
                <Link to="/profile" onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-5 py-3 text-sm transition-all nav-item ${
                    location.pathname === '/profile' || location.pathname === '/auth'
                      ? 'nav-item-active text-[var(--color-primary)] font-semibold'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/[0.03]'
                  }`}>
                  <User size={18} />
                  <span>{user ? user.email?.split('@')[0] : '登录 / 注册'}</span>
                </Link>
              </div>

              <div className="px-5 py-4 border-t border-[var(--glass-border)] mt-2">
                <div className="text-xs text-[var(--color-muted)]">⚠ 数据分析工具，不构成投注建议</div>
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
