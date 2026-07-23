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
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          {step && (
            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold shrink-0">
              {step}
            </span>
          )}
          <h3 className="text-sm font-semibold text-left">{title}</h3>
          {badge && <span className="text-[10px] bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-[var(--color-muted)]" /> : <ChevronDown size={16} className="text-[var(--color-muted)]" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
