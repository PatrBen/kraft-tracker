import { useEffect, useId, useState, type FormEvent } from 'react';
import { addSet, deleteSet } from '../../db/sessions';
import type { ExerciseMeasure, PlanExercise, WorkoutSession, WorkoutSet } from '../../db/types';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useLastPerformance } from '../../hooks/useSessions';
import type { BodyWeightAt } from '../../utils/bodyWeight';
import { formatDecimalInput, formatKg, formatShortDate, parseDecimal } from '../../utils/format';
import { setScore } from '../../utils/oneRepMax';
import { formatSet, formatSetShort } from '../../utils/setFormat';
import { unlockAudio } from '../../utils/signal';

const FORM: Record<ExerciseMeasure, { weight: string; value: string; max: number; error: string }> = {
  reps: {
    weight: 'Gewicht (kg)',
    value: 'Wiederholungen',
    max: 100,
    error: 'Bitte gültige Wiederholungen eingeben (1–100).',
  },
  bodyweight: {
    weight: 'Zusatzgewicht (kg)',
    value: 'Wiederholungen',
    max: 100,
    error: 'Bitte gültige Wiederholungen eingeben (1–100).',
  },
  repsOnly: {
    weight: 'Zusatzgewicht (kg)',
    value: 'Wiederholungen',
    max: 500,
    error: 'Bitte gültige Wiederholungen eingeben (1–500).',
  },
  time: {
    weight: 'Zusatzgewicht (kg)',
    value: 'Sekunden',
    max: 3600,
    error: 'Bitte eine Haltezeit in Sekunden eingeben (1–3600).',
  },
};

interface ExerciseLogProps {
  session: WorkoutSession;
  planExercise: PlanExercise;
  exerciseName: string;
  measure: ExerciseMeasure;
  /** Körpergewicht am Trainingstag – nur für Körpergewichtsübungen relevant. */
  bodyWeight: BodyWeightAt;
  sets: WorkoutSet[];
  isActive: boolean;
  onOpenStats: () => void;
}

export function ExerciseLog({
  session,
  planExercise,
  exerciseName,
  measure,
  bodyWeight,
  sets,
  isActive,
  onOpenStats,
}: ExerciseLogProps) {
  const form = FORM[measure];
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

    // Bei Halte- und Körpergewichtsübungen ist das Zusatzgewicht optional.
    const weightKg = measure !== 'reps' && weight.trim() === '' ? 0 : parseDecimal(weight);
    const repCount = Number(reps);
    if (!Number.isFinite(weightKg) || weightKg < 0 || weightKg > 1000) {
      setError('Bitte ein gültiges Gewicht eingeben.');
      return;
    }
    if (!Number.isInteger(repCount) || repCount < 1 || repCount > form.max) {
      setError(form.error);
      return;
    }

    setError(null);
    await addSet(session.id, planExercise.exerciseId, weightKg, repCount);
    if (isActive) timer.start();
  };

  const handleDeleteSet = async (set: WorkoutSet, index: number) => {
    if (window.confirm(`Satz ${index + 1} (${formatSet(set, measure)}) löschen?`)) {
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
          {lastPerformance.sets.map((s) => formatSetShort(s, measure)).join(' · ')}
        </p>
      )}
      {measure === 'bodyweight' && (
        <p className="last-performance">
          Gerechnet mit Körpergewicht {formatKg(bodyWeight.weightKg)}
          {bodyWeight.measuredAt
            ? ` (Messung vom ${formatShortDate(bodyWeight.measuredAt)})`
            : ' (Standardwert – trag dein Gewicht auf der Pläne-Seite ein)'}
        </p>
      )}

      <ol className="set-list">
        {sets.map((set, index) => (
          <li key={set.id} className="set-row">
            <span className="set-row__index">{index + 1}</span>
            <span className="set-row__main">{formatSet(set, measure)}</span>
            <span className="set-row__meta">
              {(measure === 'reps' || measure === 'bodyweight') &&
                `1RM ≈ ${formatKg(setScore(set, measure, bodyWeight.weightKg))}`}
            </span>
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
          <label htmlFor={weightId}>{form.weight}</label>
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
          <label htmlFor={repsId}>{form.value}</label>
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
