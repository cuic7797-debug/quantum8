import { formatNumber, getZoneColor } from '@/utils/format';

interface Props {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}

export default function NumberBall({ number, size = 'md', highlight }: Props) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
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
