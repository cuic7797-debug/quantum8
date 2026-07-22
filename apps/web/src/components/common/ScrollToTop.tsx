import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() { setShow(window.scrollY > 400); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30 flex items-center justify-center hover:bg-[var(--color-primary)]/80 transition-all hover:scale-110"
      aria-label="回到顶部"
    >
      <ArrowUp size={18} />
    </button>
  );
}
