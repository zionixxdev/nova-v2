import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { BarChart, DonutChart, LineChart } from '../components/Charts';
import GoalCard from '../components/GoalCard';
import CalendarView from '../components/CalendarView';
import { Segmented } from '../components/ui';
import {
  bySubject,
  completionFor,
  computeStreaks,
  dailySeries,
  minutesOn,
  monthMinutes,
  sessionsOn,
  todayMinutes,
  totalMinutes,
  weekMinutes,
} from '../lib/stats';
import { addDays, fmtDuration } from '../lib/time';

export default function ProgressPage() {
  const { sessions, routines, instances, settings, today } = useApp();
  const [range, setRange] = useState<'week' | 'month' | 'all'>('week');
  const [chart, setChart] = useState<'bar' | 'trend'>('bar');

  const todayMin = useMemo(() => todayMinutes(sessions), [sessions]);
  const weekMin = useMemo(() => weekMinutes(sessions), [sessions]);
  const monthMin = useMemo(() => monthMinutes(sessions), [sessions]);
  const totalMin = useMemo(() => totalMinutes(sessions), [sessions]);
  const streaks = useMemo(
    () => computeStreaks(routines, instances, sessions, settings),
    [routines, instances, sessions, settings]
  );

  const completionToday = completionFor(routines, instances, today);
  const missedToday = useMemo(() => {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, -i);
      const items = completionFor(routines, instances, d);
      n += items.total - items.completed;
    }
    return n;
  }, [routines, instances, today]);

  const subjectTotals = useMemo(() => {
    const from =
      range === 'week' ? addDays(today, -6) : range === 'month' ? addDays(today, -29) : '0000-01-01';
    return bySubject(
      sessions.filter((s) => s.date >= from)
    );
  }, [sessions, range, today]);

  const series = useMemo(() => {
    if (range === 'week') return dailySeries(sessions, 7);
    if (range === 'month') return dailySeries(sessions, 30);
    return dailySeries(sessions, 14);
  }, [sessions, range]);

  const weeklyBySubject = useMemo(() => {
    const from = addDays(today, -6);
    return bySubject(sessions.filter((s) => s.date >= from));
  }, [sessions, today]);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold font-display tracking-tight">Progress</h1>

      {/* headline numbers */}
      <div className="grid grid-cols-2 gap-2.5">
        <StatBox label="Today" value={fmtDuration(todayMin)} />
        <StatBox label="This week" value={fmtDuration(weekMin)} />
        <StatBox label="This month" value={fmtDuration(monthMin)} />
        <StatBox label="All time" value={fmtDuration(totalMin)} />
      </div>

      {/* streaks + completion */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="card p-4 text-center">
          <p className="text-3xl mb-1">🔥</p>
          <p className="text-2xl font-extrabold tabular">{streaks.current}</p>
          <p className="text-[11px] text-slate-400 font-semibold">
            day streak{settings.streakRuleType === 'completionPct' ? ' (routines)' : ''}
          </p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-3xl mb-1">🏆</p>
          <p className="text-2xl font-extrabold tabular">{streaks.longest}</p>
          <p className="text-[11px] text-slate-400 font-semibold">longest streak</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <StatBox label="Done today" value={`${completionToday.completed}`} />
        <StatBox label="Missed (7d)" value={`${missedToday}`} />
        <StatBox label="Sessions" value={`${sessionsOn(sessions, today).length}`} />
      </div>

      {/* goals */}
      <div className="space-y-2.5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Goals
        </h2>
        <GoalCard title="Daily study goal" current={todayMin} target={settings.dailyGoalMin} />
        <GoalCard
          title="Weekly study goal"
          current={weekMin}
          target={settings.weeklyGoalMin}
          accent="cyan"
        />
        {Object.entries(settings.subjectGoals)
          .filter(([, target]) => target > 0)
          .map(([subject, target]) => {
            const current = weeklyBySubject.find((s) => s.subject === subject)?.minutes ?? 0;
            return (
              <GoalCard
                key={subject}
                title={`${subject} — this week`}
                current={current}
                target={target}
                accent="amber"
              />
            );
          })}
      </div>

      {/* charts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Charts
          </h2>
          <Segmented
            className="w-36"
            value={chart}
            onChange={setChart}
            options={[
              { value: 'bar', label: 'Bars' },
              { value: 'trend', label: 'Trend' },
            ]}
          />
        </div>
        <Segmented
          value={range}
          onChange={setRange}
          options={[
            { value: 'week', label: 'This week' },
            { value: 'month', label: '30 days' },
            { value: 'all', label: 'All time' },
          ]}
        />
        <div className="card p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
            Study hours per day
          </p>
          {chart === 'bar' ? <BarChart data={series} /> : <LineChart data={series} />}
        </div>
        <div className="card p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
            Subject distribution
          </p>
          <DonutChart data={subjectTotals} />
        </div>
      </div>

      {/* calendar */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Calendar & history
        </h2>
        <CalendarView />
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3.5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-xl font-extrabold tabular mt-0.5">{value}</p>
    </div>
  );
}
