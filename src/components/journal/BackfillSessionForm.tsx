import { useId, useState, type FormEvent } from 'react';
import { createPastSession } from '../../db/sessions';
import type { WorkoutPlan } from '../../db/types';
import { toDateInputValue } from '../../utils/format';
import { requestPersistentStorage } from '../../utils/storage';

const WITHOUT_PLAN = 'none';

interface BackfillSessionFormProps {
  plans: WorkoutPlan[];
  onCreated: (sessionId: string) => void;
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateInputValue(d);
}

/** Vergangenes Training anlegen; die Sätze werden danach in der normalen Session-Ansicht eingetragen. */
export function BackfillSessionForm({ plans, onCreated }: BackfillSessionFormProps) {
  const [open, setOpen] = useState(false);
  const [planValue, setPlanValue] = useState(() => (plans[0] ? plans[0].id : WITHOUT_PLAN));
  const [date, setDate] = useState(yesterday);
  const [time, setTime] = useState('18:00');
  const [duration, setDuration] = useState('60');
  const [error, setError] = useState<string | null>(null);
  const planId = useId();
  const dateId = useId();
  const timeId = useId();
  const durationId = useId();

  if (!open) {
    return (
      <button type="button" className="btn btn--ghost add-toggle" onClick={() => setOpen(true)}>
        + Vergangenes Training nachtragen
      </button>
    );
  }

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Ohne "Z" wird der String als lokale Zeit interpretiert.
    const startedAt = new Date(`${date}T${time || '12:00'}`);
    const minutes = Number(duration);

    if (!date || Number.isNaN(startedAt.getTime())) {
      setError('Bitte ein gültiges Datum eingeben.');
      return;
    }
    if (startedAt.getTime() > Date.now()) {
      setError('Das Training liegt in der Zukunft – zum Starten oben einen Plan wählen.');
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      setError('Bitte eine Dauer zwischen 1 und 600 Minuten eingeben.');
      return;
    }

    const plan = plans.find((p) => p.id === planValue) ?? null;
    requestPersistentStorage();
    onCreated(await createPastSession(plan, startedAt, minutes));
  };

  return (
    <form className="card backfill-form" onSubmit={handleSubmit} noValidate>
      <h3 className="card__title">Training nachtragen</h3>
      <p className="muted backfill-form__hint">
        Lege ein vergangenes Training an und trage danach die Sätze ein. Es erscheint im Verlauf
        und in der Statistik an seinem Datum.
      </p>

      <div className="form-grid">
        <div className="field form-grid__full">
          <label htmlFor={planId}>Plan</label>
          <select
            id={planId}
            className="input input--select"
            value={planValue}
            onChange={(e) => setPlanValue(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value={WITHOUT_PLAN}>Ohne Plan (Übungen selbst wählen)</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor={dateId}>Datum</label>
          <input
            id={dateId}
            type="date"
            className="input"
            max={toDateInputValue(new Date())}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={timeId}>Uhrzeit</label>
          <input
            id={timeId}
            type="time"
            className="input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={durationId}>Dauer (min)</label>
          <input
            id={durationId}
            className="input"
            inputMode="numeric"
            autoComplete="off"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn--primary">
          Anlegen &amp; Sätze eintragen
        </button>
        <button type="button" className="btn btn--ghost" onClick={close}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
