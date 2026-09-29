import type { Routine, ScheduleItem } from '../types';
import { fmtClock, fmtDuration, DAY_SHORT } from '../lib/time';
import TaskCard from './TaskCard';
import { useApp } from '../store/AppContext';

export default function DailyTimeline({
  items,
  onEdit,
  onToggle,
}: {
  items: ScheduleItem[];
  onEdit?: (item: ScheduleItem) => void;
  onToggle?: (item: ScheduleItem) => void;
}) {
  const clock24 = useApp().settings.clock24;
  if (items.length === 0)
    return (
      <p className="card p-6 text-center text-sm text-slate-400">
        Nothing scheduled for this day. Enjoy the stars ✨ — or add a routine.
      </p>
    );
  return (
    <div className="relative">
      {items.map((item) => (
        <div key={item.key} className="flex gap-3">
          {/* time column */}
          <div className="w-16 shrink-0 pt-3.5 text-right">
            <span className="text-[11px] font-bold tabular text-slate-500 dark:text-slate-400">
              {fmtClock(item.start, clock24)}
            </span>
          </div>
          {/* rail */}
          <div className="relative flex flex-col items-center">
            <span
              className={`w-2.5 h-2.5 rounded-full mt-5 shrink-0 ${
                item.status === 'completed'
                  ? 'bg-emerald-500'
                  : item.status === 'missed'
                    ? 'bg-rose-400'
                    : item.status === 'skipped'
                      ? 'bg-slate-300'
                      : 'bg-nova-500'
              }`}
            />
            <span className="flex-1 w-px bg-slate-200 dark:bg-slate-800 my-1" />
          </div>
          <div className="flex-1 pb-3 min-w-0">
            <TaskCard item={item} onEdit={onEdit} onToggle={onToggle} compact />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoutineListRow({
  routine,
  onEdit,
}: {
  routine: Routine;
  onEdit: (r: Routine) => void;
}) {
  return (
    <button
      onClick={() => onEdit(routine)}
      className="card p-3.5 w-full text-left flex items-center gap-3 active:scale-[0.99] transition"
    >
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-nova-500/15 to-nova-700/15 grid place-items-center text-lg">
        ⏰
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{routine.name}</p>
        <p className="text-xs text-slate-400 tabular">
          {routine.startTime} · {fmtDuration(routine.durationMin)}
          {routine.subject ? ` · ${routine.subject}` : ''}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1">
        <div className="flex gap-0.5">
          {DAY_SHORT.map((d, i) => (
            <span
              key={d}
              className={`text-[8.5px] font-bold w-4 h-4 grid place-items-center rounded ${
                routine.repeatDays.includes(i)
                  ? 'bg-nova-500/15 text-nova-600 dark:text-nova-400'
                  : 'text-slate-300 dark:text-slate-700'
              }`}
            >
              {d[0]}
            </span>
          ))}
        </div>
        {routine.paused && <span className="chip bg-amber-50 text-amber-600">paused</span>}
      </div>
    </button>
  );
}
