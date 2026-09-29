import { useEffect, useState } from 'react';
import { useApp } from '../store/AppContext';
import { announce, listVoices, refreshVoices } from '../lib/voice';
import { Field } from './ui';

export const LANGUAGES = [
  { value: 'en-IN', label: 'English (India)' },
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'hi-IN', label: 'हिन्दी — Hindi' },
  { value: 'bn-IN', label: 'বাংলা — Bengali' },
  { value: 'ta-IN', label: 'தமிழ் — Tamil' },
  { value: 'te-IN', label: 'తెలుగు — Telugu' },
  { value: 'mr-IN', label: 'मराठी — Marathi' },
  { value: 'gu-IN', label: 'ગુજરાતી — Gujarati' },
  { value: 'kn-IN', label: 'ಕನ್ನಡ — Kannada' },
  { value: 'ml-IN', label: 'മലയാളം — Malayalam' },
  { value: 'pa-IN', label: 'ਪੰਜਾਬੀ — Punjabi' },
  { value: 'or-IN', label: 'ଓଡ଼ିଆ — Odia' },
  { value: 'ur-PK', label: 'اردو — Urdu' },
];

export default function VoiceSettings() {
  const { settings, patchSettings } = useApp();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
      return;
    }
    const load = () => setVoices(listVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    // some browsers populate lazily
    const t = window.setTimeout(() => {
      refreshVoices();
      load();
    }, 400);
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', load);
      window.clearTimeout(t);
    };
  }, []);

  const langVoices = voices.filter((v) =>
    v.lang.toLowerCase().startsWith(settings.language.slice(0, 2))
  );

  return (
    <div className="space-y-4">
      {!supported && (
        <p className="text-xs text-amber-600">
          This browser doesn’t support speech synthesis. Voice announcements will be silent.
        </p>
      )}

      <Field label="Preferred language (voice)">
        <select
          className="input"
          value={settings.language}
          onChange={(e) => patchSettings({ language: e.target.value, voiceURI: undefined })}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Voice">
        <select
          className="input"
          value={settings.voiceURI ?? ''}
          onChange={(e) => patchSettings({ voiceURI: e.target.value || undefined })}
        >
          <option value="">Device default</option>
          {(langVoices.length > 0 ? langVoices : voices).map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </Field>

      <div>
        <div className="flex justify-between items-baseline">
          <span className="label">Speech rate — {settings.voiceRate.toFixed(2)}×</span>
        </div>
        <input
          type="range"
          min={0.6}
          max={1.6}
          step={0.05}
          value={settings.voiceRate}
          onChange={(e) => patchSettings({ voiceRate: Number(e.target.value) })}
          className="w-full accent-nova-600"
        />
      </div>

      <div>
        <span className="label">Voice volume — {Math.round(settings.voiceVolume * 100)}%</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.voiceVolume}
          onChange={(e) => patchSettings({ voiceVolume: Number(e.target.value) })}
          className="w-full accent-nova-600"
        />
      </div>

      <button
        className="btn-soft w-full"
        onClick={() => announce('test', {}, { ...settings, voiceEnabled: true })}
      >
        🔊 Test Voice
      </button>
    </div>
  );
}
