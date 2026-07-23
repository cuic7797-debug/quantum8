import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('quantum8_theme');
    const isLight = saved === 'light';
    setLight(isLight);
    document.documentElement.classList.toggle('light-theme', isLight);
  }, []);

  function toggle() {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('light-theme', next);
    localStorage.setItem('quantum8_theme', next ? 'light' : 'dark');
  }

  return (
    <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-white/10 transition-all text-[var(--color-muted)] hover:text-white">
      {light ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
