export function Sparkline({
  values,
  color,
  width = 100,
  height = 28,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length === 0) return null;

  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const stepX = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values
    .map((v, i) => {
      const x = values.length > 1 ? i * stepX : width / 2;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
