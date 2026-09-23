import { useMemo } from 'react';
import { deleteSession, finishSession } from '../../db/sessions';
import type { WorkoutSet } from '../../db/types';
import { useBodyWeights } from '../../hooks/useBodyWeights';
import { useExerciseMap } from '../../hooks/useExercises';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useSession, useSessionSets } from '../../hooks/useSessions';
import { bodyWeightAt } from '../../utils/bodyWeight';
import { exerciseMeasure } from '../../utils/exerciseMeasure';
import { formatDate, formatDurationMinutes, formatTime } from '../../utils/format';
import { EmptyState } from '../common/EmptyState';
import { RestTimerSettings } from '../timer/RestTimerSettings';
import { AddSessionExercise } from './AddSessionExercise';
import { ExerciseLog } from './ExerciseLog';
import { SessionExport } from './SessionExport';

interface SessionViewProps {
  sessionId: string;
  onBack: () => void;
  onOpenStats: (exerciseId: string) => void;
}

export function SessionView({ sessionId, onBack, onOpenStats }: SessionViewProps) {
  const session = useSession(sessionId);
  const sets = useSessionSets(sessionId);
  const exerciseMap = useExerciseMap();
  const bodyWeights = useBodyWeights();
  const timer = useRestTimer();

  const setsByExercise = useMemo(() => {
    const map = new Map<string, WorkoutSet[]>();
    for (const set of sets ?? []) {
      const list = map.get(set.exerciseId);
      if (list) list.push(set);
      else map.set(set.exerciseId, [set]);
    }
    return map;
  }, [sets]);

  if (
    session === undefined ||
    sets === undefined ||
    exerciseMap === undefined ||
    bodyWeights === undefined
  ) {
    return null;
  }

  if (session === null) {
    return (
      <section>
        <button type="button" className="btn btn--ghost back-link" onClick={onBack}>
          ← Übersicht
        </button>
        <EmptyState title="Training nicht gefunden" />
      </section>
    );
  }

  const isActive = session.endedAt === null;
  const targetTotal = session.exercises.reduce((sum, e) => sum + e.targetSets, 0);

  const handleFinish = async () => {
    if (sets.length === 0) {
      if (!window.confirm('Es wurden noch keine Sätze eingetragen. Training verwerfen?')) return;
      await deleteSession(session.id);
    } else {
      await finishSession(session.id);
    }
    timer.stop();
    onBack();
  };

  const handleDelete = async () => {
    const question = `Training „${session.planName}“ vom ${formatDate(session.startedAt)} inkl. ${sets.length} Sätzen endgültig löschen?`;
    if (!window.confirm(question)) return;
    await deleteSession(session.id);
    if (isActive) timer.stop();
    onBack();
  };

  return (
    <section>
      <button type="button" className="btn btn--ghost back-link" onClick={onBack}>
        ← Übersicht
      </button>

      <header className="session-header">
        <div>
          <h1>{session.planName}</h1>
          <p className="muted session-header__meta">
            {formatDate(session.startedAt)}, {formatTime(session.startedAt)} Uhr ·{' '}
            {session.endedAt ? (
              formatDurationMinutes(session.startedAt, session.endedAt)
            ) : (
              <span className="badge badge--live">läuft</span>
            )}{' '}
            · {sets.length} / {targetTotal} Sätze
          </p>
        </div>
        <div className="session-header__actions">
          {isActive && (
            <button type="button" className="btn btn--primary" onClick={handleFinish}>
              Training beenden
            </button>
          )}
          <button type="button" className="btn btn--ghost btn--danger" onClick={handleDelete}>
            Löschen
          </button>
        </div>
      </header>

      {isActive && <RestTimerSettings />}

      <div className="exercise-logs">
        {session.exercises.map((pe) => (
          <ExerciseLog
            key={pe.exerciseId}
            session={session}
            planExercise={pe}
            exerciseName={exerciseMap.get(pe.exerciseId)?.name ?? 'Unbekannte Übung'}
            measure={exerciseMeasure(exerciseMap.get(pe.exerciseId))}
            bodyWeight={bodyWeightAt(bodyWeights, session.startedAt)}
            sets={setsByExercise.get(pe.exerciseId) ?? []}
            isActive={isActive}
            onOpenStats={() => onOpenStats(pe.exerciseId)}
          />
        ))}
      </div>

      <AddSessionExercise session={session} />
      {sets.length > 0 && <SessionExport session={session} />}
    </section>
  );
}
