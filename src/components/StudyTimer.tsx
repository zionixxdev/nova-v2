import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import { fmtStopwatch } from '../lib/time';
import ProgressRing from './ProgressRing';

/** The live study timer — records actual elapsed time, never scheduled time. */
export default function StudyTimer() {
  const { timer, pauseTimer, resumeTimer, finishTimer, cancelTimer, settings } = useApp();
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!timer) return;
    const tick = () => {
      const total =
        timer.accumulatedMs +
        (timer.runningSince !== null ? Date.now() - timer.runningSince : 0);
      setDisplay(total);
    };
    tick();
    raf.current = window.setInterval(tick, 500);
    return () => {
      if (raf.current) window.clearInterval(raf.current);
    };
  }, [timer]);

  if (!timer)
    return (
      <div className="card p-8 text-center">
        <div className="text-4xl mb-2 opacity-40">⏱</div>
        <p className="text-sm text-slate-400">
          Pick a subject below and press Start. Only actual time on the clock is recorded.
        </p>
      </div>
    );

  const running = timer.runningSince !== null;
  const goalFrac = settings.dailyGoalMin > 0 ? display / 60000 / settings.dailyGoalMin : 0;

  return (
    <div
      className={`card p-6 flex flex-col items-center gap-5 ${
        running ? 'ring-2 ring-nova-500/50 shadow-glow' : 'opacity-90'
      }`}
    >
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-nova-500">
          {running ? 'Studying' : 'Paused'}
        </p>
        <h2 className="text-xl font-extrabold mt-0.5">{timer.subject}</h2>
        {timer.task && timer.task !== timer.subject && (
          <p className="text-xs text-slate-400">{timer.task}</p>
        )}
      </div>

      <ProgressRing
        progress={goalFrac}
        size={190}
        stroke={12}
        label={fmtStopwatch(display)}
        sublabel={goalFrac < 1 ? `daily goal ${Math.round(goalFrac * 100)}%` : 'goal reached ✓'}
      />

      <div className="flex gap-2 w-full">
        {running ? (
          <button className="btn-soft flex-1" onClick={pauseTimer}>
            ⏸ Pause
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={resumeTimer}>
            ▶ Resume
          </button>
        )}
        <button className="btn-primary flex-1" onClick={() => void finishTimer()}>
          ✓ Finish
        </button>
        <button className="btn-ghost !px-4" onClick={cancelTimer} aria-label="Cancel">
          ✕
        </button>
      </div>
      <p className="text-[11px] text-slate-400 -mt-2">
        Nova records the real clock time — pauses are not counted.
      </p>
    </div>
  );
}
