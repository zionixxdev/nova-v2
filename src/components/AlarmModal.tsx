import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { fmtClock, fmtDuration } from '../lib/time';
import { announce } from '../lib/voice';

export default function AlarmModal({
  onGoStudy,
}: {
  onGoStudy: () => void;
}) {
  const { alarm, snoozeAlarm, clearAlarm, settings, now, startTimer, setTaskStatus } = useApp();
  const [customMin, setCustomMin] = useState('');
  if (!alarm) return null;

  const { item, snoozeUntil } = alarm;
  const r = item.routine;
  const snoozed = !!snoozeUntil && snoozeUntil > now;

  const start = () => {
    if (r.trackStudy) {
      startTimer(r.subject || r.name, r.name, item.key);
      onGoStudy();
    } else {
      void setTaskStatus(r.id, item.date, 'completed');
    }
    clearAlarm();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-gradient-to-b from-nova-900/80 via-slate-950/90 to-slate-950/95 backdrop-blur-sm animate-fade-in" />
      <div className="relative w-full max-w-sm text-center text-white animate-slide-up">
        {/* pulsing star */}
        <div className="relative mx-auto w-28 h-28 grid place-items-center mb-2">
          <span className="absolute inset-0 rounded-full bg-nova-500/40 animate-pulse-ring" />
          <span className="absolute inset-2 rounded-full bg-nova-500/25 animate-pulse-ring [animation-delay:0.5s]" />
          <span className="text-5xl drop-shadow-[0_0_20px_rgba(139,92,246,0.8)]">⏰</span>
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.3em] text-nova-300 mb-1">
          {snoozed ? 'Snoozed alarm' : 'Alarm'}
        </p>
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">{r.name}</h1>
        <p className="tabular text-lg text-slate-300 mb-1">{fmtClock(item.start, settings.clock24)}</p>
        <p className="text-sm text-slate-400 mb-6">
          {fmtDuration(r.durationMin)} · {r.subject || r.category}
        </p>
        {r.notes && <p className="text-xs text-slate-500 mb-6 italic">“{r.notes}”</p>}

        <div className="space-y-3">
          <button className="btn-primary w-full !min-h-[56px] !text-base" onClick={start}>
            ▶ START {r.trackStudy ? 'STUDY TIMER' : 'TASK'}
          </button>
          <div className="flex gap-2">
            <button className="btn-ghost flex-1" onClick={() => snoozeAlarm(settings.snoozeMin)}>
              😴 Snooze {settings.snoozeMin}m
            </button>
            <button
              className="btn-ghost flex-1"
              onClick={async () => {
                await setTaskStatus(r.id, item.date, 'skipped');
                clearAlarm();
              }}
            >
              Skip
            </button>
          </div>
          {snoozed && (
            <p className="text-xs text-slate-500">
              Rings again at {fmtClock(snoozeUntil!, settings.clock24)}
            </p>
          )}
          <div className="flex gap-2 items-center pt-1">
            <span className="text-[11px] text-slate-500">Custom snooze:</span>
            <input
              className="input !py-1.5 !px-2 w-16 text-center tabular !text-white bg-white/10 border-white/20"
              type="number"
              min={1}
              max={120}
              placeholder="min"
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
            />
            <button
              className="text-[11px] font-semibold text-nova-300"
              onClick={() => {
                const m = Number(customMin);
                if (m > 0) snoozeAlarm(Math.min(120, m));
              }}
            >
              Set
            </button>
            <button
              className="ml-auto text-[11px] text-slate-500 underline"
              onClick={() => {
                announce('taskStart', { task: r.name, subject: r.subject }, settings);
              }}
            >
              Repeat voice
            </button>
          </div>
          <button className="text-xs text-slate-500 underline" onClick={() => clearAlarm()}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
