import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  title: string;
  step?: number;
  defaultOpen?: boolean;
  badge?: string;
  children: ReactNode;
}

export default function Collapsible({ title, step, defaultOpen = true, badge, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card overflow-hidden group">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.03] transition-colors">
        <div className="flex items-center gap-2.5">
          {step && (
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-white text-[11px] flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-500/20">
              {step}
            </span>
          )}
          <h3 className="text-sm font-semibold text-left">{title}</h3>
          {badge && (
            <span className="text-[10px] bg-gradient-to-r from-[var(--color-primary)]/20 to-[var(--color-accent)]/20 text-[var(--color-primary)] px-2.5 py-0.5 rounded-full border border-[var(--color-primary)]/10">
              {badge}
            </span>
          )}
        </div>
        <div className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} className="text-[var(--color-muted)]" />
        </div>
      </button>
      <div className={`transition-all duration-300 ease-in-out ${open ? 'max-h-[9999px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 pb-4 border-t border-[var(--glass-border)] pt-3">{children}</div>
      </div>
    </div>
  );
}
