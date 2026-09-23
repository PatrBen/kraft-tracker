import type { ExerciseMeasure, WorkoutSet } from '../db/types';
import { formatKg, formatNumber, formatSeconds } from './format';

type SetValues = Pick<WorkoutSet, 'weightKg' | 'reps'>;

/** Ausführlich für Satzlisten: "62,5 kg × 8" · "8 Wdh." / "8 Wdh. · +10 kg" · "45 s" / "45 s · +10 kg". */
export function formatSet(set: SetValues, measure: ExerciseMeasure): string {
  const extra = set.weightKg > 0 ? ` · +${formatKg(set.weightKg)}` : '';
  switch (measure) {
    case 'time':
      return `${formatSeconds(set.reps)}${extra}`;
    case 'bodyweight':
      return `${set.reps} Wdh.${extra}`;
    case 'reps':
      return `${formatKg(set.weightKg)} × ${set.reps}`;
  }
}

/** Kompakt für Aufzählungen ("Letztes Mal"): "62,5 × 8" · "8 Wdh." / "8 Wdh. (+10 kg)" · "45 s". */
export function formatSetShort(set: SetValues, measure: ExerciseMeasure): string {
  const extra = set.weightKg > 0 ? ` (+${formatKg(set.weightKg)})` : '';
  switch (measure) {
    case 'time':
      return `${formatSeconds(set.reps)}${extra}`;
    case 'bodyweight':
      return `${set.reps} Wdh.${extra}`;
    case 'reps':
      return `${formatNumber(set.weightKg)} × ${set.reps}`;
  }
}

/** Statistik-Kennzahl: geschätztes 1RM "79,2 kg" bzw. Haltezeit "45 s". */
export function formatScore(value: number, measure: ExerciseMeasure): string {
  return measure === 'time' ? formatSeconds(value) : formatKg(value);
}
