import { useEffect, useRef, useState } from 'react';
import { useApp, uid } from '../store/AppContext';
import { announce } from '../lib/voice';
import { playChime, vibrate } from '../lib/notify';
import { Segmented } from './ui';
import { dateStr } from '../lib/time';

type Phase = 'idle' | 'work' | 'break' | 'pausedWork' | 'pausedBreak';

const PRESETS = [
  { label: '25 / 5', work: 25, brk: 5 },
  { label: '50 / 10', work: 50, brk: 10 },
];

/** Optional Pomodoro / focus timer with device-TTS announcements. */
export default function PomodoroTimer({ subject }: { subject: string }) {
  const { settings, patchSettings, saveSession } = useApp();
  const [phase, setPhase] = useState<Phase>('idle');
  const [remaining, setRemaining] = useState(settings.focusWorkMin * 60);
  const [preset, setPreset] = useState(0);
  const startTs = useRef<number>(0);
  const beepedRef = useRef(false);

  const work = preset === 2 ? settings.focusWorkMin : PRESETS[preset]?.work ?? 25;
  const brk = preset === 2 ? settings.focusBreakMin : PRESETS[preset]?.brk ?? 5;

  useEffect(() => {
    if (phase !== 'work' && phase !== 'break') return;
    const id = window.setInterval(() => {
      setRemaining((r) => (r > 1 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (remaining > 0 || (phase !== 'work' && phase !== 'break') || beepedRef.current) return;
    beepedRef.current = true;
    const s = settings;
    if (phase === 'work') {
      const end = Date.now();
      void saveSession({
        id: uid(),
        subject: subject || 'Focus',
        task: 'Focus session',
        start: startTs.current,
        end,
        date: dateStr(new Date(startTs.current)),
        source: 'focus',
      });
      if (s.voiceEnabled) announce('focusEnd', {}, s);
      playChime(s.alarmVolume);
      if (s.vibration) vibrate([200, 100, 200]);
      setPhase('idle');
      setRemaining(work * 60);
    } else {
      if (s.voiceEnabled) announce('focusStart', { subject: subject || 'study' }, s);
      playChime(s.alarmVolume);
      startTs.current = Date.now();
      setPhase('work');
      setRemaining(work * 60);
    }
    window.setTimeout(() => (beepedRef.current = false), 1500);
  }, [remaining, phase, work, saveSession, settings, subject]);

  if (!settings.focusEnabled) return null;

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const frac = phase === 'break' ? 1 - remaining / (brk * 60) : 1 - remaining / (work * 60);

  const begin = () => {
    const s = settings;
    startTs.current = Date.now();
    beepedRef.current = false;
    setPhase('work');
    setRemaining(work * 60);
    if (s.voiceEnabled) announce('focusStart', { minutes: work, subject: subject || 'study' }, s);
  };

  return (
    <div className="card p-5 flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full">
        <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Focus mode</p>
        <span className="chip bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
          🍅 Pomodoro
        </span>
      </div>

      {phase === 'idle' ? (
        <>
          <Segmented
            className="w-full"
            value={String(preset)}
            onChange={(v) => setPreset(Number(v))}
            options={[
              ...PRESETS.map((p, i) => ({ value: String(i), label: p.label })),
              { value: '2', label: 'Custom' },
            ]}
          />
          {preset === 2 && (
            <div className="grid grid-cols-2 gap-3 w-full">
              <label className="text-xs text-slate-400">
                Work (min)
                <input
                  type="number"
                  min={5}
                  className="input tabular mt-1"
                  value={settings.focusWorkMin}
                  onChange={(e) =>
                    patchSettings({ focusWorkMin: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </label>
              <label className="text-xs text-slate-400">
                Break (min)
                <input
                  type="number"
                  min={1}
                  className="input tabular mt-1"
                  value={settings.focusBreakMin}
                  onChange={(e) =>
                    patchSettings({ focusBreakMin: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </label>
            </div>
          )}
          <button className="btn-primary w-full" onClick={begin}>
            ▶ Start focus — {work} min
          </button>
        </>
      ) : (
        <>
          <div className="relative w-full max-w-[220px] aspect-square grid place-items-center">
            <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                className="stroke-slate-200 dark:stroke-slate-800"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                stroke={phase === 'break' ? '#10b981' : '#8b5cf6'}
                strokeDasharray={2 * Math.PI * 54}
                strokeDashoffset={2 * Math.PI * 54 * (1 - Math.max(0, Math.min(1, frac)))}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {phase === 'break' ? 'Break' : phase === 'pausedBreak' ? 'Break paused' : phase === 'pausedWork' ? 'Paused' : 'Focus'}
              </p>
              <p className="text-4xl font-extrabold tabular">
                {mm}:{ss}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full">
            {(phase === 'work' || phase === 'break') && (
              <button
                className="btn-soft flex-1"
                onClick={() => setPhase(phase === 'work' ? 'pausedWork' : 'pausedBreak')}
              >
                ⏸ Pause
              </button>
            )}
            {(phase === 'pausedWork' || phase === 'pausedBreak') && (
              <button
                className="btn-primary flex-1"
                onClick={() => setPhase(phase === 'pausedWork' ? 'work' : 'break')}
              >
                ▶ Resume
              </button>
            )}
            <button
              className="btn-ghost flex-1"
              onClick={() => {
                setPhase('idle');
                setRemaining(work * 60);
              }}
            >
              Stop
            </button>
          </div>
        </>
      )}
    </div>
  );
}
