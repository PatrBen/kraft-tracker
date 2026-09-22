import type { Navigate } from '../../hooks/useHashRoute';
import { JournalOverview } from './JournalOverview';
import { SessionView } from './SessionView';

interface JournalPageProps {
  /** Geöffnete Session aus der URL (`#/journal/12`), sonst Übersicht. */
  sessionId: string | null;
  navigate: Navigate;
}

export function JournalPage({ sessionId, navigate }: JournalPageProps) {
  if (sessionId !== null) {
    return (
      <SessionView
        key={sessionId}
        sessionId={sessionId}
        onBack={() => navigate('journal')}
        onOpenStats={(exerciseId) => navigate('stats', exerciseId)}
      />
    );
  }
  return <JournalOverview navigate={navigate} />;
}
