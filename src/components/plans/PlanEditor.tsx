import { useId, useState, type FormEvent } from 'react';
import { findOrCreateExercise, normalizeExerciseName, setExerciseMeasure } from '../../db/exercises';
import { savePlan } from '../../db/plans';
import type { ExerciseMeasure, PlanExercise, WorkoutPlan } from '../../db/types';
import { useExerciseMap } from '../../hooks/useExercises';
import { exerciseMeasure } from '../../utils/exerciseMeasure';
import { ExerciseNameInput } from '../common/ExerciseNameInput';
import { Stepper } from '../common/Stepper';

const MEASURE_OPTIONS: { value: ExerciseMeasure; label: string }[] = [
  { value: 'reps', label: 'Gewicht' },
  { value: 'bodyweight', label: 'Körpergewicht' },
  { value: 'time', label: 'Sekunden' },
];

interface PlanEditorProps {
  /** `null` = neuen Plan anlegen. */
  plan: WorkoutPlan | null;
  onDone: () => void;
}

export function PlanEditor({ plan, onDone }: PlanEditorProps) {
  const exerciseMap = useExerciseMap();
  const [name, setName] = useState(plan?.name ?? '');
  const [items, setItems] = useState<PlanExercise[]>(plan?.exercises ?? []);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newTargetSets, setNewTargetSets] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nameInputId = useId();
  const exerciseInputId = useId();

  /** Hängt die im Eingabefeld getippte Übung an; `null` bei Duplikat. */
  async function appendPendingExercise(current: PlanExercise[]): Promise<PlanExercise[] | null> {
    const exerciseName = normalizeExerciseName(newExerciseName);
    if (!exerciseName) return current;

    const exerciseId = await findOrCreateExercise(exerciseName);
    if (current.some((item) => item.exerciseId === exerciseId)) {
      setError(`„${exerciseName}“ ist bereits im Plan.`);
      return null;
    }
    setNewExerciseName('');
    setError(null);
    return [...current, { exerciseId, targetSets: newTargetSets }];
  }

  async function handleAddExercise(e: FormEvent) {
    e.preventDefault();
    const next = await appendPendingExercise(items);
    if (next) setItems(next);
  }

  function updateTargetSets(index: number, targetSets: number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, targetSets } : item)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    setItems((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Bitte gib dem Plan einen Namen.');
      return;
    }
    // Eine getippte, aber nicht per "Hinzufügen" übernommene Übung nicht verlieren.
    const exercises = await appendPendingExercise(items);
    if (!exercises) return;
    if (exercises.length === 0) {
      setError('Füge mindestens eine Übung hinzu.');
      return;
    }

    setSaving(true);
    try {
      await savePlan({ id: plan?.id, name, exercises });
      onDone();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <div className="page-header">
        <h1>{plan ? 'Plan bearbeiten' : 'Neuer Plan'}</h1>
      </div>

      <div className="field">
        <label htmlFor={nameInputId}>Name des Plans</label>
        <input
          id={nameInputId}
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z. B. Push-Tag"
          autoFocus={!plan}
        />
      </div>

      <h2 className="section-title">Übungen</h2>
      {items.length === 0 ? (
        <p className="muted">Noch keine Übungen – füge unten die erste hinzu.</p>
      ) : (
        <ol className="editor-list">
          {items.map((item, index) => {
            const exercise = exerciseMap?.get(item.exerciseId);
            const exerciseName = exercise?.name ?? '…';
            const measure = exerciseMeasure(exercise);
            return (
              <li key={item.exerciseId} className="editor-row">
                <span className="editor-row__index">{index + 1}</span>
                <span className="editor-row__name">{exerciseName}</span>
                <div className="editor-row__controls">
                  <Stepper
                    label={`Ziel-Sätze ${exerciseName}`}
                    value={item.targetSets}
                    onChange={(value) => updateTargetSets(index, value)}
                  />
                  <select
                    className="measure-select"
                    value={measure}
                    onChange={(e) =>
                      setExerciseMeasure(item.exerciseId, e.target.value as ExerciseMeasure)
                    }
                    disabled={!exercise}
                    aria-label={`Messart für ${exerciseName}`}
                    title="Wie wird die Übung gemessen?"
                  >
                    {MEASURE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="editor-row__actions">
                  <button
                    type="button"
                    className="btn btn--icon btn--ghost"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    aria-label={`${exerciseName} nach oben`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="btn btn--icon btn--ghost"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label={`${exerciseName} nach unten`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="btn btn--icon btn--ghost btn--danger"
                    onClick={() => removeItem(index)}
                    aria-label={`${exerciseName} entfernen`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <form className="inline-form" onSubmit={handleAddExercise}>
        <div className="field inline-form__grow">
          <label htmlFor={exerciseInputId}>Übung hinzufügen</label>
          <ExerciseNameInput
            id={exerciseInputId}
            value={newExerciseName}
            onChange={setNewExerciseName}
          />
        </div>
        <div className="field">
          <span className="field__label">Ziel-Sätze</span>
          <Stepper label="Ziel-Sätze" value={newTargetSets} onChange={setNewTargetSets} />
        </div>
        <button type="submit" className="btn" disabled={!newExerciseName.trim()}>
          Hinzufügen
        </button>
      </form>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving}>
          Speichern
        </button>
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Abbrechen
        </button>
      </div>
    </section>
  );
}
