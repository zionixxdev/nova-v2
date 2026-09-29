import type { ScheduleItem } from '../types';
import { fmtClock, fmtDuration } from '../lib/time';
import { useApp } from '../store/AppContext';
import { CATEGORY_ICONS, PRIORITY_STYLES } from './ui';

export default function TaskCard({
  item,
  onEdit,
  onToggle,
  compact = false,
}: {
  item: ScheduleItem;
  onEdit?: (item: ScheduleItem) => void;
  onToggle?: (item: ScheduleItem) => void;
  compact?: boolean;
}) {
  const { settings, now, startTimer, timer } = useApp();
  const { routine: r } = item;
  const isNow = now >= item.start && now < item.end;
  const isPast = now >= item.end;
  const isActiveTask = isNow && item.status === 'pending';

  const statusIcon =
    item.status === 'completed' ? '✓' : item.status === 'skipped' ? '⤼' : item.status === 'missed' ? '✕' : isNow ? '▶' : '○';
  const statusColor =
    item.status === 'completed'
      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
      : item.status === 'missed'
        ? 'text-rose-400 bg-rose-50 dark:bg-rose-500/10'
        : item.status === 'skipped'
          ? 'text-slate-400 bg-slate-100 dark:bg-slate-800'
          : isActiveTask
            ? 'text-nova-600 bg-nova-100 dark:bg-nova-500/20 animate-pulse'
            : 'text-slate-300 bg-slate-100 dark:bg-slate-800';

  const remainingMin = Math.ceil((item.end - now) / 60000);

  return (
    <div
      className={`card p-3.5 flex items-center gap-3 transition-all ${
        isActiveTask
          ? 'ring-2 ring-nova-500/60 dark:ring-nova-500/50 shadow-glow'
          : item.status === 'completed'
            ? 'opacity-60'
            : isPast
              ? 'opacity-50'
              : ''
      }`}
    >
      <button
        aria-label={item.status === 'completed' ? 'Mark pending' : 'Mark complete'}
        onClick={() => onToggle?.(item)}
        className={`w-10 h-10 shrink-0 rounded-full grid place-items-center font-bold text-base ${statusColor}`}
      >
        {statusIcon}
      </button>

      <button className="flex-1 min-w-0 text-left" onClick={() => onEdit?.(item)}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-sm truncate max-w-[9.5rem]">
            {CATEGORY_ICONS[r.category] ?? '✨'} {r.name}
          </span>
          {r.priority !== 'normal' && (
            <span className={`chip ${PRIORITY_STYLES[r.priority].chip}`}>{r.priority}</span>
          )}
          {r.trackStudy && (
            <span className="chip bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-300">
              study
            </span>
          )}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
          <span className="tabular font-medium">
            {fmtClock(item.start, settings.clock24)} – {fmtClock(item.end, settings.clock24)}
          </span>
          <span>· {fmtDuration(r.durationMin)}</span>
          {isActiveTask && remainingMin > 0 && (
            <span className="text-nova-500 font-bold">{remainingMin}m left</span>
          )}
        </div>
        {!compact && r.subject && (
          <div className="text-[11px] text-slate-400 mt-0.5">{r.subject}</div>
        )}
      </button>

      {r.trackStudy && item.status !== 'completed' && (
        <button
          aria-label="Start study timer"
          onClick={() =>
            startTimer(r.subject || r.name, r.name, timer ? undefined : item.key)
          }
          className="btn-soft !min-h-[38px] !px-3 text-xs shrink-0"
          disabled={!!timer}
        >
          ⏱ Start
        </button>
      )}
    </div>
  );
}
