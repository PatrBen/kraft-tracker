import type { ExerciseMeasure, WorkoutSet } from '../db/types';
import { formatKg, formatNumber, formatSeconds } from './format';

type SetValues = Pick<WorkoutSet, 'weightKg' | 'reps'>;

/** Ausführlich für Satzlisten: "62,5 kg × 8" bzw. "45 s" / "45 s · +10 kg". */
export function formatSet(set: SetValues, measure: ExerciseMeasure): string {
  if (measure === 'time') {
    return set.weightKg > 0 ? `${formatSeconds(set.reps)} · +${formatKg(set.weightKg)}` : formatSeconds(set.reps);
  }
  return `${formatKg(set.weightKg)} × ${set.reps}`;
}

/** Kompakt für Aufzählungen ("Letztes Mal"): "62,5 × 8" bzw. "45 s" / "45 s (+10 kg)". */
export function formatSetShort(set: SetValues, measure: ExerciseMeasure): string {
  if (measure === 'time') {
    return set.weightKg > 0 ? `${formatSeconds(set.reps)} (+${formatKg(set.weightKg)})` : formatSeconds(set.reps);
  }
  return `${formatNumber(set.weightKg)} × ${set.reps}`;
}

/** Statistik-Kennzahl: geschätztes 1RM "79,2 kg" bzw. Haltezeit "45 s". */
export function formatScore(value: number, measure: ExerciseMeasure): string {
  return measure === 'time' ? formatSeconds(value) : formatKg(value);
}
