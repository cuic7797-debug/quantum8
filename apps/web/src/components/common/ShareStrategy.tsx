import { useState } from 'react';
import { Share2, Copy, Check, Link2 } from 'lucide-react';

interface Props {
  strategy: {
    name: string;
    description: string;
    playType: string;
    hotCount: number;
    coldCount: number;
    balanceCount: number;
    zoneBalance: boolean;
    sumRange: [number, number];
    oddEvenRange: [number, number];
    maxConsecutive: number;
  };
  className?: string;
}

export default function ShareStrategy({ strategy, className = '' }: Props) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  function encodeStrategy() {
    const data = {
      n: strategy.name,
      d: strategy.description,
      p: strategy.playType,
      h: strategy.hotCount,
      c: strategy.coldCount,
      b: strategy.balanceCount,
      z: strategy.zoneBalance ? 1 : 0,
      s: strategy.sumRange,
      o: strategy.oddEvenRange,
      m: strategy.maxConsecutive,
    };
    return btoa(JSON.stringify(data));
  }

  function getShareUrl() {
    const encoded = encodeStrategy();
    return `${window.location.origin}/strategy?import=${encoded}`;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(getShareUrl());
    } catch {
      const ta = document.createElement('textarea');
      ta.value = getShareUrl();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function shareNative() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quantum8 策略: ${strategy.name}`,
          text: `${strategy.description}\n玩法: ${strategy.playType} | 热${strategy.hotCount} 冷${strategy.coldCount} 平${strategy.balanceCount}`,
          url: getShareUrl(),
        });
      } catch {}
    } else {
      copyLink();
    }
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <button onClick={() => setShow(!show)}
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-all">
        <Share2 size={13} /> 分享策略
      </button>
      {show && (
        <div className="absolute right-0 top-full mt-1 z-50 glass-card p-2 min-w-[160px] shadow-xl shadow-black/30 space-y-1">
          <button onClick={shareNative}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-white/5 text-left transition-colors">
            <Share2 size={13} /> 系统分享
          </button>
          <button onClick={copyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-white/5 text-left transition-colors">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} />}
            {copied ? '已复制链接' : '复制分享链接'}
          </button>
          <button onClick={() => {
            const text = `${strategy.name}\n${strategy.description}\n玩法: ${strategy.playType}\n热${strategy.hotCount} 冷${strategy.coldCount} 平${strategy.balanceCount}\n${getShareUrl()}`;
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-white/5 text-left transition-colors">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            {copied ? '已复制' : '复制策略详情'}
          </button>
        </div>
      )}
    </div>
  );
}
