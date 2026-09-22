import { useObservable } from 'dexie-react-hooks';
import { cloudDatabaseUrl, db } from '../db/db';

export const isCloudConfigured = Boolean(cloudDatabaseUrl);

export type SyncTone = 'ok' | 'busy' | 'offline' | 'error' | 'off';

export interface SyncSummary {
  configured: boolean;
  loggedIn: boolean;
  email: string | undefined;
  tone: SyncTone;
  label: string;
  /** Bei Testkonten: verbleibende Tage mit Sync (Dexie Cloud "evaluation"). */
  evalDaysLeft: number | undefined;
}

/** Anmelde- und Sync-Zustand in einer Form, die die UI direkt anzeigen kann. */
export function useSyncSummary(): SyncSummary {
  const user = useObservable(db.cloud.currentUser);
  const syncState = useObservable(db.cloud.syncState);

  const loggedIn = Boolean(isCloudConfigured && user?.isLoggedIn);
  const base = {
    configured: isCloudConfigured,
    loggedIn,
    email: user?.email,
    evalDaysLeft: user?.license?.type === 'eval' ? user.license.evalDaysLeft : undefined,
  };

  if (!isCloudConfigured) return { ...base, tone: 'off', label: 'Sync nicht eingerichtet' };
  if (!loggedIn) return { ...base, tone: 'off', label: 'Nicht angemeldet' };

  if (syncState?.license === 'expired' || user?.license?.status === 'expired') {
    return { ...base, tone: 'error', label: 'Testzeitraum abgelaufen – Sync pausiert' };
  }
  switch (syncState?.phase) {
    case 'in-sync':
      return { ...base, tone: 'ok', label: 'Synchronisiert' };
    case 'pushing':
    case 'pulling':
      return { ...base, tone: 'busy', label: 'Synchronisiere …' };
    case 'not-in-sync':
      return { ...base, tone: 'busy', label: 'Änderungen ausstehend' };
    case 'offline':
      return { ...base, tone: 'offline', label: 'Offline – wird später synchronisiert' };
    case 'error':
      return {
        ...base,
        tone: 'error',
        label: `Sync-Fehler${syncState.error?.message ? `: ${syncState.error.message}` : ''}`,
      };
    default:
      return { ...base, tone: 'busy', label: 'Verbinde …' };
  }
}
