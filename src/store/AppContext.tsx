import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  DEFAULT_SETTINGS,
  type Routine,
  type ScheduleItem,
  type Settings,
  type StudySession,
  type TaskInstance,
  type TaskStatus,
} from '../types';
import { repos, kvGet, kvSet } from '../lib/db';
import { computeSchedule, currentTask } from '../lib/schedule';
import { announce } from '../lib/voice';
import { fireAlarm, notify, playChime, vibrate } from '../lib/notify';
import { dateStr, fmtClock, fmtDuration } from '../lib/time';

/* ------------------------------------------------------------------ */

export interface TimerState {
  subject: string;
  task?: string;
  taskKey?: string; // ScheduleItem.key to auto-complete
  startedAt: number;
  accumulatedMs: number;
  runningSince: number | null;
}

interface AlarmState {
  item: ScheduleItem;
  snoozeUntil?: number;
}

interface AppCtx {
  ready: boolean;
  settings: Settings;
  patchSettings: (patch: Partial<Settings>) => void;
  routines: Routine[];
  saveRoutine: (r: Routine) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
  instances: TaskInstance[];
  setTaskStatus: (routineId: string, date: string, status: TaskStatus) => Promise<void>;
  sessions: StudySession[];
  saveSession: (s: StudySession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  now: number;
  today: string;
  scheduleToday: ScheduleItem[];
  current: ScheduleItem | undefined;
  next: ScheduleItem | undefined;
  alarm: AlarmState | null;
  snoozeAlarm: (minutes: number) => void;
  clearAlarm: () => void;
  timer: TimerState | null;
  startTimer: (subject: string, task?: string, taskKey?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  finishTimer: () => Promise<void>;
  cancelTimer: () => void;
  subjects: string[];
  reloadAll: () => Promise<void>;
}

const Ctx = createContext<AppCtx | null>(null);

export function useApp(): AppCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

const uid = () =>
  (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)) as string;

/* ------------------------------------------------------------------ */

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [instances, setInstances] = useState<TaskInstance[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [today, setToday] = useState(() => dateStr());
  const [alarm, setAlarm] = useState<AlarmState | null>(null);
  const [timer, setTimer] = useState<TimerState | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const patchSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      void kvSet('settings', next);
      return next;
    });
  }, []);

  const reloadAll = useCallback(async () => {
    const [s, r, i, sess] = await Promise.all([
      kvGet<Partial<Settings>>('settings'),
      repos.loadRoutines<Routine>(),
      repos.loadTaskInstances<TaskInstance>(),
      repos.loadSessions<StudySession>(),
    ]);
    if (s) setSettings((prev) => ({ ...DEFAULT_SETTINGS, ...prev, ...s }));
    setRoutines(r.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    setInstances(i);
    setSessions(sess.sort((a, b) => b.start - a.start));
  }, []);

  useEffect(() => {
    void reloadAll().finally(() => setReady(true));
  }, [reloadAll]);

  /* ---- theme ---- */
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark =
        settings.theme === 'dark' || (settings.theme === 'system' && mq.matches);
      root.classList.toggle('dark', dark);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#0f1117' : '#7c3aed');
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [settings.theme]);

  /* ---- clock ---- */
  useEffect(() => {
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      const d = dateStr(new Date(t));
      setToday((prev) => (prev === d ? prev : d));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  /* ---- data mutators ---- */
  const saveRoutine = useCallback(async (r: Routine) => {
    await repos.saveRoutine(r);
    setRoutines((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id);
      const next = idx >= 0 ? prev.map((x) => (x.id === r.id ? r : x)) : [...prev, r];
      return next.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
  }, []);

  const deleteRoutine = useCallback(async (id: string) => {
    await repos.deleteRoutine(id);
    await repos.deleteTaskInstancesFor(id);
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    setInstances((prev) => prev.filter((i) => i.routineId !== id));
  }, []);

  const setTaskStatus = useCallback(
    async (routineId: string, date: string, status: TaskStatus) => {
      const inst: TaskInstance = {
        id: `${date}|${routineId}`,
        routineId,
        date,
        status,
        completedAt: status === 'completed' ? Date.now() : undefined,
      };
      await repos.saveTaskInstance(inst);
      setInstances((prev) => {
        const idx = prev.findIndex((i) => i.id === inst.id);
        return idx >= 0 ? prev.map((i) => (i.id === inst.id ? inst : i)) : [...prev, inst];
      });
    },
    []
  );

  const saveSession = useCallback(async (s: StudySession) => {
    await repos.saveSession(s);
    setSessions((prev) => [s, ...prev.filter((x) => x.id !== s.id)].sort((a, b) => b.start - a.start));
  }, []);

  const deleteSession = useCallback(async (id: string) => {
    await repos.deleteSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  /* ---- schedule ---- */
  const nowMinute = Math.floor(now / 30000);
  const scheduleToday = useMemo(
    () => computeSchedule(routines, instances, today, new Date(now)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [routines, instances, today, nowMinute]
  );
  const current = useMemo(() => currentTask(scheduleToday, now), [scheduleToday, now]);
  const next = useMemo(
    () => scheduleToday.find((i) => i.start > now && i.status === 'pending'),
    [scheduleToday, now]
  );

  /* ---- reminder & alarm engine (in-app) ----
     Honest about limits: while Nova is open (or running in background on
     supporting devices) this engine fires reminders, alarms, voice and
     vibration. When the browser suspends a closed PWA, only already-delivered
     system notifications persist. A native Android build can later reuse this
     exact scheduling model with guaranteed background alarms. */
  const firedRef = useRef<Set<string>>(new Set());
  const alarmRef = useRef<AlarmState | null>(null);
  alarmRef.current = alarm;

  const fireEvent = useCallback((item: ScheduleItem, kind: 'rem' | 'start') => {
    const s = settingsRef.current;
    const r = item.routine;
    const taskName = r.name;
    if (kind === 'rem') {
      const mins = r.reminderMin;
      if (r.voice) announce('preReminder', { task: taskName, subject: r.subject, minutes: mins }, s);
      notify(
        { title: `${taskName} — in ${mins} minutes`, body: `Starts at ${fmtClock(item.start, s.clock24)}`, tag: item.key + 'rem' },
        s
      );
      if (s.vibration) vibrate(150);
    } else {
      if (r.alarm && s.alarmEnabled) {
        if (r.voice) announce('taskStart', { task: taskName, subject: r.subject }, s);
        fireAlarm(taskName.toUpperCase(), fmtClock(item.start, s.clock24), s, item.key);
        setAlarm({ item });
      } else {
        if (r.voice) announce('taskStart', { task: taskName, subject: r.subject }, s);
        notify(
          { title: taskName, body: `Started at ${fmtClock(item.start, s.clock24)}`, tag: item.key },
          s
        );
      }
    }
  }, []);

  useEffect(() => {
    for (const item of scheduleToday) {
      if (item.status !== 'pending') continue;
      const r = item.routine;
      // reminder
      if (r.reminderMin > 0) {
        const remAt = item.start - r.reminderMin * 60000;
        const key = `${item.key}|rem`;
        if (now >= remAt && now < item.start && !firedRef.current.has(key)) {
          firedRef.current.add(key);
          fireEvent(item, 'rem');
        }
      }
      // alarm / start announcement
      const startKey = `${item.key}|start`;
      if (now >= item.start && now < item.start + 120000 && !firedRef.current.has(startKey)) {
        firedRef.current.add(startKey);
        fireEvent(item, 'start');
      }
    }
  }, [scheduleToday, now, fireEvent]);

  const snoozeAlarm = useCallback(
    (minutes: number) => {
      const a = alarmRef.current;
      if (!a) return;
      const until = Date.now() + minutes * 60000;
      setAlarm({ item: a.item, snoozeUntil: until });
      window.setTimeout(() => {
        const s = settingsRef.current;
        const item = alarmRef.current?.item;
        if (!item) return;
        if (item.routine.voice)
          announce('taskStart', { task: item.routine.name, subject: item.routine.subject }, s);
        fireAlarm(item.routine.name.toUpperCase(), fmtClock(item.start, s.clock24), s, item.key);
        // re-arm: clear snoozed state so the modal is dismissable again
        setAlarm((cur) => (cur && cur.item.key === item.key ? { item } : cur));
      }, minutes * 60000);
    },
    []
  );

  const clearAlarm = useCallback(() => {
    setAlarm((a) => {
      if (a?.snoozeUntil) return a; // snoozed alarms stay armed
      return null;
    });
  }, []);

  const startTimer = useCallback((subject: string, task?: string, taskKey?: string) => {
    setTimer({
      subject,
      task,
      taskKey,
      startedAt: Date.now(),
      accumulatedMs: 0,
      runningSince: Date.now(),
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimer((t) => {
      if (!t || t.runningSince === null) return t;
      return { ...t, accumulatedMs: t.accumulatedMs + (Date.now() - t.runningSince), runningSince: null };
    });
  }, []);

  const resumeTimer = useCallback(() => {
    setTimer((t) => (t && t.runningSince === null ? { ...t, runningSince: Date.now() } : t));
  }, []);

  const finishTimer = useCallback(async () => {
    const t = timer;
    if (!t) return;
    const totalMs =
      t.accumulatedMs + (t.runningSince !== null ? Date.now() - t.runningSince : 0);
    setTimer(null);
    if (totalMs < 30000) return; // ignore accidental taps
    const start = Date.now() - totalMs;
    const session: StudySession = {
      id: uid(),
      subject: t.subject,
      task: t.task,
      start,
      end: Date.now(),
      date: dateStr(new Date(start)),
      source: 'timer',
    };
    await saveSession(session);
    // auto-complete linked task
    if (t.taskKey) {
      const [, routineId] = t.taskKey.split('|');
      await setTaskStatus(routineId, session.date, 'completed');
    }
    const s = settingsRef.current;
    if (s.voiceEnabled) {
      announce(
        'sessionComplete',
        {
          task: t.task ?? t.subject,
          subject: t.subject,
          duration: fmtDuration(totalMs / 60000),
        },
        s
      );
    }
    playChime(s.alarmVolume);
    if (s.vibration) vibrate();
  }, [timer, saveSession, setTaskStatus]);

  const cancelTimer = useCallback(() => setTimer(null), []);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    routines.forEach((r) => r.subject && set.add(r.subject));
    sessions.forEach((s) => set.add(s.subject));
    return [...set].sort();
  }, [routines, sessions]);

  const value: AppCtx = {
    ready,
    settings,
    patchSettings,
    routines,
    saveRoutine,
    deleteRoutine,
    instances,
    setTaskStatus,
    sessions,
    saveSession,
    deleteSession,
    now,
    today,
    scheduleToday,
    current,
    next,
    alarm,
    snoozeAlarm,
    clearAlarm,
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    finishTimer,
    cancelTimer,
    subjects,
    reloadAll,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { uid };
