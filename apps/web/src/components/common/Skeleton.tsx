interface SkeletonProps { className?: string; }

export function SkeletonLine({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse glass-inset h-4 shimmer ${className}`} />;
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse glass-card p-5 space-y-3 shimmer ${className}`}>
      <SkeletonLine className="w-1/3 h-5" />
      <SkeletonLine className="w-full" />
      <SkeletonLine className="w-2/3" />
    </div>
  );
}

export function SkeletonGrid({ count = 80 }: { count?: number }) {
  return (
    <div className="glass-card p-5">
      <SkeletonLine className="w-1/4 h-5 mb-3" />
      <div className="grid grid-cols-10 gap-1.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="animate-pulse glass-inset h-10 shimmer" />
        ))}
      </div>
    </div>
  );
}
