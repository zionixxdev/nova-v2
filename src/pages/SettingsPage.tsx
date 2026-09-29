import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import VoiceSettings from '../components/VoiceSettings';
import NotificationSettings from '../components/NotificationSettings';
import { Segmented, Toggle } from '../components/ui';
import { fmtDuration } from '../lib/time';
import { canInstall, onInstallAvailabilityChange, promptInstall } from '../lib/install';

function InstallButton() {
  const [available, setAvailable] = useState(canInstall());
  useEffect(() => onInstallAvailabilityChange(() => setAvailable(canInstall())), []);
  if (!available) return null;
  return (
    <button className="btn-primary w-full mb-3" onClick={() => void promptInstall()}>
      📲 Install Nova on this device
    </button>
  );
}

export default function SettingsPage() {
  const { settings, patchSettings, subjects } = useApp();
  const [subjectGoalDraft, setSubjectGoalDraft] = useState('');
  const [subjectGoalTarget, setSubjectGoalTarget] = useState('');

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-2xl font-extrabold font-display tracking-tight">Settings</h1>

      {/* Personalization */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-nova-600 dark:text-nova-400">
          👤 Personalization
        </h2>
        <div>
          <span className="label">Name</span>
          <input
            className="input"
            value={settings.name}
            onChange={(e) => patchSettings({ name: e.target.value })}
            placeholder="Your name"
          />
        </div>
        <Toggle
          checked={settings.useName}
          onChange={(v) => patchSettings({ useName: v })}
          label="Use my name in voice notifications"
          hint="Nova says “Aditya, it’s time for Physics.” — naturally, never excessively"
        />
        <div>
          <span className="label">Time format</span>
          <Segmented
            value={settings.clock24 ? '24' : '12'}
            onChange={(v) => patchSettings({ clock24: v === '24' })}
            options={[
              { value: '12', label: '12-hour' },
              { value: '24', label: '24-hour' },
            ]}
          />
        </div>
      </section>

      {/* Appearance */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-nova-600 dark:text-nova-400">
          🎨 Appearance
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { v: 'light', icon: '☀', label: 'Light' },
              { v: 'dark', icon: '🌙', label: 'Dark' },
              { v: 'system', icon: '🖥', label: 'System' },
            ] as const
          ).map((t) => (
            <button
              key={t.v}
              onClick={() => patchSettings({ theme: t.v })}
              className={`rounded-2xl border p-3 flex flex-col items-center gap-1.5 transition-all ${
                settings.theme === t.v
                  ? 'border-nova-500 ring-2 ring-nova-500/40 shadow-glow'
                  : 'border-slate-200 dark:border-slate-700 opacity-70'
              }`}
            >
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Voice */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-nova-600 dark:text-nova-400">
          🔊 Voice
        </h2>
        <Toggle
          checked={settings.voiceEnabled}
          onChange={(v) => patchSettings({ voiceEnabled: v })}
          label="Voice notifications"
          hint="Device text-to-speech — no AI"
        />
        <VoiceSettings />
      </section>

      {/* Notifications */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-nova-600 dark:text-nova-400">
          🔔 Notifications & alarms
        </h2>
        <NotificationSettings />
      </section>

      {/* Study */}
      <section className="card p-4 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-nova-600 dark:text-nova-400">
          📚 Study
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="label">Daily goal (hours)</span>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="input tabular"
              value={settings.dailyGoalMin / 60}
              onChange={(e) => patchSettings({ dailyGoalMin: Math.round((Number(e.target.value) || 0) * 60) })}
            />
          </div>
          <div>
            <span className="label">Weekly goal (hours)</span>
            <input
              type="number"
              min={1}
              step={1}
              className="input tabular"
              value={settings.weeklyGoalMin / 60}
              onChange={(e) => patchSettings({ weeklyGoalMin: Math.round((Number(e.target.value) || 0) * 60) })}
            />
          </div>
        </div>

        <div>
          <span className="label">Streak rule — what counts as a successful day</span>
          <Segmented
            value={settings.streakRuleType}
            onChange={(v) => patchSettings({ streakRuleType: v })}
            options={[
              { value: 'dailyGoal', label: 'Daily goal' },
              { value: 'completionPct', label: '% routines' },
              { value: 'sessions', label: 'Sessions' },
            ]}
          />
          {settings.streakRuleType === 'completionPct' && (
            <p className="text-xs text-slate-400 mt-2">
              Day counts when ≥ {settings.streakGoalPct}% of routines are completed.
            </p>
          )}
          {settings.streakRuleType === 'sessions' && (
            <div className="mt-2">
              <span className="label">Minimum sessions per day</span>
              <input
                type="number"
                min={1}
                className="input tabular"
                value={settings.streakMinSessions}
                onChange={(e) => patchSettings({ streakMinSessions: Math.max(1, Number(e.target.value) || 1) })}
              />
            </div>
          )}
        </div>

        {/* subject goals */}
        <div>
          <span className="label">Subject goals (hours per week)</span>
          {Object.entries(settings.subjectGoals).length > 0 && (
            <div className="space-y-1.5 mb-2">
              {Object.entries(settings.subjectGoals).map(([s, min]) => (
                <div key={s} className="flex items-center justify-between text-sm">
                  <span>{s}</span>
                  <span className="flex items-center gap-2">
                    <span className="tabular text-slate-400">{fmtDuration(min)}</span>
                    <button
                      className="text-rose-400 text-xs"
                      onClick={() => {
                        const next = { ...settings.subjectGoals };
                        delete next[s];
                        patchSettings({ subjectGoals: next });
                      }}
                    >
                      remove
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <select
              className="input flex-1"
              value={subjectGoalDraft}
              onChange={(e) => setSubjectGoalDraft(e.target.value)}
            >
              <option value="">— subject —</option>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="input w-20 tabular"
              placeholder="hrs"
              value={subjectGoalTarget}
              onChange={(e) => setSubjectGoalTarget(e.target.value)}
            />
            <button
              className="btn-soft !min-h-[44px] text-xs"
              onClick={() => {
                const h = Number(subjectGoalTarget);
                if (!subjectGoalDraft || !h) return;
                patchSettings({
                  subjectGoals: {
                    ...settings.subjectGoals,
                    [subjectGoalDraft]: Math.round(h * 60),
                  },
                });
                setSubjectGoalDraft('');
                setSubjectGoalTarget('');
              }}
            >
              Add
            </button>
          </div>
        </div>

        <Toggle
          checked={settings.focusEnabled}
          onChange={(v) => patchSettings({ focusEnabled: v })}
          label="Focus / Pomodoro mode"
          hint="Optional focus timer on the Study page"
        />
      </section>

      {/* About */}
      <section className="card p-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-nova-600 dark:text-nova-400 mb-2">
          ✨ About Nova
        </h2>
        <InstallButton />
        <p className="text-xs text-slate-400 leading-relaxed">
          Nova is a local-first routine & study companion. All data stays on your device
          (IndexedDB). Voice uses your device’s built-in text-to-speech — no AI, no cloud.
          <br />
          <br />
          <b>Honest note on background alarms:</b> browsers can’t guarantee alarms or voice while
          the app is fully closed. Keep Nova installed and running (or its tab open) for reliable
          reminders; system notifications delivered before suspension still appear. The
          architecture is ready for a future native Android version with guaranteed background
          alarms.
        </p>
      </section>
    </div>
  );
}
