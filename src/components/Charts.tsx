/* Lightweight dependency-free SVG charts, tuned for mobile. */

import type { DayPoint } from '../lib/stats';
import { fmtDateShort, fmtDuration } from '../lib/time';

const PALETTE = [
  '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#ec4899', '#3b82f6', '#84cc16', '#f97316', '#14b8a6',
];

export function BarChart({ data, height = 140 }: { data: DayPoint[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.minutes), 30);
  return (
    <div className="flex items-end gap-1.5 overflow-x-auto" style={{ height }}>
      {data.map((d) => {
        const h = Math.max(3, (d.minutes / max) * (height - 42));
        const isToday = d.date === data[data.length - 1]?.date;
        return (
          <div key={d.date} className="flex-1 min-w-[18px] flex flex-col items-center justify-end gap-1">
            <span className="text-[9px] font-semibold text-slate-400 tabular">
              {d.minutes > 0 ? Math.round(d.minutes) + 'm' : ''}
            </span>
            <div
              className={`w-full rounded-t-md transition-all ${
                d.minutes > 0
                  ? 'bg-gradient-to-t from-nova-600 to-nova-400'
                  : 'bg-slate-200 dark:bg-slate-800'
              } ${isToday ? 'ring-2 ring-nova-300' : ''}`}
              style={{ height: h }}
              title={`${fmtDateShort(d.date)} — ${fmtDuration(d.minutes)}`}
            />
            <span className="text-[8.5px] text-slate-400">{fmtDateShort(d.date).split(' ')[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function LineChart({ data, height = 120 }: { data: DayPoint[]; height?: number }) {
  const w = 320;
  const h = height;
  const pad = 8;
  const max = Math.max(...data.map((d) => d.minutes), 30);
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - 2 * pad);
    const y = h - pad - (d.minutes / max) * (h - 2 * pad - 14);
    return [x, y] as const;
  });
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area =
    pts.length > 0
      ? `${path} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
      : '';
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill="url(#line-fill)" />}
      <path d={path} fill="none" stroke="#8b5cf6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={data[i].date} cx={p[0]} cy={p[1]} r={data[i].minutes > 0 ? 3 : 0} fill="#a78bfa" />
      ))}
    </svg>
  );
}

export function DonutChart({
  data,
  size = 160,
}: {
  data: { subject: string; minutes: number }[];
  size?: number;
}) {
  const total = data.reduce((a, d) => a + d.minutes, 0);
  if (total === 0)
    return <p className="text-sm text-slate-400 text-center py-6">No study time recorded yet</p>;
  const stroke = 22;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {data.slice(0, 8).map((d, i) => {
            const frac = d.minutes / total;
            const el = (
              <circle
                key={d.subject}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={stroke}
                strokeDasharray={`${c * frac - 2} ${c * (1 - frac) + 2}`}
                strokeDashoffset={-c * offset}
                strokeLinecap="round"
              />
            );
            offset += frac;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Total</div>
            <div className="font-extrabold tabular text-sm">{fmtDuration(total)}</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full">
        {data.slice(0, 8).map((d, i) => (
          <div key={d.subject} className="flex items-center gap-1.5 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="truncate flex-1">{d.subject}</span>
            <span className="tabular text-slate-400 font-medium">{fmtDuration(d.minutes)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
