import { db } from './db';
import type { PlanExercise } from './types';

export interface PlanDraft {
  id?: string;
  name: string;
  exercises: PlanExercise[];
}

export async function savePlan(draft: PlanDraft): Promise<string> {
  const name = draft.name.trim();
  if (draft.id !== undefined) {
    await db.workoutPlans.update(draft.id, { name, exercises: draft.exercises });
    return draft.id;
  }
  return db.workoutPlans.add({ name, exercises: draft.exercises, createdAt: new Date() });
}

/** Sessions behalten Name und Übungsliste als Snapshot, die Historie bleibt also erhalten. */
export function deletePlan(id: string): Promise<void> {
  return db.workoutPlans.delete(id);
}
