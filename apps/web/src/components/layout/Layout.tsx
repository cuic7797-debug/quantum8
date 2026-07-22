import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Crosshair, FlaskConical, Clock, Beaker, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { t } from '@/hooks/useI18n';

const navItems = [
  { path: '/', label: t('nav.home'), icon: Home },
  { path: '/analysis', label: t('nav.trends'), icon: BarChart3 },
  { path: '/selection', label: t('nav.pick'), icon: Crosshair },
  { path: '/strategy', label: t('nav.strategy'), icon: Beaker },
  { path: '/backtest', label: t('nav.backtest'), icon: FlaskConical },
  { path: '/history', label: t('nav.history'), icon: Clock },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 h-screen">
        <div className="px-5 py-5 border-b border-[var(--color-border)]">
          <h1 className="text-xl font-bold text-[var(--color-primary)]">Quantum8</h1>
          <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{t('app.subtitle')}</p>
        </div>
        <nav className="flex-1 py-3">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-all mx-2 rounded-lg ${
                location.pathname === path
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-muted)] hover:text-white hover:bg-white/5'
              }`}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-[var(--color-border)]">
          <div className="text-[10px] text-[var(--color-muted)] leading-relaxed">
            ⚠ 数据分析工具<br />不构成投注建议
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
          <p className="text-[10px] text-[var(--color-muted)]">{t('app.subtitle')}</p>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-20 bg-black/50" onClick={() => setMobileOpen(false)}>
            <nav className="absolute left-0 top-0 bottom-0 w-56 bg-[var(--color-surface)] border-r border-[var(--color-border)] py-4 shadow-2xl"
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
              <div className="px-5 py-4 border-t border-[var(--color-border)] mt-4">
                <div className="text-[10px] text-[var(--color-muted)]">⚠ 数据分析工具，不构成投注建议</div>
              </div>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
