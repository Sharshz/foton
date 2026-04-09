"use client";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
}

export function Sparkline({
  data,
  width = 120,
  height = 40,
  color = "#00d4ff",
  fillOpacity = 0.15,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pad = strokeWidth;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  // Map data points to SVG coordinates
  const points = data.map((val, i) => ({
    x: pad + (i / (data.length - 1)) * innerW,
    y: pad + innerH - ((val - min) / range) * innerH,
  }));

  // Build smooth cubic bezier path
  function buildPath(pts: { x: number; y: number }[]) {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev.x + curr.x) / 2;
      d += ` C ${cpx} ${prev.y}, ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    return d;
  }

  const linePath = buildPath(points);

  // Area fill: close down to bottom
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const isUp = data[data.length - 1] >= data[0];
  const resolvedColor = isUp ? color : "#ff5050";
  const gradientId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={resolvedColor} stopOpacity={fillOpacity * 2} />
          <stop offset="100%" stopColor={resolvedColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line */}
      <path
        d={linePath}
        stroke={resolvedColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Start dot */}
      <circle cx={firstPoint.x} cy={firstPoint.y} r={2} fill={resolvedColor} opacity={0.4} />

      {/* End dot — glowing */}
      <circle cx={lastPoint.x} cy={lastPoint.y} r={3.5} fill={resolvedColor} opacity={0.25} />
      <circle cx={lastPoint.x} cy={lastPoint.y} r={2} fill={resolvedColor} />
    </svg>
  );
}
