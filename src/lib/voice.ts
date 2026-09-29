/* Voice announcements — plain Web Speech API (SpeechSynthesis).
   No AI. Predefined templates with variables, randomly varied. */

import type { Settings } from '../types';

export type VoiceEvent =
  | 'preReminder'   // X minutes before
  | 'taskStart'
  | 'sessionComplete'
  | 'nextTask'
  | 'focusStart'
  | 'focusEnd'
  | 'dailySummary'
  | 'welcome'
  | 'test';

type Vars = Partial<{
  name: string;
  task: string;
  subject: string;
  time: string;
  minutes: number;
  duration: string;
  study: string;
}>;

/** Multiple variants so announcements don't always sound identical. */
const TEMPLATES: Record<VoiceEvent, string[]> = {
  preReminder: [
    '{name}, {task} starts in {minutes} minutes.',
    'Heads up{name}, {task} begins in {minutes} minutes.',
    '{name}, you have {task} coming up in {minutes} minutes.',
  ],
  taskStart: [
    "{name}, it's time for {task}.",
    '{name}, your {subject} study session has started.',
    '{name}, {task} starts now. {subject} time.',
  ],
  sessionComplete: [
    'Good job{name}. You completed {task}.',
    '{name}, your study session is complete.',
    "Nice work{name}, that's {duration} of {subject}.",
  ],
  nextTask: [
    '{name}, your next task is {task} at {time}.',
    'Up next{name}: {task} at {time}.',
  ],
  focusStart: [
    '{name}, your focus session has started.',
    "Let's focus{name}. {minutes} minutes on {subject}.",
  ],
  focusEnd: [
    '{name}, your focus session is complete. Time for a break.',
    'Focus session done{name}. Take a break.',
  ],
  dailySummary: [
    '{name}, here is your day. You studied {study}, completed {task}, and reached {minutes} percent of your goal.',
  ],
  welcome: ['Hello{name}, this is Nova. Your routine and study companion is ready.'],
  test: ['Hello{name}, this is Nova. Voice notifications are working.'],
};

/** Build the spoken sentence for an event. */
export function buildPhrase(event: VoiceEvent, vars: Vars, settings: Settings): string {
  const list = TEMPLATES[event];
  const tpl = list[Math.floor(Math.random() * list.length)];
  const useName = settings.useName && !!settings.name;
  const fill: Record<string, string> = {
    name: useName ? settings.name : '',
    task: vars.task ?? '',
    subject: vars.subject ?? 'study',
    time: vars.time ?? '',
    minutes: String(vars.minutes ?? ''),
    duration: vars.duration ?? '',
    study: vars.study ?? '',
  };
  let out = tpl.replace(/\{(\w+)\}/g, (_, k: string) => fill[k] ?? '');
  // tidy punctuation when name is omitted
  out = out.replace(/,\s*,/g, ',').replace(/,\s*\./g, '.').replace(/\s{2,}/g, ' ');
  out = out.replace(/^Heads up,/, 'Heads up —').replace(/^Up next:/, 'Up next:');
  if (!useName) {
    out = out.replace(/^,\s*/, '');
    // e.g. "it's time for Physics."
    out = out.replace(/^(Good job|Nice work|Let's focus|Hello|Heads up —|Up next)\s*,\s*/, '$1. ');
  }
  out = out.replace(/^[A-Z]/, (c) => c);
  return out.trim().replace(/\s+([.,])/g, '$1');
}

let cachedVoices: SpeechSynthesisVoice[] = [];

export function refreshVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  if (cachedVoices.length === 0) refreshVoices();
  return cachedVoices;
}

export function pickVoice(settings: Settings): SpeechSynthesisVoice | undefined {
  const voices = listVoices();
  if (voices.length === 0) return undefined;
  if (settings.voiceURI) {
    const exact = voices.find((v) => v.voiceURI === settings.voiceURI);
    if (exact) return exact;
  }
  const byLang = voices.filter((v) => v.lang.toLowerCase() === settings.language.toLowerCase());
  return byLang[0] ?? voices.find((v) => v.lang.startsWith(settings.language.slice(0, 2))) ?? voices[0];
}

/** Speak a phrase with device TTS. Safe no-op when unsupported/disabled. */
export function speak(text: string, settings: Settings, force = false): void {
  if (!('speechSynthesis' in window)) return;
  if (!settings.voiceEnabled && !force) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(settings);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else {
      u.lang = settings.language || 'en-IN';
    }
    u.rate = settings.voiceRate;
    u.volume = settings.voiceVolume;
    window.speechSynthesis.speak(u);
  } catch {
    /* TTS unavailable — ignore */
  }
}

export function announce(event: VoiceEvent, vars: Vars, settings: Settings): void {
  const phrase = buildPhrase(event, vars, settings);
  if (phrase) speak(phrase, settings);
}
