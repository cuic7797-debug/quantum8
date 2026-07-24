import { LOTTERY_CONFIGS, type LotteryType, type LotteryConfig } from '@quantum8/types';
import { getCurrentLottery, setCurrentLottery } from '@/utils/lotteryData';
import { useState } from 'react';

interface Props {
  onChange?: (type: LotteryType) => void;
}

export default function LotterySelector({ onChange }: Props) {
  const [current, setCurrent] = useState<LotteryType>(getCurrentLottery());
  const [showDropdown, setShowDropdown] = useState(false);

  function select(type: LotteryType) {
    setCurrent(type);
    setCurrentLottery(type);
    setShowDropdown(false);
    onChange?.(type);
  }

  const config = LOTTERY_CONFIGS[current];

  return (
    <div className="relative inline-block">
      <button onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 glass-card hover:border-[var(--color-border-glow)] transition-all text-sm">
        <span className="text-lg">{config.icon}</span>
        <span className="font-bold">{config.shortName}</span>
        <span className="text-xs text-[var(--color-muted)]">{config.drawDays}</span>
        <svg className={`w-3 h-3 text-[var(--color-muted)] transition-transform ${showDropdown ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      
      {showDropdown && (
        <div className="absolute top-full mt-1 left-0 z-50 glass-card p-1 min-w-[200px] shadow-xl shadow-black/30">
          {(Object.values(LOTTERY_CONFIGS) as LotteryConfig[]).map(c => (
            <button key={c.id} onClick={() => select(c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                current === c.id
                  ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                  : 'hover:bg-white/5 text-[var(--color-text)]'
              }`}>
              <span className="text-lg">{c.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{c.name}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {c.mainPick}个号码 / {c.mainPool}选{c.mainPick}
                  {c.bonusPick ? ` + ${c.bonusPick}个${c.bonusPool}` : ''}
                  · {c.drawDays} {c.drawTime}
                </div>
              </div>
              {current === c.id && <span className="text-[var(--color-primary)] text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
