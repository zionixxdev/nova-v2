export default function ProgressRing({
  progress,
  size = 120,
  stroke = 10,
  label,
  sublabel,
  className = '',
}: {
  progress: number; // 0..1 (values above 1 are capped visually)
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, progress));
  const over = progress > 1;
  return (
    <div className={`relative inline-grid place-items-center ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <defs>
          <linearGradient id="nova-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="url(#nova-grad)"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-extrabold tabular">{label ?? `${Math.round(progress * 100)}%`}</div>
        {sublabel && <div className="text-[10px] font-medium text-slate-400">{sublabel}</div>}
        {over && !sublabel && (
          <div className="text-[10px] font-bold text-emerald-500">goal met ✓</div>
        )}
      </div>
    </div>
  );
}
