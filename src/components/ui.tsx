import { useEffect } from 'react';
import type { ReactNode } from 'react';

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`card p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  hint?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      {(label || hint) && (
        <span className="min-w-0">
          <span className="block text-sm font-medium">{label}</span>
          {hint && <span className="block text-xs text-slate-400 mt-0.5">{hint}</span>}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-12 h-7 rounded-full transition-colors ${
          checked ? 'bg-nova-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </label>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  className = '',
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1 ${className}`}
      role="tablist"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-2 text-xs font-semibold transition-all ${
            value === o.value
              ? 'bg-white dark:bg-[#2a2e3a] text-nova-700 dark:text-nova-300 shadow'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div
        className={`relative w-full ${
          wide ? 'sm:max-w-lg' : 'sm:max-w-md'
        } max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl
        bg-white dark:bg-[#181b24] shadow-2xl animate-slide-up`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 pt-4 pb-3 bg-white/95 dark:bg-[#181b24]/95 backdrop-blur border-b border-slate-100 dark:border-slate-800 rounded-t-3xl">
          <h3 className="font-bold text-base">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-9 h-9 grid place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card p-8 text-center flex flex-col items-center gap-2">
      <div className="text-4xl">{icon}</div>
      <p className="font-semibold">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 -mt-1">{subtitle}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export const PRIORITY_STYLES: Record<string, { dot: string; chip: string }> = {
  high: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  },
  normal: {
    dot: 'bg-nova-500',
    chip: 'bg-nova-50 text-nova-700 dark:bg-nova-500/10 dark:text-nova-300',
  },
  low: {
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  },
};

export const CATEGORY_ICONS: Record<string, string> = {
  Study: '📚',
  School: '🏫',
  Work: '💼',
  Health: '💪',
  Personal: '🌿',
  Other: '✨',
};
