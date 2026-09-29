import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import StudyTimer from '../components/StudyTimer';
import PomodoroTimer from '../components/PomodoroTimer';
import { Segmented } from '../components/ui';
import { dateStr, fmtClock, fmtDuration, fmtDateLong } from '../lib/time';
import type { StudySession } from '../types';

export default function StudyPage() {
  const { subjects, sessions, settings, saveSession, deleteSession, timer } = useApp();
  const [mode, setMode] = useState<'timer' | 'focus'>('timer');
  const [subject, setSubject] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [editSession, setEditSession] = useState<StudySession | null>(null);

  const effectiveSubject = customSubject.trim() || subject || subjects[0] || 'Study';
  const recent = useMemo(
    () => [...sessions].sort((a, b) => b.start - a.start).slice(0, 30),
    [sessions]
  );

  const startFreeSession = () => {
    if (timer) return;
    // handled by startTimer in context
  };
  void startFreeSession;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold font-display tracking-tight">Study</h1>

      {settings.focusEnabled && !timer && (
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'timer', label: '⏱ Study timer' },
            { value: 'focus', label: '🍅 Focus / Pomodoro' },
          ]}
        />
      )}

      {mode === 'timer' || timer ? (
        <>
          {!timer && (
            <div className="card p-4">
              <p className="label">Subject</p>
              <div className="flex gap-2 mb-3">
                {subjects.length > 0 && (
                  <select
                    className="input flex-1"
                    value={subjects.includes(subject) ? subject : ''}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setCustomSubject('');
                    }}
                  >
                    <option value="">— pick —</option>
                    {subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                )}
                <input
                  className="input flex-1"
                  placeholder={subjects.length ? 'or type a new subject' : 'Subject, e.g. Physics'}
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                />
              </div>
              <StartStudyButton subject={effectiveSubject} />
            </div>
          )}
          <StudyTimer />
        </>
      ) : (
        <PomodoroTimer subject={effectiveSubject} />
      )}

      {/* session history */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
          Session history
        </h2>
        {recent.length === 0 ? (
          <p className="card p-6 text-center text-sm text-slate-400">
            No sessions recorded yet. Start the timer — every real minute counts.
          </p>
        ) : (
          <div className="space-y-2">
            {recent.map((s, i, arr) => {
              const showDate = i === 0 || arr[i - 1].date !== s.date;
              return (
                <div key={s.id}>
                  {showDate && (
                    <p className="text-xs font-bold text-slate-400 mt-3 mb-1.5 first:mt-0">
                      {fmtDateLong(s.date)}
                    </p>
                  )}
                  <button
                    className="card p-3.5 w-full text-left flex items-center gap-3"
                    onClick={() => setEditSession(s)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-nova-500/20 grid place-items-center">
                      {s.source === 'focus' ? '🍅' : '⏱'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.subject}</p>
                      <p className="text-xs text-slate-400 tabular">
                        {fmtClock(s.start, settings.clock24)} → {fmtClock(s.end, settings.clock24)}
                        {s.task && s.task !== s.subject ? ` · ${s.task}` : ''}
                      </p>
                    </div>
                    <span className="font-extrabold tabular text-sm text-nova-600 dark:text-nova-400">
                      {fmtDuration((s.end - s.start) / 60000)}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* edit session modal */}
      {editSession && (
        <EditSessionModal
          session={editSession}
          onClose={() => setEditSession(null)}
          onSave={async (start, end) => {
            await saveSession({ ...editSession, start, end, date: dateStr(new Date(start)) });
            setEditSession(null);
          }}
          onDelete={async () => {
            await deleteSession(editSession.id);
            setEditSession(null);
          }}
        />
      )}
    </div>
  );
}

function StartStudyButton({ subject }: { subject: string }) {
  const { startTimer, timer } = useApp();
  return (
    <button
      className="btn-primary w-full"
      disabled={!!timer || !subject.trim()}
      onClick={() => startTimer(subject.trim())}
    >
      ▶ START
    </button>
  );
}

function EditSessionModal({
  session,
  onClose,
  onSave,
  onDelete,
}: {
  session: StudySession;
  onClose: () => void;
  onSave: (start: number, end: number) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [start, setStart] = useState(toLocalInput(session.start));
  const [end, setEnd] = useState(toLocalInput(session.end));
  const valid = new Date(end).getTime() > new Date(start).getTime();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md rounded-t-3xl bg-white dark:bg-[#181b24] p-5 animate-slide-up space-y-4">
        <h3 className="font-bold text-lg">
          Correct session — {session.subject}
        </h3>
        <div>
          <span className="label">Started</span>
          <input
            type="datetime-local"
            className="input tabular"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>
        <div>
          <span className="label">Ended</span>
          <input
            type="datetime-local"
            className="input tabular"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-400 tabular">
          Duration: {fmtDuration((new Date(end).getTime() - new Date(start).getTime()) / 60000)}
        </p>
        <div className="flex gap-2">
          <button className="btn-danger flex-1" onClick={() => void onDelete()}>
            Delete
          </button>
          <button
            className="btn-primary flex-[2]"
            disabled={!valid}
            onClick={() => void onSave(new Date(start).getTime(), new Date(end).getTime())}
          >
            Save correction
          </button>
        </div>
        <button className="btn-ghost w-full" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function toLocalInput(ts: number): string {
  const d = new Date(ts - new Date(ts).getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}
