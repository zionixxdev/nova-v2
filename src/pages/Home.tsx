import { useMemo } from 'react';
import { useApp } from '../store/AppContext';
import ProgressRing from '../components/ProgressRing';
import DailyTimeline from '../components/DailyTimeline';
import GoalCard from '../components/GoalCard';
import { fmtClock, fmtDuration, greeting, relDayLabel } from '../lib/time';
import {
  computeStreaks,
  dailyGoalProgress,
  sessionsOn,
  todayMinutes,
} from '../lib/stats';
import type { Routine } from '../types';
import RoutineForm, { emptyRoutine } from '../components/RoutineForm';
import { useState } from 'react';

export default function Home({
  navigate,
  onEditRoutine,
}: {
  navigate: (tab: 'home' | 'schedule' | 'study' | 'progress' | 'settings') => void;
  onEditRoutine: (r: Routine) => void;
}) {
  const app = useApp();
  const { settings, scheduleToday, sessions, routines, instances, now, today } = app;
  const [quickAdd, setQuickAdd] = useState(false);

  const studyMin = useMemo(() => todayMinutes(sessions), [sessions]);
  const streaks = useMemo(
    () => computeStreaks(routines, instances, sessions, settings),
    [routines, instances, sessions, settings]
  );
  const completion = useMemo(() => {
    const done = scheduleToday.filter((i) => i.status === 'completed').length;
    const total = scheduleToday.length;
    return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
  }, [scheduleToday]);

  const currentLabel = app.current
    ? `${app.current.routine.name}`
    : app.next
      ? `Next: ${app.next.routine.name} at ${fmtClock(app.next.start, settings.clock24)}`
      : 'Nothing left today';

  const progress = dailyGoalProgress(sessions, settings);
  const todaySessions = sessionsOn(sessions, today);

  return (
    <div className="space-y-5">
      {/* greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-nova-500">
            {relDayLabel(today)} · {fmtClock(now, settings.clock24)}
          </p>
          <h1 className="text-2xl font-extrabold font-display tracking-tight mt-0.5">
            {greeting(new Date(now))}
            {settings.name ? `, ${settings.name}` : ''}
          </h1>
        </div>
      </div>

      {/* hero stats */}
      <div className="card p-5 relative overflow-hidden">
        <div className="absolute -right-8 -top-10 w-40 h-40 rounded-full bg-nova-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-5">
          <ProgressRing progress={progress} size={110} stroke={9} />
          <div className="flex-1 space-y-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Today's Progress
              </p>
              <p className="font-extrabold tabular text-lg leading-tight">
                {completion.done} / {completion.total} tasks
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Study Time
              </p>
              <p className="font-extrabold tabular text-lg leading-tight">
                {fmtDuration(studyMin)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                🔥 Streak
              </p>
              <p className="font-extrabold text-lg leading-tight">{streaks.current} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* now / next */}
      <div className={`card p-4 flex items-center gap-3 ${app.current ? 'ring-1 ring-nova-500/40' : ''}`}>
        <span className="text-2xl">{app.current ? '▶' : '⏭'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {app.current ? 'Current task' : 'Up next'}
          </p>
          <p className="font-bold text-sm truncate">{currentLabel}</p>
          {app.current && (
            <p className="text-xs text-nova-500 font-semibold tabular">
              {Math.max(0, Math.ceil((app.current.end - now) / 60000))} min remaining
            </p>
          )}
        </div>
        {app.current?.routine.trackStudy && (
          <button
            className="btn-primary !min-h-[38px] text-xs"
            disabled={!!app.timer}
            onClick={() => {
              app.startTimer(
                app.current!.routine.subject || app.current!.routine.name,
                app.current!.routine.name,
                app.current!.key
              );
              navigate('study');
            }}
          >
            Start
          </button>
        )}
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          className="card p-3 flex flex-col items-center gap-1 active:scale-95 transition"
          onClick={() => {
            navigate('study');
          }}
        >
          <span className="text-xl">▶</span>
          <span className="text-[11px] font-semibold">Start Study</span>
        </button>
        <button
          className="card p-3 flex flex-col items-center gap-1 active:scale-95 transition"
          onClick={() => {
            if (app.next) {
              void app.setTaskStatus(app.next.routine.id, today, 'completed');
            } else {
              setQuickAdd(true);
            }
          }}
        >
          <span className="text-xl">{app.next ? '✓' : '＋'}</span>
          <span className="text-[11px] font-semibold">{app.next ? 'Complete next' : 'Add routine'}</span>
        </button>
        <button
          className="card p-3 flex flex-col items-center gap-1 active:scale-95 transition"
          onClick={() => navigate('progress')}
        >
          <span className="text-xl">📊</span>
          <span className="text-[11px] font-semibold">Progress</span>
        </button>
      </div>

      {/* daily goal */}
      <GoalCard
        title="Daily study goal"
        current={studyMin}
        target={settings.dailyGoalMin}
        accent={progress >= 1 ? 'emerald' : 'nova'}
      />

      {/* today's timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Today's timeline
          </h2>
          <button className="text-xs font-bold text-nova-600 dark:text-nova-400" onClick={() => setQuickAdd(true)}>
            + Add
          </button>
        </div>
        <DailyTimeline
          items={scheduleToday}
          onEdit={(item) => onEditRoutine(item.routine)}
          onToggle={(item) =>
            void app.setTaskStatus(
              item.routine.id,
              today,
              item.status === 'completed' ? 'pending' : 'completed'
            )
          }
        />
      </div>

      {/* end of day summary */}
      {completion.total > 0 && new Date(now).getHours() >= 19 && (
        <div className="card p-5 bg-gradient-to-br from-nova-600 to-nova-800 !border-0 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-nova-200 mb-3">
            Today's Summary
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase font-bold text-nova-200/80">Study Time</p>
              <p className="font-extrabold tabular">{fmtDuration(studyMin)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-nova-200/80">Tasks</p>
              <p className="font-extrabold tabular">
                {completion.done} / {completion.total}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-nova-200/80">Goal</p>
              <p className="font-extrabold tabular">{Math.round(progress * 100)}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-nova-200/80">Sessions</p>
              <p className="font-extrabold tabular">{todaySessions.length}</p>
            </div>
          </div>
          <p className="text-xs text-nova-200/90 mt-3">
            🔥 {streaks.current}-day streak — keep it burning!
          </p>
        </div>
      )}

      <RoutineForm
        open={quickAdd}
        onClose={() => setQuickAdd(false)}
        initial={emptyRoutine(settings.defaultReminderMin)}
        mode="create"
      />
    </div>
  );
}
