import { useId, useMemo, useRef } from 'react';
import { useExerciseIdsWithSets, useExerciseStats } from '../../hooks/useExerciseStats';
import { useExercises } from '../../hooks/useExercises';
import type { Navigate } from '../../hooks/useHashRoute';
import { EmptyState } from '../common/EmptyState';
import { ExerciseStats } from './ExerciseStats';

interface StatsPageProps {
  /** Gewählte Übung aus der URL (`#/stats/3`), sonst die erste mit Daten. */
  exerciseId: string | null;
  navigate: Navigate;
}

export function StatsPage({ exerciseId, navigate }: StatsPageProps) {
  const exercises = useExercises();
  const idsWithSets = useExerciseIdsWithSets();
  const selectId = useId();

  const options = useMemo(
    () => exercises?.filter((e) => idsWithSets?.has(e.id) || e.id === exerciseId) ?? [],
    [exercises, idsWithSets, exerciseId],
  );
  const selectedId = exerciseId ?? options[0]?.id ?? null;
  const stats = useExerciseStats(selectedId);

  // Beim Übungswechsel die alte Darstellung halten, bis die neuen Daten da sind – kein Layout-Sprung.
  const lastStatsRef = useRef(stats);
  if (stats) lastStatsRef.current = stats;
  const shownStats = stats ?? lastStatsRef.current;

  if (exercises === undefined || idsWithSets === undefined) return null;

  return (
    <section>
      <div className="page-header">
        <h1>Statistik</h1>
      </div>

      {options.length === 0 ? (
        <EmptyState title="Noch keine Daten">
          <p>Sobald du im Tagebuch Sätze einträgst, siehst du hier deine Entwicklung.</p>
          <button type="button" className="btn btn--primary" onClick={() => navigate('journal')}>
            Zum Tagebuch
          </button>
        </EmptyState>
      ) : (
        <>
          <div className="filter-row">
            <label htmlFor={selectId}>Übung</label>
            <select
              id={selectId}
              className="input input--select"
              value={selectedId ?? ''}
              onChange={(e) => navigate('stats', e.target.value)}
            >
              {options.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>

          {shownStats && (
            <div className={stats ? undefined : 'is-refreshing'}>
              <ExerciseStats data={shownStats} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
