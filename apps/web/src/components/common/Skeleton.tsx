interface SkeletonProps { className?: string; }

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-[var(--color-border)] rounded h-4 ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5 space-y-3 ${className}`}>
      <SkeletonLine className="w-1/3 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-2/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 80 }: { count?: number }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
      <SkeletonLine className="w-1/4 h-5 mb-3" />
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse bg-[var(--color-border)] rounded-lg h-10" />
        ))}
      </div>
    </div>
  );
}
