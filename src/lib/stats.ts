/* Statistics: study minutes, subject totals, daily series, completion, streaks.
   All computed from actual recorded sessions — never from scheduled time. */

import type { Routine, Settings, StudySession, TaskInstance } from '../types';
import {
  addDays,
  dateStr,
  daysBetween,
  parseDateStr,
  startOfMonth,
  startOfWeek,
} from './time';
import { computeSchedule } from './schedule';

export function minutesOn(sessions: StudySession[], date: string): number {
  return sessions
    .filter((s) => s.date === date)
    .reduce((acc, s) => acc + (s.end - s.start) / 60000, 0);
}

export function minutesInRange(sessions: StudySession[], from: string, to: string): number {
  return sessions
    .filter((s) => s.date >= from && s.date <= to)
    .reduce((acc, s) => acc + (s.end - s.start) / 60000, 0);
}

export function totalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((acc, s) => acc + (s.end - s.start) / 60000, 0);
}

export function todayMinutes(sessions: StudySession[]): number {
  return minutesOn(sessions, dateStr());
}

export function weekMinutes(sessions: StudySession[]): number {
  const today = dateStr();
  return minutesInRange(sessions, startOfWeek(today), today);
}

export function monthMinutes(sessions: StudySession[]): number {
  const today = dateStr();
  return minutesInRange(sessions, startOfMonth(today), today);
}

export interface SubjectTotal {
  subject: string;
  minutes: number;
}

export function bySubject(sessions: StudySession[]): SubjectTotal[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    map.set(s.subject, (map.get(s.subject) ?? 0) + (s.end - s.start) / 60000);
  }
  return [...map.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes);
}

export interface DayPoint {
  date: string;
  minutes: number;
}

export function dailySeries(sessions: StudySession[], days: number, endDate = dateStr()): DayPoint[] {
  const out: DayPoint[] = [];
  const byDate = new Map<string, number>();
  for (const s of sessions) byDate.set(s.date, (byDate.get(s.date) ?? 0) + (s.end - s.start) / 60000);
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(endDate, -i);
    out.push({ date: d, minutes: byDate.get(d) ?? 0 });
  }
  return out;
}

export interface Completion {
  completed: number;
  total: number;
  pct: number;
}

export function completionFor(
  routines: Routine[],
  instances: TaskInstance[],
  date: string
): Completion {
  const items = computeSchedule(routines, instances, date, parseDateStr(date + 'T23:59:59'));
  const total = items.length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const missed = items.filter((i) => i.status === 'missed' || i.status === 'skipped').length;
  const denom = completed + missed > 0 ? completed + missed : total;
  return { completed, total, pct: denom === 0 ? 0 : Math.round((completed / denom) * 100) };
}

export function sessionsOn(sessions: StudySession[], date: string): StudySession[] {
  return sessions.filter((s) => s.date === date);
}

export type DayQualifier = (date: string) => boolean;

function makeQualifier(
  routines: Routine[],
  instances: TaskInstance[],
  sessions: StudySession[],
  settings: Settings
): DayQualifier {
  return (date: string) => {
    switch (settings.streakRuleType) {
      case 'dailyGoal':
        return minutesOn(sessions, date) >= settings.dailyGoalMin && sessionsOn(sessions, date).length > 0;
      case 'completionPct': {
        const c = completionFor(routines, instances, date);
        return c.total > 0 && c.pct >= settings.streakGoalPct;
      }
      case 'sessions':
        return sessionsOn(sessions, date).length >= settings.streakMinSessions;
    }
  };
}

export interface Streaks {
  current: number;
  longest: number;
}

export function computeStreaks(
  routines: Routine[],
  instances: TaskInstance[],
  sessions: StudySession[],
  settings: Settings
): Streaks {
  const qualifies = makeQualifier(routines, instances, sessions, settings);
  const today = dateStr();

  // earliest date with any activity
  let earliest = today;
  for (const s of sessions) if (s.date < earliest) earliest = s.date;
  for (const i of instances) if (i.date < earliest) earliest = i.date;

  // current streak: count back from today; today only breaks it if a previous day qualifies
  let current = 0;
  let d = today;
  if (!qualifies(today)) d = addDays(today, -1);
  while (qualifies(d) && daysBetween(earliest, d) >= 0) {
    current++;
    d = addDays(d, -1);
  }

  // longest streak across history
  let longest = 0;
  let run = 0;
  let iter = earliest;
  while (iter <= today) {
    if (qualifies(iter)) {
      run++;
      longest = Math.max(longest, run);
    } else if (iter !== today) {
      run = 0;
    }
    iter = addDays(iter, 1);
  }

  return { current, longest: Math.max(longest, current) };
}

/** Weekly minutes per subject for subject goals (current week). */
export function subjectWeekMinutes(sessions: StudySession[]): Map<string, number> {
  const from = startOfWeek(dateStr());
  const map = new Map<string, number>();
  for (const s of sessions) {
    if (s.date < from) continue;
    map.set(s.subject, (map.get(s.subject) ?? 0) + (s.end - s.start) / 60000);
  }
  return map;
}

/** Daily goal progress (0–1+) for today. */
export function dailyGoalProgress(sessions: StudySession[], settings: Settings): number {
  if (settings.dailyGoalMin <= 0) return 0;
  return todayMinutes(sessions) / settings.dailyGoalMin;
}
