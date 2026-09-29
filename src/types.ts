/* Nova — core domain types */

export type ThemeMode = 'light' | 'dark' | 'system';
export type Priority = 'low' | 'normal' | 'high';
export type Category = 'Study' | 'School' | 'Work' | 'Health' | 'Personal' | 'Other';

export interface Routine {
  id: string;
  name: string;
  category: Category;
  subject?: string;
  startTime: string; // "HH:MM" 24h internal
  durationMin: number;
  repeatDays: number[]; // 0 = Sunday … 6 = Saturday
  priority: Priority;
  notes?: string;
  reminderMin: number; // minutes before start; 0 = none
  voice: boolean;
  alarm: boolean;
  trackStudy: boolean;
  paused: boolean;
  createdAt: number;
}

export type TaskStatus = 'pending' | 'completed' | 'missed' | 'skipped';

/** Per-day completion state for a routine occurrence. */
export interface TaskInstance {
  id: string; // `${date}|${routineId}`
  routineId: string;
  date: string; // YYYY-MM-DD
  status: TaskStatus;
  completedAt?: number;
}

export interface StudySession {
  id: string;
  subject: string;
  task?: string;
  start: number; // epoch ms
  end: number; // epoch ms
  date: string; // YYYY-MM-DD
  source: 'timer' | 'focus' | 'manual';
}

export type StreakRuleType = 'dailyGoal' | 'completionPct' | 'sessions';

export interface Settings {
  name: string;
  useName: boolean;
  language: string; // BCP-47 tag for TTS
  clock24: boolean;
  theme: ThemeMode;
  voiceEnabled: boolean;
  voiceURI?: string;
  voiceRate: number; // 0.5 – 2
  voiceVolume: number; // 0 – 1
  notificationsEnabled: boolean;
  alarmEnabled: boolean;
  vibration: boolean;
  alarmVolume: number; // 0 – 1 (WebAudio gain)
  defaultReminderMin: number;
  snoozeMin: number;
  dailyGoalMin: number;
  weeklyGoalMin: number;
  subjectGoals: Record<string, number>; // subject -> minutes per week
  streakRuleType: StreakRuleType;
  streakGoalPct: number; // for completionPct rule
  streakMinSessions: number; // for sessions rule
  focusEnabled: boolean;
  focusWorkMin: number;
  focusBreakMin: number;
  onboardingDone: boolean;
  lastSummaryDate?: string; // YYYY-MM-DD last shown daily summary
}

/** Minimal shape of the non-standard beforeinstallprompt event. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  useName: true,
  language: 'en-IN',
  clock24: false,
  theme: 'system',
  voiceEnabled: true,
  voiceRate: 1,
  voiceVolume: 1,
  notificationsEnabled: true,
  alarmEnabled: true,
  vibration: true,
  alarmVolume: 0.8,
  defaultReminderMin: 10,
  snoozeMin: 10,
  dailyGoalMin: 240,
  weeklyGoalMin: 1500,
  subjectGoals: {},
  streakRuleType: 'dailyGoal',
  streakGoalPct: 80,
  streakMinSessions: 1,
  focusEnabled: true,
  focusWorkMin: 25,
  focusBreakMin: 5,
  onboardingDone: false,
};

/** A routine occurrence materialised for a specific date. */
export interface ScheduleItem {
  key: string; // `${date}|${routineId}`
  routine: Routine;
  date: string;
  start: number; // epoch ms
  end: number; // epoch ms
  status: TaskStatus;
  isStudy: boolean;
}
