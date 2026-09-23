import { useState } from 'react';
import { deletePlan } from '../../db/plans';
import type { WorkoutPlan } from '../../db/types';
import { useExerciseMap } from '../../hooks/useExercises';
import { STATS_PUSHUPS, STATS_WEIGHT, type Navigate } from '../../hooks/useHashRoute';
import { useStartWorkout } from '../../hooks/useStartWorkout';
import { useWorkoutPlans } from '../../hooks/useWorkoutPlans';
import { EmptyState } from '../common/EmptyState';
import { BodyWeightCard } from '../daily/BodyWeightCard';
import { PushupCounter } from '../daily/PushupCounter';
import { PlanCard } from './PlanCard';
import { PlanEditor } from './PlanEditor';

export function PlansPage({ navigate }: { navigate: Navigate }) {
  const plans = useWorkoutPlans();
  const exerciseMap = useExerciseMap();
  const startWorkout = useStartWorkout(navigate);
  const [editing, setEditing] = useState<WorkoutPlan | 'new' | null>(null);

  if (editing) {
    return <PlanEditor plan={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />;
  }

  async function handleDelete(plan: WorkoutPlan) {
    if (window.confirm(`Plan „${plan.name}“ löschen? Bereits absolvierte Trainings bleiben erhalten.`)) {
      await deletePlan(plan.id);
    }
  }

  return (
    <section>
      <h1 className="visually-hidden">Pläne</h1>
      <div className="daily-grid">
        <PushupCounter onOpenStats={() => navigate('stats', STATS_PUSHUPS)} />
        <BodyWeightCard onOpenStats={() => navigate('stats', STATS_WEIGHT)} />
      </div>

      <div className="page-header page-header--spaced">
        <h2 className="page-title">Trainingspläne</h2>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          + Neuer Plan
        </button>
      </div>

      {plans === undefined || exerciseMap === undefined ? null : plans.length === 0 ? (
        <EmptyState title="Noch keine Trainingspläne">
          <p>Leg einen Plan an, z. B. „Push-Tag“ mit Bankdrücken und Schulterdrücken à 3 Sätze.</p>
        </EmptyState>
      ) : (
        <ul className="card-list">
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanCard
                plan={plan}
                exerciseMap={exerciseMap}
                onStart={() => startWorkout(plan)}
                onEdit={() => setEditing(plan)}
                onDelete={() => handleDelete(plan)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
