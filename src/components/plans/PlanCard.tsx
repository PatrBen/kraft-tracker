import type { Exercise, WorkoutPlan } from '../../db/types';
import { pluralize } from '../../utils/format';

interface PlanCardProps {
  plan: WorkoutPlan;
  exerciseMap: Map<string, Exercise>;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PlanCard({ plan, exerciseMap, onStart, onEdit, onDelete }: PlanCardProps) {
  const totalSets = plan.exercises.reduce((sum, e) => sum + e.targetSets, 0);

  return (
    <article className="card">
      <header className="card__header">
        <h2 className="card__title">{plan.name}</h2>
        <span className="muted">
          {pluralize(plan.exercises.length, 'Übung', 'Übungen')} · {pluralize(totalSets, 'Satz', 'Sätze')}
        </span>
      </header>

      <ol className="plan-summary">
        {plan.exercises.map((pe) => (
          <li key={pe.exerciseId}>
            <span>{exerciseMap.get(pe.exerciseId)?.name ?? 'Unbekannte Übung'}</span>
            <span className="muted">{pluralize(pe.targetSets, 'Satz', 'Sätze')}</span>
          </li>
        ))}
      </ol>

      <div className="card__actions">
        <button type="button" className="btn btn--primary" onClick={onStart}>
          Training starten
        </button>
        <button type="button" className="btn" onClick={onEdit}>
          Bearbeiten
        </button>
        <button type="button" className="btn btn--ghost btn--danger" onClick={onDelete}>
          Löschen
        </button>
      </div>
    </article>
  );
}
