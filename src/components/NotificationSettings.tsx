import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { requestNotificationPermission } from '../lib/notify';
import { Field, Segmented, Toggle } from './ui';

export default function NotificationSettings() {
  const { settings, patchSettings } = useApp();
  const [permState, setPermState] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const request = async () => {
    const ok = await requestNotificationPermission();
    setPermState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
    if (ok) patchSettings({ notificationsEnabled: true });
  };

  return (
    <div className="space-y-4">
      {permState === 'default' && (
        <button className="btn-primary w-full" onClick={request}>
          Allow notifications
        </button>
      )}
      {permState === 'denied' && (
        <p className="text-xs text-rose-500">
          Notifications are blocked for this site. Enable them in your browser’s site settings.
        </p>
      )}
      {permState === 'granted' && (
        <p className="text-xs text-emerald-600">Notifications are allowed ✓</p>
      )}

      <div className="divide-y divide-slate-100 dark:divide-slate-800 -mx-1">
        <Toggle
          checked={settings.notificationsEnabled}
          onChange={(v) => patchSettings({ notificationsEnabled: v })}
          label="Notifications"
          hint="System notifications for reminders"
        />
        <Toggle
          checked={settings.alarmEnabled}
          onChange={(v) => patchSettings({ alarmEnabled: v })}
          label="Alarm sound"
          hint="Chime when a task begins"
        />
        <Toggle
          checked={settings.vibration}
          onChange={(v) => patchSettings({ vibration: v })}
          label="Vibration"
          hint="Where the device supports it"
        />
      </div>

      <div>
        <span className="label">Alarm volume — {Math.round(settings.alarmVolume * 100)}%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.alarmVolume}
          onChange={(e) => patchSettings({ alarmVolume: Number(e.target.value) })}
          className="w-full accent-nova-600"
        />
      </div>

      <Field label="Default reminder (new routines)">
        <div className="flex gap-1.5 flex-wrap">
          {[0, 5, 10, 15, 30].map((m) => (
            <button
              key={m}
              onClick={() => patchSettings({ defaultReminderMin: m })}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                settings.defaultReminderMin === m
                  ? 'bg-nova-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {m === 0 ? 'None' : `${m} min`}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Default snooze duration">
        <Segmented
          value={String(settings.snoozeMin)}
          onChange={(v) => patchSettings({ snoozeMin: Number(v) })}
          options={[
            { value: '5', label: '5 min' },
            { value: '10', label: '10 min' },
            { value: '15', label: '15 min' },
          ]}
        />
      </Field>
    </div>
  );
}
