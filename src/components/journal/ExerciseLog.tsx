import { useEffect, useId, useState, type FormEvent } from 'react';
import { addSet, deleteSet } from '../../db/sessions';
import type { PlanExercise, WorkoutSession, WorkoutSet } from '../../db/types';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useLastPerformance } from '../../hooks/useSessions';
import {
  formatDecimalInput,
  formatKg,
  formatNumber,
  formatShortDate,
  parseDecimal,
} from '../../utils/format';
import { epley1RM } from '../../utils/oneRepMax';
import { unlockAudio } from '../../utils/signal';

interface ExerciseLogProps {
  session: WorkoutSession;
  planExercise: PlanExercise;
  exerciseName: string;
  sets: WorkoutSet[];
  isActive: boolean;
  onOpenStats: () => void;
}

export function ExerciseLog({
  session,
  planExercise,
  exerciseName,
  sets,
  isActive,
  onOpenStats,
}: ExerciseLogProps) {
  const timer = useRestTimer();
  const lastPerformance = useLastPerformance(planExercise.exerciseId, session.startedAt);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const weightId = useId();
  const repsId = useId();

  // Vorbelegung: letzter Satz dieser Session, sonst erster Satz vom letzten Mal.
  const suggestion = sets.at(-1) ?? lastPerformance?.sets[0];
  useEffect(() => {
    if (touched || !suggestion) return;
    setWeight(formatDecimalInput(suggestion.weightKg));
    setReps(String(suggestion.reps));
  }, [suggestion, touched]);

  const done = sets.length >= planExercise.targetSets;
  const openSlots = Math.max(0, planExercise.targetSets - sets.length);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Muss synchron im Klick passieren, sonst darf der Browser den Timer-Ton später nicht abspielen.
    if (isActive) unlockAudio();

    const weightKg = parseDecimal(weight);
    const repCount = Number(reps);
    if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 1000) {
      setError('Bitte ein gültiges Gewicht eingeben.');
      return;
    }
    if (!Number.isInteger(repCount) || repCount < 1 || repCount > 100) {
      setError('Bitte gültige Wiederholungen eingeben (1–100).');
      return;
    }

    setError(null);
    await addSet(session.id, planExercise.exerciseId, weightKg, repCount);
    if (isActive) timer.start();
  };

  const handleDeleteSet = async (set: WorkoutSet, index: number) => {
    if (window.confirm(`Satz ${index + 1} (${formatKg(set.weightKg)} × ${set.reps}) löschen?`)) {
      await deleteSet(set.id);
    }
  };

  return (
    <article className={`card exercise-log${done ? ' exercise-log--done' : ''}`}>
      <header className="card__header exercise-log__header">
        <h2 className="card__title">{exerciseName}</h2>
        <span className={`badge${done ? ' badge--done' : ''}`}>
          {done && '✓ '}
          {sets.length} / {planExercise.targetSets}
        </span>
        <button
          type="button"
          className="btn btn--ghost btn--small exercise-log__stats"
          onClick={onOpenStats}
          aria-label={`Statistik für ${exerciseName}`}
        >
          Statistik
        </button>
      </header>

      {lastPerformance && (
        <p className="last-performance">
          Letztes Mal ({formatShortDate(lastPerformance.date)}):{' '}
          {lastPerformance.sets.map((s) => `${formatNumber(s.weightKg)} × ${s.reps}`).join(' · ')}
        </p>
      )}

      <ol className="set-list">
        {sets.map((set, index) => (
          <li key={set.id} className="set-row">
            <span className="set-row__index">{index + 1}</span>
            <span className="set-row__main">
              {formatKg(set.weightKg)} × {set.reps}
            </span>
            <span className="set-row__meta">1RM ≈ {formatKg(epley1RM(set.weightKg, set.reps))}</span>
            <button
              type="button"
              className="btn btn--icon btn--ghost btn--danger"
              onClick={() => handleDeleteSet(set, index)}
              aria-label={`Satz ${index + 1} löschen`}
            >
              ✕
            </button>
          </li>
        ))}
        {Array.from({ length: openSlots }, (_, i) => (
          <li key={`open-${i}`} className="set-row set-row--open">
            <span className="set-row__index">{sets.length + i + 1}</span>
            <span className="set-row__main">offen</span>
          </li>
        ))}
      </ol>

      <form className="set-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={weightId}>Gewicht (kg)</label>
          <input
            id={weightId}
            className="input input--number"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setTouched(true);
            }}
            placeholder="0"
          />
        </div>
        <div className="field">
          <label htmlFor={repsId}>Wiederholungen</label>
          <input
            id={repsId}
            className="input input--number"
            inputMode="numeric"
            autoComplete="off"
            value={reps}
            onChange={(e) => {
              setReps(e.target.value);
              setTouched(true);
            }}
            placeholder="0"
          />
        </div>
        <button type="submit" className="btn btn--primary set-form__submit">
          Satz speichern
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
