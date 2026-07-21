import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Crosshair, FlaskConical, Clock } from 'lucide-react';

const navItems = [
  { path: '/', label: '首页', icon: Home },
  { path: '/analysis', label: '走势分析', icon: BarChart3 },
  { path: '/selection', label: '智能选号', icon: Crosshair },
  { path: '/backtest', label: '策略回测', icon: FlaskConical },
  { path: '/history', label: '历史记录', icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">⚡ Quantum8</h1>
          <p className="text-xs text-[var(--color-muted)]">数据分析工具 · 不构成投注建议</p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>

      <nav className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto flex justify-around py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${
                location.pathname === path
                  ? 'text-[var(--color-primary)]'
                  : 'text-[var(--color-muted)] hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
