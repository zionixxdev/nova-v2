import { useEffect, useState } from 'react';
import type { Routine } from '../types';
import { useApp, uid } from '../store/AppContext';
import { Field, Modal, Segmented, Toggle } from './ui';
import { DAY_SHORT } from '../lib/time';

const CATEGORIES: Routine['category'][] = ['Study', 'School', 'Work', 'Health', 'Personal', 'Other'];
const REMINDER_OPTIONS = [0, 5, 10, 15, 30, 60];

export function emptyRoutine(defaultReminder: number): Routine {
  return {
    id: uid(),
    name: '',
    category: 'Study',
    subject: '',
    startTime: '16:00',
    durationMin: 60,
    repeatDays: [1, 2, 3, 4, 5],
    priority: 'normal',
    notes: '',
    reminderMin: defaultReminder,
    voice: true,
    alarm: true,
    trackStudy: true,
    paused: false,
    createdAt: Date.now(),
  };
}

export default function RoutineForm({
  open,
  onClose,
  initial,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  initial: Routine;
  mode: 'create' | 'edit' | 'duplicate';
}) {
  const { saveRoutine, deleteRoutine, subjects, setTaskStatus, today } = useApp();
  const [r, setR] = useState<Routine>(initial);
  const [newSubject, setNewSubject] = useState(false);

  useEffect(() => {
    setR(initial);
    setNewSubject(false);
  }, [initial, open]);

  const patch = (p: Partial<Routine>) => setR((prev) => ({ ...prev, ...p }));
  const valid = r.name.trim().length > 0 && r.durationMin > 0 && r.repeatDays.length > 0;

  const submit = async () => {
    if (!valid) return;
    await saveRoutine({
      ...r,
      name: r.name.trim(),
      subject: r.trackStudy ? (r.subject || '').trim() || r.name.trim() : (r.subject || '').trim(),
      notes: r.notes?.trim() || undefined,
    });
    onClose();
  };

  const canPickSubject = !newSubject && subjects.length > 0;

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit' ? 'Edit routine' : 'New routine'}>
      <div className="space-y-4">
        <Field label="Task name">
          <input
            className="input"
            autoFocus
            placeholder="e.g. Physics"
            value={r.name}
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Start time">
            <input
              type="time"
              className="input tabular"
              value={r.startTime}
              onChange={(e) => patch({ startTime: e.target.value })}
            />
          </Field>
          <Field label="Duration (minutes)">
            <input
              type="number"
              min={5}
              step={5}
              className="input tabular"
              value={r.durationMin}
              onChange={(e) => patch({ durationMin: Math.max(5, Number(e.target.value) || 0) })}
            />
          </Field>
        </div>

        <Field label="Category">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patch({ category: c })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  r.category === c
                    ? 'bg-nova-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Repeat on">
          <div className="flex gap-1">
            {DAY_SHORT.map((d, i) => {
              const on = r.repeatDays.includes(i);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() =>
                    patch({
                      repeatDays: on
                        ? r.repeatDays.filter((x) => x !== i)
                        : [...r.repeatDays, i].sort(),
                    })
                  }
                  className={`flex-1 h-10 rounded-xl text-xs font-bold transition ${
                    on
                      ? 'bg-nova-600 text-white shadow-glow'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </Field>

        {r.category === 'Study' && (
          <Field label="Subject (for study tracking)">
            {canPickSubject ? (
              <div className="flex gap-2">
                <select
                  className="input flex-1"
                  value={r.subject && subjects.includes(r.subject) ? r.subject : ''}
                  onChange={(e) => patch({ subject: e.target.value })}
                >
                  <option value="">— pick a subject —</option>
                  {subjects.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  onClick={() => {
                    setNewSubject(true);
                    patch({ subject: '' });
                  }}
                >
                  New
                </button>
              </div>
            ) : (
              <input
                className="input"
                placeholder="e.g. Mathematics"
                value={r.subject}
                onChange={(e) => patch({ subject: e.target.value })}
              />
            )}
          </Field>
        )}

        <Field label="Priority">
          <Segmented
            value={r.priority}
            onChange={(v) => patch({ priority: v })}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' },
            ]}
          />
        </Field>

        <Field label="Reminder">
          <div className="flex gap-1.5 flex-wrap">
            {REMINDER_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => patch({ reminderMin: m })}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                  r.reminderMin === m
                    ? 'bg-nova-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {m === 0 ? 'None' : `${m} min before`}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Notes (optional)">
          <textarea
            className="input min-h-[64px]"
            placeholder="Chapter 4 — circular motion…"
            value={r.notes ?? ''}
            onChange={(e) => patch({ notes: e.target.value })}
          />
        </Field>

        <div className="card !p-3 divide-y divide-slate-100 dark:divide-slate-800">
          <Toggle
            checked={r.trackStudy}
            onChange={(v) => patch({ trackStudy: v })}
            label="Track as study session"
            hint="Count actual minutes in study stats"
          />
          <Toggle
            checked={r.voice}
            onChange={(v) => patch({ voice: v })}
            label="Voice announcement"
            hint="Device TTS speaks reminders"
          />
          <Toggle
            checked={r.alarm}
            onChange={(v) => patch({ alarm: v })}
            label="Alarm"
            hint="Sound + vibration alarm screen"
          />
        </div>

        <div className="flex gap-2 pt-1">
          {mode === 'edit' && (
            <button
              className="btn-danger flex-1"
              onClick={async () => {
                await deleteRoutine(r.id);
                onClose();
              }}
            >
              Delete
            </button>
          )}
          <button className="btn-primary flex-[2]" disabled={!valid} onClick={submit}>
            {mode === 'edit' ? 'Save changes' : 'Create routine'}
          </button>
        </div>

        {mode === 'edit' && (
          <div className="flex gap-2">
            <button
              className="btn-ghost flex-1 text-xs"
              onClick={async () => {
                await saveRoutine({
                  ...r,
                  id: uid(),
                  name: `${r.name} (copy)`,
                  createdAt: Date.now(),
                });
                onClose();
              }}
            >
              ⧉ Duplicate
            </button>
            <button
              className="btn-ghost flex-1 text-xs"
              onClick={async () => {
                await saveRoutine({ ...r, paused: !r.paused });
                onClose();
              }}
            >
              {r.paused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button
              className="btn-ghost flex-1 text-xs"
              onClick={async () => {
                await setTaskStatus(r.id, today, 'skipped');
                onClose();
              }}
              title="Skip today only"
            >
              Skip today
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
