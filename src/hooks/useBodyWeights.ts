import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import type { BodyWeightEntry } from '../db/types';

/** Alle Gewichtsmessungen, chronologisch. */
export function useBodyWeights(): BodyWeightEntry[] | undefined {
  return useLiveQuery(() => db.bodyWeights.orderBy('measuredAt').toArray(), []);
}
