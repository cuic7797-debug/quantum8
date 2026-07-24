import { useMemo, useState, useRef, useEffect } from 'react';
import { useDraws } from '@/hooks/useDraws';
import { t } from '@/hooks/useI18n';

interface Node {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  frequency: number;
  cluster: string;
}

interface Edge {
  source: number;
  target: number;
  weight: number;
}

export default function NumberGraphPage() {
  const { draws, loading: ld } = useDraws(100);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const animRef = useRef<number>();

  if (ld) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('loading')}</div>;
  if (!draws.length) return <div className="flex items-center justify-center h-64 text-[var(--color-muted)]">{t('no_data')}</div>;

  // Build co-occurrence data
  const { nodes, edges } = useMemo(() => {
    const freq = new Map<number, number>();
    const coAppear = new Map<string, number>();

    draws.forEach(d => {
      d.numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1));
      const nums = [...d.numbers].sort((a, b) => a - b);
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          const key = `${nums[i]}-${nums[j]}`;
          coAppear.set(key, (coAppear.get(key) || 0) + 1);
        }
      }
    });

    const maxFreq = Math.max(...freq.values());
    const threshold = 3;

    const nodeArr: Node[] = Array.from({ length: 80 }, (_, i) => {
      const n = i + 1;
      const f = (freq.get(n) || 0) / maxFreq;
      const angle = (n / 80) * Math.PI * 2;
      const r = 200 + Math.random() * 50;
      return {
        id: n,
        x: 300 + Math.cos(angle) * r,
        y: 300 + Math.sin(angle) * r,
        vx: 0, vy: 0,
        frequency: f,
        cluster: f > 0.7 ? 'hot' : f > 0.4 ? 'warm' : f > 0.2 ? 'cool' : 'cold',
      };
    });

    const edgeArr: Edge[] = [];
    coAppear.forEach((count, key) => {
      if (count >= threshold) {
        const [a, b] = key.split('-').map(Number);
        edgeArr.push({ source: a, target: b, weight: count });
      }
    });

    return { nodes: nodeArr, edges: edgeArr };
  }, [draws]);

  // Force simulation
  useEffect(() => {
    nodesRef.current = nodes.map(n => ({ ...n }));
    edgesRef.current = edges.map(e => ({ ...e }));

    function tick() {
      const ns = nodesRef.current;
      const es = edgesRef.current;
      const alpha = 0.3;

      // Repulsion between all nodes
      for (let i = 0; i < ns.length; i++) {
        for (let j = i + 1; j < ns.length; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          ns[i].vx -= (dx / dist) * force;
          ns[i].vy -= (dy / dist) * force;
          ns[j].vx += (dx / dist) * force;
          ns[j].vy += (dy / dist) * force;
        }
      }

      // Attraction along edges
      es.forEach(e => {
        const s = ns.find(n => n.id === e.source);
        const t = ns.find(n => n.id === e.target);
        if (!s || !t) return;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * 0.01 * (e.weight / 10);
        s.vx += (dx / dist) * force;
        s.vy += (dy / dist) * force;
        t.vx -= (dx / dist) * force;
        t.vy -= (dy / dist) * force;
      });

      // Center gravity
      ns.forEach(n => {
        n.vx += (300 - n.x) * 0.001;
        n.vy += (300 - n.y) * 0.001;
        n.vx *= 0.9;
        n.vy *= 0.9;
        n.x += n.vx * alpha;
        n.y += n.vy * alpha;
        n.x = Math.max(30, Math.min(570, n.x));
        n.y = Math.max(30, Math.min(570, n.y));
      });
    }

    let frame = 0;
    function animate() {
      if (frame < 200) {
        tick();
        frame++;
        animRef.current = requestAnimationFrame(animate);
      }
    }
    animate();

    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [nodes, edges]);

  const clusterColors: Record<string, string> = {
    hot: '#ef4444',
    warm: '#f59e0b',
    cool: '#3b82f6',
    cold: '#64748b',
  };

  const connectedEdges = selected !== null
    ? edges.filter(e => e.source === selected || e.target === selected)
    : [];
  const connectedNums = new Set(connectedEdges.map(e => e.source === selected ? e.target : e.source));

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold gradient-text-primary">🔗 号码关系图谱</h2>
      <div className="text-xs text-[var(--color-muted)]">力导向图展示号码共现关系，连线越粗表示同期出现频率越高</div>

      <div className="glass-card p-4 overflow-hidden">
        <svg ref={svgRef} viewBox="0 0 600 600" className="w-full" style={{ maxHeight: '70vh' }}>
          {/* Edges */}
          {edges.map((e, i) => {
            const s = nodesRef.current.find(n => n.id === e.source);
            const t = nodesRef.current.find(n => n.id === e.target);
            if (!s || !t) return null;
            const isHighlighted = selected !== null && (e.source === selected || e.target === selected);
            return (
              <line key={i}
                x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                stroke={isHighlighted ? '#3b82f6' : 'rgba(148,163,184,0.1)'}
                strokeWidth={isHighlighted ? Math.min(e.weight / 3, 4) : Math.min(e.weight / 5, 1.5)}
                opacity={selected !== null ? (isHighlighted ? 0.8 : 0.1) : 0.3}
              />
            );
          })}

          {/* Nodes */}
          {nodesRef.current.map(n => {
            const isHovered = hovered === n.id;
            const isSelected = selected === n.id;
            const isConnected = connectedNums.has(n.id);
            const r = 8 + n.frequency * 12;
            return (
              <g key={n.id}
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => setSelected(selected === n.id ? null : n.id)}
                style={{ cursor: 'pointer' }}>
                {/* Glow */}
                {(isHovered || isSelected) && (
                  <circle cx={n.x} cy={n.y} r={r + 6}
                    fill={clusterColors[n.cluster]} opacity={0.2} />
                )}
                {/* Node */}
                <circle cx={n.x} cy={n.y} r={r}
                  fill={clusterColors[n.cluster]}
                  opacity={selected !== null ? (isSelected || isConnected ? 1 : 0.2) : 0.8}
                  stroke={isSelected ? '#fff' : 'transparent'}
                  strokeWidth={isSelected ? 2 : 0}
                />
                {/* Label */}
                <text x={n.x} y={n.y + 1}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize={r > 12 ? 9 : 7} fontWeight="bold" fontFamily="monospace"
                  opacity={selected !== null ? (isSelected || isConnected ? 1 : 0.2) : 0.9}>
                  {n.id.toString().padStart(2, '0')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap gap-4 text-xs">
          {Object.entries(clusterColors).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full" style={{ background: v }} />
              {{ hot: '🔥 热号', warm: '🌡️ 温号', cool: '❄️ 冷号', cold: '🧊 冰号' }[k]}
            </span>
          ))}
          <span className="text-[var(--color-muted)]">| 点击节点查看详情</span>
        </div>
      </div>

      {/* Selected number detail */}
      {selected !== null && (
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-2">号码 {selected.toString().padStart(2, '0')} 关联详情</h3>
          <div className="text-xs text-[var(--color-muted)] mb-2">
            同期出现 {connectedEdges.length} 个关联号码，共 {connectedEdges.reduce((a, e) => a + e.weight, 0)} 次共现
          </div>
          <div className="flex flex-wrap gap-1">
            {connectedEdges
              .sort((a, b) => b.weight - a.weight)
              .slice(0, 15)
              .map(e => {
                const other = e.source === selected ? e.target : e.source;
                return (
                  <span key={other}
                    className="px-2 py-1 rounded-lg glass-inset text-xs font-mono">
                    {other.toString().padStart(2, '0')}
                    <span className="text-[var(--color-primary)] ml-1">{e.weight}次</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
