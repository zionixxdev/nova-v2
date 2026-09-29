# 🌟 Nova — Your Daily Routine & Study Companion

A polished, mobile-first **Progressive Web App** for planning your daily routine, getting
alarm-style voice reminders, tracking *actual* study time, and watching your progress grow.

**No AI. No backend. No accounts.** Voice uses your device's built-in text-to-speech
(Web Speech API), data lives in IndexedDB on your device.

---

## Quick start

```bash
npm install
npm run dev        # development server
npm run build      # typecheck + production build (outputs to dist/)
npm run preview    # serve the production build locally
```

Requires Node 18+.

## Deploying the PWA

`npm run build` produces a fully self-contained `dist/` folder — host it on any static
host (Netlify, Vercel, GitHub Pages, Firebase Hosting, nginx…). The service worker
(`sw.js`) and manifest are generated automatically by `vite-plugin-pwa`.

For the full PWA experience (install prompt, notifications, offline cache) the app must
be served over **HTTPS** (or localhost).

## Features

- **Onboarding** — name, language, voice, 12/24-hour clock, theme (light / dark / system).
- **Dashboard** — greeting, today's progress ring, study time, task completion, streak,
  current & next task, quick actions, end-of-day summary.
- **Routines** — task name, time or duration, category, subject, repeat days, priority,
  notes, reminder timing, voice/alarm/study-tracking toggles. Create, edit, duplicate,
  pause, resume, skip-today, mark complete.
- **Alarms** — reminder before start ("Aditya, Physics starts in 10 minutes"), full alarm
  at start with sound + vibration + TTS, START / SNOOZE / SKIP alarm screen, snooze
  5/10/15/custom minutes.
- **Voice** — device TTS with multiple randomized templates (`{name}`, `{task}`,
  `{subject}`, `{time}`, `{minutes}`, `{duration}`), name usage toggle, voice/rate/volume
  selection, Test Voice.
- **Study timer** — start/pause/resume/finish/cancel. Records **actual elapsed time**
  (pauses excluded) — never the scheduled duration.
- **Pomodoro / focus mode** — 25/5, 50/10 or custom, with voice start/end announcements.
- **Stats** — today / week / month / total study hours, subject-wise totals, session
  history (editable), daily/weekly/subject goals with progress bars, streaks with
  configurable rules.
- **Progress page** — charts (daily bars, trend line, subject donut), calendar with
  per-day study heat + completion dots.
- **PWA** — installable, standalone display, offline precache, responsive, light & dark
  mode.

## Architecture

```
src/
  types.ts              Domain types + defaults
  lib/
    db.ts               IndexedDB wrapper (routines, tasks, sessions, kv)
    schedule.ts         Pure routine → task-occurrence computation
    stats.ts            Minutes, streaks, completion, series
    voice.ts            TTS engine + randomized templates (no AI)
    notify.ts           Notifications, alarm chime (WebAudio), vibration
    install.ts          PWA install prompt
    time.ts             Formatting / date helpers
  store/AppContext.tsx  Single app store: settings, routines, sessions,
                        task instances, ticking scheduler, alarm & timer state
  components/          TaskCard, DailyTimeline, RoutineForm, AlarmModal,
                        StudyTimer, PomodoroTimer, Charts, CalendarView,
                        GoalCard, ProgressRing, VoiceSettings, …
  pages/               Onboarding, Home, Schedule, Study, Progress, Settings
```

**Data layer note:** all reads/writes go through `lib/db.ts` — swapping IndexedDB for a
cloud-synced backend later means reimplementing only that module.

## Honest limitation (background alarms)

Browsers cannot guarantee alarms, sounds or speech when a PWA is fully closed and the OS
suspends it. Nova's reminder/alarm engine runs while the app is open or in the background
on supporting devices, and delivers system notifications when possible. The scheduling
logic (routines → occurrences → reminders/alarms) is pure and portable, ready for a future
native Android implementation with guaranteed background alarms.
