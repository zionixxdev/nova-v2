import type { ReactNode } from 'react';

export type Tab = 'home' | 'schedule' | 'study' | 'progress' | 'settings';

const TABS: { id: Tab; icon: ReactNode; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'schedule', icon: '📅', label: 'Schedule' },
  { id: 'study', icon: '⏱', label: 'Study' },
  { id: 'progress', icon: '📊', label: 'Progress' },
  { id: 'settings', icon: '⚙', label: 'Settings' },
];

export default function BottomNavigation({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
}) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-slate-200/80 dark:border-slate-800
        bg-white/90 dark:bg-[#141721]/90 backdrop-blur-lg"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-5">
        {TABS.map((t) => {
          const isActive = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center gap-0.5 py-2.5 transition-transform active:scale-90"
            >
              <span
                className={`text-lg leading-none transition-all ${
                  isActive
                    ? 'scale-110 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]'
                    : 'opacity-50 grayscale'
                }`}
              >
                {t.icon}
              </span>
              <span
                className={`text-[10px] font-semibold ${
                  isActive ? 'text-nova-600 dark:text-nova-400' : 'text-slate-400'
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
