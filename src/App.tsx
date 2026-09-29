import { useEffect, useState } from 'react';
import { AppProvider, useApp } from './store/AppContext';
import BottomNavigation, { type Tab } from './components/BottomNavigation';
import AlarmModal from './components/AlarmModal';
import RoutineForm from './components/RoutineForm';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Schedule from './pages/Schedule';
import StudyPage from './pages/StudyPage';
import ProgressPage from './pages/ProgressPage';
import SettingsPage from './pages/SettingsPage';
import { primeAudio } from './lib/notify';
import { initInstallPrompt } from './lib/install';
import type { Routine } from './types';

function Shell() {
  const { ready, settings, timer } = useApp();
  const [tab, setTab] = useState<Tab>('home');
  const [editing, setEditing] = useState<Routine | null>(null);

  // when a study timer starts, jump to the study tab (but allow navigating away)
  useEffect(() => {
    if (timer) setTab('study');
  }, [timer !== null]); // eslint-disable-line react-hooks/exhaustive-deps

  // unlock audio on first interaction so alarms can sound later
  useEffect(() => {
    initInstallPrompt();
    const onFirstTouch = () => {
      primeAudio();
      window.removeEventListener('pointerdown', onFirstTouch);
    };
    window.addEventListener('pointerdown', onFirstTouch);
    return () => window.removeEventListener('pointerdown', onFirstTouch);
  }, []);

  if (!ready)
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="text-center animate-pulse">
          <div className="text-5xl mb-2">🌟</div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-nova-500">Nova</p>
        </div>
      </div>
    );

  if (!settings.onboardingDone) return <Onboarding />;

  return (
    <div className="min-h-dvh max-w-md mx-auto px-4 pt-4 pb-28">
      {tab === 'home' && <Home navigate={setTab} onEditRoutine={setEditing} />}
      {tab === 'schedule' && <Schedule onEditRoutine={setEditing} />}
      {tab === 'study' && <StudyPage />}
      {tab === 'progress' && <ProgressPage />}
      {tab === 'settings' && <SettingsPage />}

      <BottomNavigation active={tab} onChange={setTab} />
      <AlarmModal onGoStudy={() => setTab('study')} />

      {editing && (
        <RoutineForm open onClose={() => setEditing(null)} initial={editing} mode="edit" />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
