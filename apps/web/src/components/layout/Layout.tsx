import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Crosshair, FlaskConical, Clock } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/analysis', label: 'Trends', icon: BarChart3 },
  { path: '/selection', label: 'Pick', icon: Crosshair },
  { path: '/backtest', label: 'Backtest', icon: FlaskConical },
  { path: '/history', label: 'History', icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">Quantum8</h1>
          <p className="text-xs text-[var(--color-muted)]">Data Analytics Tool</p>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">{children}</main>
      <nav className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="max-w-7xl mx-auto flex justify-around py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs transition-colors ${location.pathname === path ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-white'}`}>
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
