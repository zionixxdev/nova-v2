/* Pure schedule computation: routines -> concrete task occurrences for a date. */

import type { Routine, ScheduleItem, TaskInstance } from '../types';
import { dateStr, parseHHMM, parseDateStr } from './time';

export const MISSED_GRACE_MIN = 15; // grace period after end before marking missed

export function routineOccursOn(r: Routine, date: string): boolean {
  if (r.paused) return false;
  const day = parseDateStr(date).getDay();
  return r.repeatDays.includes(day);
}

export function computeSchedule(
  routines: Routine[],
  instances: TaskInstance[],
  date: string,
  now: Date = new Date()
): ScheduleItem[] {
  const byId = new Map<string, TaskInstance>();
  for (const inst of instances) if (inst.date === date) byId.set(inst.routineId, inst);

  const items: ScheduleItem[] = [];
  for (const r of routines) {
    if (!routineOccursOn(r, date)) continue;
    const base = parseDateStr(date);
    const startM = parseHHMM(r.startTime);
    const start = new Date(base);
    start.setHours(Math.floor(startM / 60), startM % 60, 0, 0);
    const end = new Date(start.getTime() + r.durationMin * 60000);
    const inst = byId.get(r.id);
    let status = inst?.status ?? 'pending';
    if (status === 'pending' && now.getTime() > end.getTime() + MISSED_GRACE_MIN * 60000) {
      status = 'missed';
    }
    items.push({
      key: `${date}|${r.id}`,
      routine: r,
      date,
      start: start.getTime(),
      end: end.getTime(),
      status,
      isStudy: r.trackStudy,
    });
  }
  items.sort((a, b) => a.start - b.start);
  return items;
}

export function currentTask(items: ScheduleItem[], now = Date.now()): ScheduleItem | undefined {
  return items.find((i) => now >= i.start && now < i.end);
}

export function nextTask(items: ScheduleItem[], now = Date.now()): ScheduleItem | undefined {
  return items.find((i) => i.start > now);
}

export function todayStrNow(): string {
  return dateStr(new Date());
}
