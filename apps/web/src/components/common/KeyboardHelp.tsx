import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { key: '1', desc: '首页' },
  { key: '2', desc: '走势分析' },
  { key: '3', desc: '智能选号' },
  { key: '4', desc: '策略实验室' },
  { key: '5', desc: '策略回测' },
  { key: '6', desc: 'AI 分析报告' },
  { key: 'b', desc: 'AI 策略生成器' },
  { key: 'd', desc: '数据管理' },
  { key: 'h', desc: '历史开奖' },
  { key: 't', desc: '时序分析' },
  { key: 'p', desc: '号码画像' },
  { key: 'g', desc: '号码图谱' },
  { key: 'c', desc: '号码对比' },
  { key: 'f', desc: '我的收藏' },
  { key: '?', desc: '显示/隐藏快捷键' },
];

export default function KeyboardHelp() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShow(prev => !prev);
      }
      if (e.key === 'Escape') setShow(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <button onClick={() => setShow(!show)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full glass-card flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all shadow-lg"
        title="键盘快捷键 (按 ? 查看)">
        <Keyboard size={18} />
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="glass-card w-80 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">键盘快捷键</h3>
              <button onClick={() => setShow(false)} className="text-[var(--color-muted)] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              {SHORTCUTS.map(s => (
                <div key={s.key} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-[var(--color-muted)]">{s.desc}</span>
                  <kbd className="px-2 py-0.5 text-sm font-mono rounded bg-black/30 border border-[var(--glass-border)] text-[var(--color-text)]">
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--glass-border)] text-xs text-[var(--color-muted)]">
              提示：按 <kbd className="px-1 py-0.5 text-xs font-mono rounded bg-black/30 border border-[var(--glass-border)]">?</kbd> 随时显示此面板
            </div>
          </div>
        </div>
      )}
    </>
  );
}
