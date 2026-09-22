import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { WorkoutPlan } from '../db/types';

export function useWorkoutPlans(): WorkoutPlan[] | undefined {
  return useLiveQuery(
    async () => (await db.workoutPlans.toArray()).sort((a, b) => a.name.localeCompare(b.name, 'de')),
    [],
  );
}
