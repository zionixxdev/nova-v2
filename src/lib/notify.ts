/* Notifications, alarm sound and vibration. No AI, no backend. */

import type { Settings } from '../types';

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Unlock WebAudio on the first user gesture so alarms can play later. */
export function primeAudio(): void {
  const ctx = getCtx();
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

/** A gentle but attention-getting chime repeated a few times. */
export function playAlarmSound(volume = 0.8, repeats = 2): void {
  const ctx = getCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const base = now + 0.05;
  for (let r = 0; r < repeats; r++) {
    const offset = base + r * 1.1;
    const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6 — bright major chord arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = offset + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(Math.min(1, volume) * 0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  }
}

export function playChime(volume = 0.6): void {
  playAlarmSound(volume, 1);
}

export function vibrate(pattern: number | number[] = [200, 100, 200]): void {
  try {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  } catch {
    /* unsupported */
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export interface NotifyOptions {
  title: string;
  body: string;
  tag?: string;
  requireInteraction?: boolean;
  onClick?: () => void;
}

/** Show a system notification if permitted & enabled. */
export function notify(opts: NotifyOptions, settings: Settings): void {
  if (!settings.notificationsEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      tag: opts.tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
    });
    n.onclick = () => {
      window.focus();
      n.close();
      opts.onClick?.();
    };
  } catch {
    /* some browsers require SW registration.showNotification — fail silently */
  }
}

/** Fire the full alarm package: sound + vibration + notification. */
export function fireAlarm(title: string, body: string, settings: Settings, tag?: string): void {
  if (settings.alarmEnabled) playAlarmSound(settings.alarmVolume);
  if (settings.vibration) vibrate([300, 150, 300, 150, 300]);
  notify({ title, body, tag, requireInteraction: true }, settings);
}
