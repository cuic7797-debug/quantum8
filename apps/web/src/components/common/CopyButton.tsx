import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

export default function CopyButton({ text, label = '复制', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={handleCopy}
      className={'inline-flex items-center gap-1.5 text-sm transition-all ' + (copied ? 'text-emerald-400' : 'text-[var(--color-primary)] hover:text-[var(--color-primary)]/80') + ' ' + className}>
      {copied ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> {label}</>}
    </button>
  );
}
