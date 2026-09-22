import { db } from './db';
import type { WorkoutPlan, WorkoutSession } from './types';

/** `endedAt: null` ist nicht indizierbar, daher ein Scan – bei ein paar hundert Sessions unkritisch. */
export function getActiveSession(): Promise<WorkoutSession | undefined> {
  return db.workoutSessions.filter((s) => s.endedAt === null).first();
}

export const FREE_SESSION_NAME = 'Freies Training';

function planSnapshot(plan: WorkoutPlan | null): Pick<WorkoutSession, 'planId' | 'planName' | 'exercises'> {
  return {
    planId: plan?.id ?? null,
    planName: plan?.name ?? FREE_SESSION_NAME,
    exercises: plan?.exercises.map((e) => ({ ...e })) ?? [],
  };
}

/** Startet eine Session aus einem Plan und beendet dabei eine eventuell noch laufende. */
export function startSession(plan: WorkoutPlan): Promise<string> {
  return db.transaction('rw', db.workoutSessions, async () => {
    const now = new Date();
    await db.workoutSessions.filter((s) => s.endedAt === null).modify({ endedAt: now });
    return db.workoutSessions.add({ ...planSnapshot(plan), startedAt: now, endedAt: null });
  });
}

/** Legt ein bereits absolviertes Training an (Nachtragen). `plan: null` = ohne Plan. */
export function createPastSession(
  plan: WorkoutPlan | null,
  startedAt: Date,
  durationMinutes: number,
): Promise<string> {
  return db.workoutSessions.add({
    ...planSnapshot(plan),
    startedAt,
    endedAt: new Date(startedAt.getTime() + durationMinutes * 60_000),
  });
}

export async function finishSession(id: string): Promise<void> {
  await db.workoutSessions.update(id, { endedAt: new Date() });
}

export function deleteSession(id: string): Promise<void> {
  return db.transaction('rw', db.workoutSessions, db.sets, async () => {
    await db.sets.where('sessionId').equals(id).delete();
    await db.workoutSessions.delete(id);
  });
}

export function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  targetSets: number,
): Promise<void> {
  return db.transaction('rw', db.workoutSessions, async () => {
    const session = await db.workoutSessions.get(sessionId);
    if (!session || session.exercises.some((e) => e.exerciseId === exerciseId)) return;
    await db.workoutSessions.update(sessionId, {
      exercises: [...session.exercises, { exerciseId, targetSets }],
    });
  });
}

export function addSet(
  sessionId: string,
  exerciseId: string,
  weightKg: number,
  reps: number,
): Promise<string> {
  return db.transaction('rw', db.workoutSessions, db.sets, async () => {
    const session = await db.workoutSessions.get(sessionId);
    if (!session) throw new Error('Session nicht gefunden');

    let createdAt = new Date();
    if (session.endedAt !== null) {
      // Nachgetragene bzw. nachträglich ergänzte Session: Den Satz zeitlich in die Session legen
      // (je 1 s nach dem letzten), sonst hielte "Letztes Mal" ihn für den neuesten Satz der Übung.
      const sessionSets = await db.sets.where('sessionId').equals(sessionId).toArray();
      const lastTime = Math.max(
        session.startedAt.getTime(),
        ...sessionSets.map((s) => s.createdAt.getTime()),
      );
      createdAt = new Date(lastTime + 1000);
    }
    return db.sets.add({ sessionId, exerciseId, weightKg, reps, createdAt });
  });
}

export function deleteSet(id: string): Promise<void> {
  return db.sets.delete(id);
}
