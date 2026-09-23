import { useState } from 'react';
import { addPushups, undoLastPushups } from '../../db/pushups';
import { usePushupDefaultCount, usePushupEntries } from '../../hooks/usePushups';
import { pluralize } from '../../utils/format';
import { startOfPeriod } from '../../utils/periods';
import { Stepper } from '../common/Stepper';

export function PushupCounter({ onOpenStats }: { onOpenStats: () => void }) {
  const entries = usePushupEntries();
  const [defaultCount, setDefaultCount] = usePushupDefaultCount();
  const [showSettings, setShowSettings] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const now = new Date();
  const todayStart = startOfPeriod(now, 'day').getTime();
  const weekStart = startOfPeriod(now, 'week').getTime();
  const today = entries?.filter((e) => e.doneAt.getTime() >= todayStart) ?? [];
  const todayTotal = today.reduce((sum, e) => sum + e.count, 0);
  const weekTotal =
    entries?.filter((e) => e.doneAt.getTime() >= weekStart).reduce((sum, e) => sum + e.count, 0) ?? 0;

  const handleAdd = async () => {
    setStatus(null);
    await addPushups(defaultCount);
  };

  const handleUndo = async () => {
    const removed = await undoLastPushups();
    setStatus(removed ? `Letzte Runde (${removed}) entfernt.` : null);
  };

  return (
    <article className="card daily-card">
      <header className="card__header">
        <h2 className="card__title">Liegestütze</h2>
        <div className="daily-card__links">
          <button type="button" className="btn btn--ghost btn--small" onClick={onOpenStats}>
            Statistik
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--small"
            aria-expanded={showSettings}
            onClick={() => setShowSettings((open) => !open)}
          >
            Einstellen
          </button>
        </div>
      </header>

      <p className="daily-card__value">
        <span className="daily-card__number">{todayTotal}</span> heute
      </p>
      <p className="muted daily-card__meta">
        {pluralize(today.length, 'Runde', 'Runden')} heute · {weekTotal} diese Woche
      </p>

      <div className="daily-card__actions">
        <button type="button" className="btn btn--primary daily-card__plus" onClick={handleAdd}>
          +1 <span className="daily-card__plus-sub">({defaultCount} Liegestütze)</span>
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleUndo} disabled={today.length === 0}>
          Rückgängig
        </button>
      </div>

      {showSettings && (
        <div className="daily-card__settings">
          <span className="field__label">Liegestütze pro „+1“</span>
          <Stepper
            label="Liegestütze pro Klick"
            value={defaultCount}
            onChange={setDefaultCount}
            min={1}
            max={200}
          />
        </div>
      )}

      {status && (
        <p className="muted daily-card__status" role="status">
          {status}
        </p>
      )}
    </article>
  );
}
