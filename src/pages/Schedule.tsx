import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import DailyTimeline, { RoutineListRow } from '../components/DailyTimeline';
import RoutineForm, { emptyRoutine } from '../components/RoutineForm';
import { computeSchedule } from '../lib/schedule';
import { DAY_NAMES, addDays, relDayLabel } from '../lib/time';
import type { Routine, ScheduleItem } from '../types';
import { Segmented } from '../components/ui';

export default function Schedule({ onEditRoutine }: { onEditRoutine: (r: Routine) => void }) {
  const { routines, instances, settings, now, today, setTaskStatus } = useApp();
  const [view, setView] = useState<'day' | 'routines'>('day');
  const [offset, setOffset] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formInitial, setFormInitial] = useState<Routine | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

  const viewDate = useMemo(() => addDays(today, offset), [today, offset]);
  const dayItems: ScheduleItem[] = useMemo(
    () => computeSchedule(routines, instances, viewDate, new Date(now)),
    [routines, instances, viewDate, now]
  );

  const openCreate = () => {
    setFormInitial(emptyRoutine(settings.defaultReminderMin));
    setFormMode('create');
    setFormOpen(true);
  };
  const openEdit = (r: Routine) => {
    setFormInitial(r);
    setFormMode('edit');
    setFormOpen(true);
  };

  const toggle = (item: ScheduleItem) =>
    void setTaskStatus(
      item.routine.id,
      viewDate,
      item.status === 'completed' ? 'pending' : 'completed'
    );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold font-display tracking-tight">Schedule</h1>
        <button className="btn-primary !min-h-[40px] text-xs" onClick={openCreate}>
          + Add routine
        </button>
      </div>

      <Segmented
        value={view}
        onChange={setView}
        options={[
          { value: 'day', label: 'Day view' },
          { value: 'routines', label: 'All routines' },
        ]}
      />

      {view === 'day' && (
        <>
          <div className="flex items-center justify-between">
            <button
              className="btn-ghost !min-h-[36px] !px-4"
              onClick={() => setOffset((o) => o - 1)}
              aria-label="Previous day"
            >
              ‹
            </button>
            <button
              className="font-bold text-sm px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setOffset(0)}
            >
              {relDayLabel(viewDate, today)} · {DAY_NAMES[new Date(viewDate + 'T00:00').getDay()]}
            </button>
            <button
              className="btn-ghost !min-h-[36px] !px-4"
              onClick={() => setOffset((o) => o + 1)}
              aria-label="Next day"
            >
              ›
            </button>
          </div>
          <DailyTimeline items={dayItems} onEdit={(item) => openEdit(item.routine)} onToggle={toggle} />
        </>
      )}

      {view === 'routines' && (
        <div className="space-y-2.5">
          {routines.length === 0 && (
            <p className="card p-6 text-center text-sm text-slate-400">
              No routines yet. Create your first one — Nova will remind you, ring an alarm, and
              track your study time.
            </p>
          )}
          {routines.map((r) => (
            <RoutineListRow key={r.id} routine={r} onEdit={onEditRoutine} />
          ))}
        </div>
      )}

      {formInitial && (
        <RoutineForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          initial={formInitial}
          mode={formMode}
        />
      )}
    </div>
  );
}
