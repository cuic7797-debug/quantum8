import { Loader2 } from 'lucide-react';

interface LoadingProps {
  text?: string;
  fullPage?: boolean;
}

export function LoadingState({ text = '加载中...', fullPage = false }: LoadingProps) {
  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
          <span className="text-base text-[var(--color-muted)]">{text}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-2">
        <Loader2 size={18} className="animate-spin text-[var(--color-primary)]" />
        <span className="text-sm text-[var(--color-muted)]">{text}</span>
      </div>
    </div>
  );
}

interface EmptyProps {
  icon?: string;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon = '📭', title = '暂无数据', description, action }: EmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-lg font-semibold text-[var(--color-text)] mb-1">{title}</div>
      {description && <div className="text-sm text-[var(--color-muted)] mb-4">{description}</div>}
      {action && (
        <button onClick={action.onClick} className="btn-primary text-sm">
          {action.label}
        </button>
      )}
    </div>
  );
}
