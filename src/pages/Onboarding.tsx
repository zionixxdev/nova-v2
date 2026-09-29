import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { requestNotificationPermission } from '../lib/notify';
import { announce } from '../lib/voice';
import { primeAudio } from '../lib/notify';
import { Segmented } from '../components/ui';
import { LANGUAGES } from '../components/VoiceSettings';

const STEPS = 5;

export default function Onboarding() {
  const { settings, patchSettings } = useApp();
  const [step, setStep] = useState(0);

  const next = () => setStep((s) => Math.min(STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = async () => {
    primeAudio();
    await requestNotificationPermission();
    patchSettings({ onboardingDone: true });
    announce('welcome', {}, { ...settings, onboardingDone: true });
  };

  return (
    <div className="min-h-dvh flex flex-col max-w-md mx-auto px-6 py-10">
      {/* progress dots */}
      <div className="flex gap-1.5 mb-10 justify-center">
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-7 bg-nova-500' : i < step ? 'w-1.5 bg-nova-300' : 'w-1.5 bg-slate-300 dark:bg-slate-700'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {step === 0 && (
          <div className="text-center animate-slide-up">
            <div className="relative mx-auto w-24 h-24 mb-6 grid place-items-center">
              <span className="absolute inset-0 rounded-full bg-nova-500/20 animate-pulse-ring" />
              <span className="text-6xl">🌟</span>
            </div>
            <h1 className="text-3xl font-extrabold font-display tracking-tight">
              Nova
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-1">
              Your Daily Routine & Study Companion
            </p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-4">
              Alarms that talk, a study timer that counts only real minutes, and progress that
              actually reflects your day.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-extrabold mb-1">What should Nova call you?</h2>
            <p className="text-sm text-slate-400 mb-6">
              Your name is used in voice notifications — naturally, never excessively.
            </p>
            <input
              className="input !text-lg"
              autoFocus
              placeholder="Your name"
              value={settings.name}
              onChange={(e) => patchSettings({ name: e.target.value })}
            />
            <label className="flex items-center gap-2 mt-4 text-sm text-slate-500">
              <input
                type="checkbox"
                className="accent-nova-600 w-4 h-4"
                checked={settings.useName}
                onChange={(e) => patchSettings({ useName: e.target.checked })}
              />
              Use my name in voice notifications
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-extrabold mb-1">Preferred language</h2>
            <p className="text-sm text-slate-400 mb-6">Used for voice announcements.</p>
            <select
              className="input"
              value={settings.language}
              onChange={(e) => patchSettings({ language: e.target.value })}
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <button
              className="btn-soft w-full mt-4"
              onClick={() => announce('test', {}, { ...settings, voiceEnabled: true })}
            >
              🔊 Test Voice
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-extrabold mb-1">Clock format</h2>
            <p className="text-sm text-slate-400 mb-6">How should times appear?</p>
            <Segmented
              value={settings.clock24 ? '24' : '12'}
              onChange={(v) => patchSettings({ clock24: v === '24' })}
              options={[
                { value: '12', label: '12-hour — 4:00 PM' },
                { value: '24', label: '24-hour — 16:00' },
              ]}
            />
          </div>
        )}

        {step === 4 && (
          <div className="animate-slide-up">
            <h2 className="text-xl font-extrabold mb-1">Appearance</h2>
            <p className="text-sm text-slate-400 mb-6">Pick a theme. You can change it anytime.</p>
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
                  className={`card !p-4 flex flex-col items-center gap-2 transition-all ${
                    settings.theme === t.v ? 'ring-2 ring-nova-500 shadow-glow' : 'opacity-70'
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-10">
        {step > 0 && (
          <button className="btn-ghost" onClick={back}>
            Back
          </button>
        )}
        {step < STEPS - 1 ? (
          <button
            className="btn-primary flex-1"
            onClick={next}
            disabled={step === 1 && settings.name.trim().length === 0}
          >
            Continue
          </button>
        ) : (
          <button className="btn-primary flex-1" onClick={() => void finish()}>
            Start using Nova ✨
          </button>
        )}
      </div>
    </div>
  );
}
