import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import {
  completionFor,
  dailySeries,
  minutesOn,
  sessionsOn,
} from '../lib/stats';
import {
  DAY_SHORT,
  MONTH_NAMES,
  addDays,
  dateStr,
  fmtDuration,
  fmtDateLong,
  parseDateStr,
} from '../lib/time';
import type { StudySession } from '../types';

/** Month calendar with per-day study/completion indicators. */
export default function CalendarView({
  onPick,
}: {
  onPick?: (date: string) => void;
}) {
  const { sessions, routines, instances } = useApp();
  const today = dateStr();
  const [cursor, setCursor] = useState(() => today.slice(0, 7));
  const [selected, setSelected] = useState(today);

  const grid = useMemo(() => {
    const [y, m] = cursor.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const daysInMonth = new Date(y, m, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday-first grid
    const cells: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${cursor}-${String(d).padStart(2, '0')}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthStats = useMemo(() => {
    const map = new Map<string, { minutes: number; pct: number; n: number }>();
    for (let i = 0; i < 35; i++) {
      const d = addDays(dateStr(), -i);
      map.set(d, {
        minutes: minutesOn(sessions, d),
        pct: completionFor(routines, instances, d).pct,
        n: sessionsOn(sessions, d).length,
      });
    }
    return map;
  }, [sessions, routines, instances]);

  const selSessions: StudySession[] = sessionsOn(sessions, selected);
  const selMinutes = minutesOn(sessions, selected);
  const selCompletion = completionFor(routines, instances, selected);
  const series30 = dailySeries(sessions, 30, selected);
  const maxMin = Math.max(...series30.map((s) => s.minutes), 60);

  const shift = (delta: number) => {
    const [y, m] = cursor.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCursor(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const [y, m] = cursor.split('-').map(Number);

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <button className="btn-ghost !min-h-[36px] !px-3" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <p className="font-bold">
            {MONTH_NAMES[m - 1]} {y}
          </p>
          <button className="btn-ghost !min-h-[36px] !px-3" onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_SHORT.slice(0, 7).map((d) => (
            <span key={d} className="text-center text-[10px] font-bold text-slate-400">
              {d.slice(0, 1)}
              <span className="hidden sm:inline">{d.slice(1)}</span>
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            if (!d) return <span key={i} />;
            const st = monthStats.get(d);
            const mins = st?.minutes ?? 0;
            const intensity =
              mins === 0 ? 0 : Math.min(4, Math.ceil((mins / maxMin) * 4));
            const isToday = d === today;
            const isSel = d === selected;
            const dot =
              (st?.pct ?? 0) >= 80 ? 'bg-emerald-500' : (st?.pct ?? 0) > 0 ? 'bg-slate-300' : '';
            return (
              <button
                key={d}
                onClick={() => {
                  setSelected(d);
                  onPick?.(d);
                }}
                className={`relative aspect-square rounded-lg grid place-items-center text-xs font-semibold transition-all
                  ${
                    isSel
                      ? 'bg-nova-600 text-white scale-105 shadow-glow'
                      : intensity > 0
                        ? [
                            'bg-nova-100 dark:bg-nova-500/15',
                            'bg-nova-200/80 dark:bg-nova-500/25',
                            'bg-nova-300/80 dark:bg-nova-500/40',
                            'bg-nova-400/80 dark:bg-nova-500/55',
                            'bg-nova-500 dark:bg-nova-500/70',
                          ][intensity - 1]
                        : 'bg-slate-100 dark:bg-slate-800/60 text-slate-400'
                  }`}
              >
                <span className={intensity >= 3 || isSel ? 'text-white' : ''}>
                  {parseDateStr(d).getDate()}
                </span>
                {isToday && !isSel && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-nova-600 dark:bg-nova-300" />
                )}
                {dot && !isSel && (
                  <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${dot}`} />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-nova-500" /> more study time
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ≥80% routines
          </span>
        </div>
      </div>

      <div className="card p-4">
        <p className="font-bold mb-3">{fmtDateLong(selected)}</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Study</p>
            <p className="font-extrabold tabular">{fmtDuration(selMinutes)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Tasks</p>
            <p className="font-extrabold tabular">
              {selCompletion.completed}/{selCompletion.total}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Sessions</p>
            <p className="font-extrabold tabular">{selSessions.length}</p>
          </div>
        </div>
        {selSessions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
            {selSessions.map((s) => (
              <div key={s.id} className="flex justify-between text-xs">
                <span className="truncate">
                  {s.subject}
                  {s.task && s.task !== s.subject ? ` — ${s.task}` : ''}
                </span>
                <span className="tabular text-slate-400 font-medium">
                  {fmtDuration((s.end - s.start) / 60000)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
