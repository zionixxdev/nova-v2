import { fmtDuration } from '../lib/time';

export default function GoalCard({
  title,
  current,
  target,
  unit = 'min',
  accent = 'nova',
}: {
  title: string;
  current: number;
  target: number;
  unit?: string;
  accent?: 'nova' | 'emerald' | 'amber' | 'cyan';
}) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const done = current >= target && target > 0;
  const colors: Record<string, string> = {
    nova: 'from-nova-500 to-nova-700',
    emerald: 'from-emerald-400 to-emerald-600',
    amber: 'from-amber-400 to-orange-500',
    cyan: 'from-cyan-400 to-sky-600',
  };
  return (
    <div className="card p-4">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</p>
        <p className="text-xs font-bold tabular text-slate-500 dark:text-slate-400">{pct}%</p>
      </div>
      <div className="flex items-baseline gap-1 mb-3">
        <span className="text-2xl font-extrabold tabular">{fmtDuration(current)}</span>
        <span className="text-sm text-slate-400">/ {fmtDuration(target)}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colors[accent]} ${
            done ? '' : ''
          } transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {done && <p className="text-[11px] font-semibold text-emerald-500 mt-1.5">Goal reached 🎉</p>}
      {unit !== 'min' && null}
    </div>
  );
}
