import { useState } from 'react';
import { db } from '../../db/db';
import { useSyncSummary } from '../../hooks/useCloudSync';
import { SyncDot } from './SyncDot';

export function SyncSection() {
  const sync = useSyncSummary();
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      // Abbrechen im Login-Dialog ist kein Fehler.
      if (err instanceof Error && !/cancel/i.test(err.name + err.message)) setError(err.message);
    }
  };

  if (!sync.configured) {
    return (
      <div className="card">
        <h2 className="card__title">Synchronisierung</h2>
        <p className="muted card__text">
          Noch nicht eingerichtet – die Daten liegen nur auf diesem Gerät. Sobald die
          Cloud-Datenbank verbunden ist, meldest du dich hier auf Handy und PC an und beide bleiben
          automatisch auf demselben Stand.
        </p>
      </div>
    );
  }

  if (!sync.loggedIn) {
    return (
      <div className="card">
        <h2 className="card__title">Synchronisierung</h2>
        <p className="muted card__text">
          Melde dich auf Handy und PC mit derselben E-Mail-Adresse an, dann bleiben Pläne, Trainings
          und Sätze auf beiden Geräten auf demselben Stand. Was du bisher auf diesem Gerät erfasst
          hast, wird beim ersten Anmelden übernommen.
        </p>
        <div className="card__actions">
          <button type="button" className="btn btn--primary" onClick={() => run(() => db.cloud.login())}>
            Anmelden
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card__title">Synchronisierung</h2>
      <p className="card__text">
        Angemeldet als <strong>{sync.email}</strong>
      </p>
      <p className="sync-status">
        <SyncDot tone={sync.tone} />
        {sync.label}
      </p>
      {sync.evalDaysLeft !== undefined && (
        <p className="muted card__text">
          Testkonto: Sync noch {sync.evalDaysLeft} {sync.evalDaysLeft === 1 ? 'Tag' : 'Tage'} aktiv.
          Danach in der Dexie-Cloud-Verwaltung auf „Production“ umstellen – im kostenlosen Tarif
          sind 3 Nutzer frei.
        </p>
      )}
      <div className="card__actions">
        <button
          type="button"
          className="btn"
          onClick={() => run(() => db.cloud.sync({ wait: true, purpose: 'pull' }))}
        >
          Jetzt synchronisieren
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--danger"
          onClick={() => run(() => db.cloud.logout())}
        >
          Abmelden
        </button>
      </div>
      <p className="muted card__hint">
        Beim Abmelden werden die Daten von diesem Gerät entfernt – in der Cloud und auf deinen
        anderen Geräten bleiben sie erhalten.
      </p>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
