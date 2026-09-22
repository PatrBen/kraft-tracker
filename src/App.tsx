import { lazy, Suspense } from 'react';
import { CloudLoginDialog } from './components/cloud/CloudLoginDialog';
import { DataPage } from './components/data/DataPage';
import { SyncDot } from './components/data/SyncDot';
import { JournalPage } from './components/journal/JournalPage';
import { PlansPage } from './components/plans/PlansPage';
import { RestTimerBar } from './components/timer/RestTimerBar';
import { RestTimerProvider } from './components/timer/RestTimerProvider';
import { useSyncSummary } from './hooks/useCloudSync';
import { useHashRoute, type Tab } from './hooks/useHashRoute';
import { useActiveSession } from './hooks/useSessions';
import { useWakeLock } from './hooks/useWakeLock';

// Recharts ist der größte Brocken im Bundle – erst laden, wenn die Statistik geöffnet wird.
const StatsPage = lazy(() =>
  import('./components/stats/StatsPage').then((m) => ({ default: m.StatsPage })),
);

const TAB_LABELS: Record<Tab, string> = {
  plans: 'Pläne',
  journal: 'Tagebuch',
  stats: 'Statistik',
  data: 'Daten',
};

export function App() {
  const { route, navigate } = useHashRoute();
  const activeSession = useActiveSession();
  const sync = useSyncSummary();
  // Während eines laufenden Trainings Display anlassen – auch wenn man gerade die Statistik ansieht.
  useWakeLock(Boolean(activeSession));

  return (
    <RestTimerProvider>
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__top">
            <p className="app-title">Kraft-Tracker</p>
            {sync.loggedIn && (
              <button
                type="button"
                className="sync-badge"
                onClick={() => navigate('data')}
                title={sync.label}
              >
                <SyncDot tone={sync.tone} />
                {sync.tone === 'ok' ? 'Sync' : sync.tone === 'offline' ? 'Offline' : sync.tone === 'error' ? 'Sync-Fehler' : 'Sync …'}
              </button>
            )}
          </div>
          <nav className="tabs" aria-label="Hauptnavigation">
            {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className="tab"
                aria-current={route.tab === tab ? 'page' : undefined}
                onClick={() => navigate(tab)}
              >
                {TAB_LABELS[tab]}
                {tab === 'journal' && activeSession && (
                  <span className="tab__live" role="img" aria-label="Training läuft" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="app-main">
        {route.tab === 'plans' && <PlansPage navigate={navigate} />}
        {route.tab === 'journal' && <JournalPage sessionId={route.id} navigate={navigate} />}
        {route.tab === 'stats' && (
          <Suspense fallback={null}>
            <StatsPage exerciseId={route.id} navigate={navigate} />
          </Suspense>
        )}
        {route.tab === 'data' && <DataPage />}
      </main>

      <RestTimerBar />
      <CloudLoginDialog />
    </RestTimerProvider>
  );
}
