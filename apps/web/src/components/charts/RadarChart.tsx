interface Props {
  data: { label: string; value: number; maxValue?: number }[];
  size?: number;
  color?: string;
  title?: string;
}

export default function RadarChart({ data, size = 200, color = '#3b82f6', title }: Props) {
  if (!data.length) return null;

  const center = size / 2;
  const radius = size * 0.35;
  const angleStep = (Math.PI * 2) / data.length;

  function getPoint(index: number, value: number, maxValue: number) {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / maxValue) * radius;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  }

  function getLabelPoint(index: number) {
    const angle = index * angleStep - Math.PI / 2;
    const r = radius + 20;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  }

  // Polygon points for data
  const dataPoints = data.map((d, i) => {
    const max = d.maxValue || 100;
    return getPoint(i, d.value, max);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  // Grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="glass-card p-4">
      {title && <h3 className="text-sm font-semibold text-[var(--color-muted)] mb-2">{title}</h3>}
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full" style={{ maxWidth: size }}>
        {/* Grid circles */}
        {gridLevels.map(level => (
          <circle key={level} cx={center} cy={center} r={radius * level}
            fill="none" stroke="rgba(148,163,184,0.1)" strokeWidth={0.5} />
        ))}

        {/* Grid lines */}
        {data.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line key={i}
              x1={center} y1={center}
              x2={center + Math.cos(angle) * radius}
              y2={center + Math.sin(angle) * radius}
              stroke="rgba(148,163,184,0.1)" strokeWidth={0.5} />
          );
        })}

        {/* Data polygon - fill */}
        <path d={dataPath} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={1.5} />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}

        {/* Labels */}
        {data.map((d, i) => {
          const lp = getLabelPoint(i);
          const max = d.maxValue || 100;
          return (
            <g key={i}>
              <text x={lp.x} y={lp.y - 4} textAnchor="middle" fill="#94a3b8" fontSize={8}>
                {d.label}
              </text>
              <text x={lp.x} y={lp.y + 6} textAnchor="middle" fill={color} fontSize={8} fontWeight="bold">
                {Math.round(d.value)}/{max}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
