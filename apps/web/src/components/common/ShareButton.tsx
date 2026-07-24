import { useState } from 'react';
import { Share2, Check, Link2, Image } from 'lucide-react';

interface Props {
  numbers: number[];
  title?: string;
  className?: string;
}

export default function ShareButton({ numbers, title = 'Quantum8 推荐号码', className = '' }: Props) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const numberStr = numbers.map(n => n.toString().padStart(2, '0')).join(' ');
  const text = `${title}\n${numberStr}\n\n来自 Quantum8 数据分析平台`;

  async function copyLink() {
    const url = window.location.href;
    const shareText = `${title}: ${numberStr}\n${url}`;
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareText;
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
        await navigator.share({ title, text, url: window.location.href });
      } catch {}
    } else {
      copyLink();
    }
  }

  async function copyImage() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = 600;
      canvas.height = 300;

      // Background
      const grad = ctx.createLinearGradient(0, 0, 600, 300);
      grad.addColorStop(0, '#080c18');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 300);

      // Grid pattern
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < 600; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 300); ctx.stroke(); }
      for (let y = 0; y < 300; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke(); }

      // Title
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.fillText('Quantum8', 30, 40);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px -apple-system, sans-serif';
      ctx.fillText(title, 30, 60);

      // Number balls
      const startX = 30;
      const startY = 90;
      const cols = 10;
      const ballR = 22;
      const gap = 54;

      const colors = ['#3b82f6', '#2563eb', '#1d4ed8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

      numbers.forEach((num, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = startX + col * gap + ballR;
        const y = startY + row * (ballR * 2 + 16) + ballR;

        // Ball shadow
        ctx.beginPath();
        ctx.arc(x, y + 2, ballR, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();

        // Ball gradient
        const ballGrad = ctx.createRadialGradient(x - 4, y - 4, 0, x, y, ballR);
        const c = colors[num % colors.length];
        ballGrad.addColorStop(0, c);
        ballGrad.addColorStop(1, c + '88');
        ctx.beginPath();
        ctx.arc(x, y, ballR, 0, Math.PI * 2);
        ctx.fillStyle = ballGrad;
        ctx.fill();

        // Ball border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(num.toString().padStart(2, '0'), x, y);
      });

      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = '10px -apple-system, sans-serif';
      ctx.fillText('Quantum8 数据分析工具 · 仅供参考', 30, 280);

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1);
      });

      // Copy image to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Fallback: download image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantum8-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {}
  }

  if (!numbers.length) return null;

  return (
    <div className={`relative inline-block ${className}`}>
      <button onClick={() => setShow(!show)}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-all">
        <Share2 size={13} /> 分享
      </button>
      {show && (
        <div className="absolute right-0 top-full mt-1 z-50 glass-card p-2 min-w-[140px] shadow-xl shadow-black/30 space-y-1">
          <button onClick={shareNative}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-left transition-colors">
            <Share2 size={13} /> 系统分享
          </button>
          <button onClick={copyLink}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-left transition-colors">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Link2 size={13} />}
            {copied ? '已复制' : '复制链接'}
          </button>
          <button onClick={copyImage}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-white/5 text-left transition-colors">
            {copied ? <Check size={13} className="text-emerald-400" /> : <Image size={13} />}
            {copied ? '已复制图片' : '生成图片'}
          </button>
        </div>
      )}
    </div>
  );
}
