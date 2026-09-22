import { useCallback } from 'react';
import { getActiveSession, startSession } from '../db/sessions';
import type { WorkoutPlan } from '../db/types';
import { requestPersistentStorage } from '../utils/storage';
import type { Navigate } from './useHashRoute';

/** Startet ein Training aus einem Plan (mit Rückfrage, falls schon eins läuft) und öffnet es. */
export function useStartWorkout(navigate: Navigate): (plan: WorkoutPlan) => Promise<void> {
  return useCallback(
    async (plan) => {
      const active = await getActiveSession();
      if (
        active &&
        !window.confirm(
          `Es läuft bereits ein Training („${active.planName}“). Dieses beenden und „${plan.name}“ starten?`,
        )
      ) {
        return;
      }
      requestPersistentStorage();
      const sessionId = await startSession(plan);
      navigate('journal', sessionId);
    },
    [navigate],
  );
}
