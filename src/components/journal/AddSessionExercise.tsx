import { useId, useState, type FormEvent } from 'react';
import { findOrCreateExercise, normalizeExerciseName } from '../../db/exercises';
import { addExerciseToSession } from '../../db/sessions';
import type { WorkoutSession } from '../../db/types';
import { ExerciseNameInput } from '../common/ExerciseNameInput';
import { Stepper } from '../common/Stepper';

/** Spontan eine Übung ins laufende (oder vergangene) Training aufnehmen, ohne den Plan zu ändern. */
export function AddSessionExercise({ session }: { session: WorkoutSession }) {
  // Ein Training ohne Plan hat anfangs keine Übungen – dann gleich das Formular zeigen.
  const [open, setOpen] = useState(session.exercises.length === 0);
  const [name, setName] = useState('');
  const [targetSets, setTargetSets] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();

  if (!open) {
    return (
      <button type="button" className="btn btn--ghost add-toggle" onClick={() => setOpen(true)}>
        + Übung hinzufügen
      </button>
    );
  }

  const close = () => {
    setOpen(false);
    setName('');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const exerciseName = normalizeExerciseName(name);
    if (!exerciseName) return;

    const exerciseId = await findOrCreateExercise(exerciseName);
    if (session.exercises.some((pe) => pe.exerciseId === exerciseId)) {
      setError(`„${exerciseName}“ ist bereits in diesem Training.`);
      return;
    }
    await addExerciseToSession(session.id, exerciseId, targetSets);
    close();
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="inline-form">
        <div className="field inline-form__grow">
          <label htmlFor={inputId}>Übung hinzufügen</label>
          <ExerciseNameInput id={inputId} value={name} onChange={setName} />
        </div>
        <div className="field">
          <span className="field__label">Ziel-Sätze</span>
          <Stepper label="Ziel-Sätze" value={targetSets} onChange={setTargetSets} />
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={!name.trim()}>
          Hinzufügen
        </button>
        <button type="button" className="btn btn--ghost" onClick={close}>
          Abbrechen
        </button>
      </div>
    </form>
  );
}
