export function formatNumber(n: number): string {
  return n.toString().padStart(2, '0');
}

export function getZoneColor(n: number): string {
  if (n <= 20) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  if (n <= 40) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (n <= 60) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
}

export function getZoneLabel(n: number): string {
  if (n <= 20) return '一区';
  if (n <= 40) return '二区';
  if (n <= 60) return '三区';
  return '四区';
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getHotColor(score: number): string {
  if (score >= 70) return 'text-red-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-blue-400';
}

export function getMissColor(miss: number): string {
  if (miss >= 15) return 'text-red-400';
  if (miss >= 8) return 'text-amber-400';
  return 'text-emerald-400';
}
