import { useState } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { useNumberStats } from '@/hooks/useNumberStats';
import NumberBall from '@/components/common/NumberBall';

interface QueryResult {
  answer: string;
  numbers?: number[];
  details?: string;
}

const PRESET_QUERIES = [
  { q: '最近20期出现最多的号码', icon: '🔥' },
  { q: '当前遗漏最深的号码', icon: '⏰' },
  { q: '近10期热号有哪些', icon: '📈' },
  { q: '近10期冷号有哪些', icon: '📉' },
  { q: '和值最高的3期', icon: '📊' },
  { q: '奇数最多的号码组合', icon: '⚖️' },
  { q: '连号出现频率', icon: '🔗' },
  { q: '四区最均衡的号码', icon: '🎯' },
];

export default function NLQuery() {
  const { draws } = useDraws(100);
  const { stats } = useNumberStats();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);

  function processQuery(q: string) {
    if (!draws.length || !stats.length) return;
    const lower = q.toLowerCase();

    // 最近N期出现最多的号码
    if (lower.includes('出现最多') || lower.includes('频率最高')) {
      const nMatch = q.match(/(\d+)期/);
      const period = nMatch ? parseInt(nMatch[1]) : 20;
      const recent = draws.slice(0, period);
      const freq = new Map<number, number>();
      recent.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      setResult({
        answer: `近${period}期出现频率最高的10个号码：`,
        numbers: top.map(([n]) => n),
        details: top.map(([n, c]) => `${n.toString().padStart(2, '0')}: ${c}次(${((c / period) * 100).toFixed(0)}%)`).join(' | '),
      });
      return;
    }

    // 遗漏最深
    if (lower.includes('遗漏最深') || lower.includes('遗漏最长')) {
      const top = [...stats].sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 10);
      setResult({
        answer: '当前遗漏最深的10个号码：',
        numbers: top.map(s => s.number),
        details: top.map(s => `${s.number.toString().padStart(2, '0')}: 遗漏${s.currentMiss}期`).join(' | '),
      });
      return;
    }

    // 热号
    if (lower.includes('热号')) {
      const period = lower.match(/(\d+)期/) ? parseInt(lower.match(/(\d+)期/)![1]) : 10;
      const recent = draws.slice(0, period);
      const freq = new Map<number, number>();
      recent.forEach(d => d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1)));
      const hot = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      setResult({
        answer: `近${period}期热号（出现≥${Math.ceil(period * 0.25)}次）：`,
        numbers: hot.filter(([, c]) => c >= Math.ceil(period * 0.25)).map(([n]) => n),
        details: hot.map(([n, c]) => `${n.toString().padStart(2, '0')}: ${c}次`).join(' | '),
      });
      return;
    }

    // 冷号
    if (lower.includes('冷号')) {
      const cold = [...stats].filter(s => s.currentMiss >= 5).sort((a, b) => b.currentMiss - a.currentMiss).slice(0, 10);
      setResult({
        answer: '当前冷号（遗漏≥5期）：',
        numbers: cold.map(s => s.number),
        details: cold.map(s => `${s.number.toString().padStart(2, '0')}: 遗漏${s.currentMiss}期`).join(' | '),
      });
      return;
    }

    // 和值最高
    if (lower.includes('和值最高') || lower.includes('和值最大')) {
      const sorted = [...draws].sort((a, b) => b.sum_value - a.sum_value).slice(0, 3);
      setResult({
        answer: '和值最高的3期：',
        details: sorted.map(d => `${d.draw_number}: 和值${d.sum_value} (${d.draw_date})`).join('\n'),
      });
      return;
    }

    // 奇数最多
    if (lower.includes('奇数最多') || lower.includes('奇偶')) {
      const sorted = [...draws].sort((a, b) => b.odd_count - a.odd_count).slice(0, 3);
      setResult({
        answer: '奇数个数最多的3期：',
        details: sorted.map(d => `${d.draw_number}: ${d.odd_count}奇${d.even_count}偶 (${d.draw_date})`).join('\n'),
      });
      return;
    }

    // 连号
    if (lower.includes('连号')) {
      let withConsec = 0;
      draws.slice(0, 30).forEach(d => { if (d.consecutive_count > 0) withConsec++; });
      setResult({
        answer: `近30期中，${withConsec}期含有连号（${((withConsec / 30) * 100).toFixed(1)}%）`,
        details: `连号出现频率${withConsec > 15 ? '较高' : withConsec > 8 ? '适中' : '较低'}`,
      });
      return;
    }

    // 四区均衡
    if (lower.includes('四区') || lower.includes('均衡')) {
      const avg = draws.slice(0, 20).reduce((a, d) => ({
        z1: a.z1 + d.zone1_count, z2: a.z2 + d.zone2_count,
        z3: a.z3 + d.zone3_count, z4: a.z4 + d.zone4_count,
      }), { z1: 0, z2: 0, z3: 0, z4: 0 });
      const total = 20 * 20;
      setResult({
        answer: '近20期四区分布：',
        details: `一区(1-20): ${((avg.z1 / total) * 100).toFixed(1)}% | 二区(21-40): ${((avg.z2 / total) * 100).toFixed(1)}% | 三区(41-60): ${((avg.z3 / total) * 100).toFixed(1)}% | 四区(61-80): ${((avg.z4 / total) * 100).toFixed(1)}%`,
      });
      return;
    }

    // Default
    setResult({
      answer: `未理解问题"${q}"，试试：出现最多、遗漏最深、热号、冷号、和值最高、奇偶、连号、四区均衡`,
    });
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-3">🤖 智能问答</h3>
      <div className="flex gap-2 mb-3">
        <input value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && query.trim()) processQuery(query.trim()); }}
          placeholder="输入问题，如：最近20期出现最多的号码"
          className="flex-1 glass-input text-sm" />
        <button onClick={() => query.trim() && processQuery(query.trim())}
          className="btn-primary text-sm px-4">查询</button>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESET_QUERIES.map(pq => (
          <button key={pq.q} onClick={() => { setQuery(pq.q); processQuery(pq.q); }}
            className="text-xs glass-inset px-2 py-1 rounded-lg hover:bg-white/10 transition-colors">
            {pq.icon} {pq.q}
          </button>
        ))}
      </div>
      {result && (
        <div className="glass-inset p-4 space-y-2">
          <div className="text-sm font-semibold">{result.answer}</div>
          {result.numbers && (
            <div className="flex flex-wrap gap-1">
              {result.numbers.map(n => <NumberBall key={n} number={n} size="sm" />)}
            </div>
          )}
          {result.details && (
            <div className="text-xs text-[var(--color-muted)] whitespace-pre-line leading-relaxed">{result.details}</div>
          )}
        </div>
      )}
    </div>
  );
}
