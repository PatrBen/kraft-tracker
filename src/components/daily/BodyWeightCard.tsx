import { useId, useState, type FormEvent } from 'react';
import { addBodyWeight } from '../../db/bodyWeights';
import { useBodyWeights } from '../../hooks/useBodyWeights';
import {
  formatDate,
  formatDecimalInput,
  formatNumber,
  formatShortDate,
  formatSignedKg,
  parseDecimal,
} from '../../utils/format';
import { requestPersistentStorage } from '../../utils/storage';

export function BodyWeightCard({ onOpenStats }: { onOpenStats: () => void }) {
  const entries = useBodyWeights();
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  const latest = entries?.at(-1);
  const previous = entries?.at(-2);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const kg = parseDecimal(weight);
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
      setError('Bitte ein Gewicht zwischen 20 und 400 kg eingeben.');
      return;
    }
    setError(null);
    requestPersistentStorage();
    await addBodyWeight(Math.round(kg * 10) / 10);
    setWeight('');
  };

  return (
    <article className="card daily-card">
      <header className="card__header">
        <h2 className="card__title">Körpergewicht</h2>
        {latest && (
          <button type="button" className="btn btn--ghost btn--small" onClick={onOpenStats}>
            Statistik
          </button>
        )}
      </header>

      {latest ? (
        <>
          <p className="daily-card__value">
            <span className="daily-card__number">{formatNumber(latest.weightKg)}</span> kg
          </p>
          <p className="muted daily-card__meta">
            am {formatDate(latest.measuredAt)}
            {previous &&
              ` · ${formatSignedKg(latest.weightKg - previous.weightKg)} ggü. ${formatShortDate(previous.measuredAt)}`}
          </p>
        </>
      ) : (
        <p className="muted daily-card__meta">Trage dein aktuelles Gewicht ein – daraus entsteht der Verlauf.</p>
      )}

      <form className="daily-card__form" onSubmit={handleSubmit} noValidate>
        <label htmlFor={inputId} className="visually-hidden">
          Körpergewicht in kg
        </label>
        <input
          id={inputId}
          className="input input--number"
          inputMode="decimal"
          autoComplete="off"
          placeholder={latest ? formatDecimalInput(latest.weightKg) : 'kg'}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">
          Speichern
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
