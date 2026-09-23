import { useId, useMemo, useRef } from 'react';
import { useExerciseIdsWithSets, useExerciseStats } from '../../hooks/useExerciseStats';
import { useExercises } from '../../hooks/useExercises';
import type { Navigate } from '../../hooks/useHashRoute';
import { exerciseMeasure } from '../../utils/exerciseMeasure';
import { EmptyState } from '../common/EmptyState';
import { ExerciseStats } from './ExerciseStats';

interface ExerciseStatsViewProps {
  /** Gewählte Übung aus der URL, sonst die erste mit Daten. */
  exerciseId: string | null;
  navigate: Navigate;
}

export function ExerciseStatsView({ exerciseId, navigate }: ExerciseStatsViewProps) {
  const exercises = useExercises();
  const idsWithSets = useExerciseIdsWithSets();
  const selectId = useId();

  const options = useMemo(
    () => exercises?.filter((e) => idsWithSets?.has(e.id) || e.id === exerciseId) ?? [],
    [exercises, idsWithSets, exerciseId],
  );
  const selected = options.find((e) => e.id === exerciseId) ?? options[0];
  const measure = exerciseMeasure(selected);
  const stats = useExerciseStats(selected?.id ?? null, measure);

  // Beim Übungswechsel die alte Darstellung halten, bis die neuen Daten da sind – kein Layout-Sprung.
  const lastShownRef = useRef({ stats, measure });
  if (stats) lastShownRef.current = { stats, measure };
  const shown = lastShownRef.current;

  if (exercises === undefined || idsWithSets === undefined) return null;

  if (options.length === 0) {
    return (
      <EmptyState title="Noch keine Daten">
        <p>Sobald du im Tagebuch Sätze einträgst, siehst du hier deine Entwicklung.</p>
        <button type="button" className="btn btn--primary" onClick={() => navigate('journal')}>
          Zum Tagebuch
        </button>
      </EmptyState>
    );
  }

  return (
    <>
      <div className="filter-row">
        <label htmlFor={selectId}>Übung</label>
        <select
          id={selectId}
          className="input input--select"
          value={selected?.id ?? ''}
          onChange={(e) => navigate('stats', e.target.value)}
        >
          {options.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {shown.stats && (
        <div className={stats ? undefined : 'is-refreshing'}>
          <ExerciseStats data={shown.stats} measure={shown.measure} />
        </div>
      )}
    </>
  );
}
