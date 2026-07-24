interface Props {
  value: number;
  onChange: (n: number) => void;
  options?: number[];
}

export default function PeriodSelector({ value, onChange, options = [50, 100, 200, 500] }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-[var(--color-muted)]">期数:</span>
      <div className="flex bg-black/20 rounded-lg p-0.5 border border-[var(--glass-border)]">
        {options.map(n => (
          <button key={n} onClick={() => onChange(n)}
            className={`px-2.5 py-1 text-[11px] rounded-md transition-all font-medium ${
              value === n
                ? 'bg-[var(--color-primary)] text-white shadow-md shadow-blue-500/20'
                : 'text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-white/5'
            }`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
