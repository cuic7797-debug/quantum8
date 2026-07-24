import { useEffect, useRef, ReactNode } from 'react';

interface Props { children: ReactNode; }

export default function PageTransition({ children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(12px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  }, [children]);

  return <div ref={ref}>{children}</div>;
}
