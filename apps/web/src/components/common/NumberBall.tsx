import { formatNumber, getZoneColor } from '@/utils/format';

interface Props {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

export default function NumberBall({ number, size = 'md', highlight }: Props) {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base',
  };

  return (
    <span
      className={`
        number-ball inline-flex items-center justify-center rounded-full border font-mono font-bold
        ${sizeClasses[size]}
        ${getZoneColor(number)}
        ${highlight ? 'ring-2 ring-[var(--color-primary)]/40 shadow-lg shadow-blue-500/20' : ''}
      `}
    >
      {formatNumber(number)}
    </span>
  );
}
