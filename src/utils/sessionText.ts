import type { ExerciseMeasure, WorkoutSet } from '../db/types';
import { formatDate, formatKg, formatNumber, formatSeconds, formatTime, formatDurationMinutes } from './format';
import { epley1RM, setScore } from './oneRepMax';
import { formatScore } from './setFormat';

type SetValues = Pick<WorkoutSet, 'weightKg' | 'reps'>;

export interface SessionTextExercise {
  name: string;
  measure: ExerciseMeasure;
  /** 0 = nicht im Plan, spontan ergänzt. */
  targetSets: number;
  sets: SetValues[];
  previous: { date: Date; sets: SetValues[] } | null;
}

export interface SessionTextInput {
  planName: string;
  startedAt: Date;
  endedAt: Date | null;
  exercises: SessionTextExercise[];
  bodyWeight: { weightKg: number; measuredAt: Date } | null;
}

const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });

function describeSet(set: SetValues, measure: ExerciseMeasure): string {
  if (measure === 'time') {
    const extra = set.weightKg > 0 ? ` mit ${formatKg(set.weightKg)} Zusatzgewicht` : '';
    return `${formatSeconds(set.reps)}${extra}`;
  }
  return `${formatKg(set.weightKg)} × ${set.reps} Wdh. (geschätztes 1RM ${formatKg(epley1RM(set.weightKg, set.reps))})`;
}

function shortSet(set: SetValues, measure: ExerciseMeasure): string {
  if (measure === 'time') {
    return set.weightKg > 0 ? `${formatSeconds(set.reps)} (+${formatKg(set.weightKg)})` : formatSeconds(set.reps);
  }
  return `${formatKg(set.weightKg)} × ${set.reps}`;
}

function volume(sets: SetValues[]): number {
  return sets.reduce((sum, s) => sum + s.weightKg * s.reps, 0);
}

/**
 * Ein Training als gut lesbarer Klartext – gedacht zum Weitergeben an Claude o. ä.
 * Enthält Sätze, Bestwerte, Volumen und den Vergleich zum letzten Mal.
 */
export function sessionToText(input: SessionTextInput): string {
  const lines: string[] = [];
  const { startedAt, endedAt } = input;

  lines.push('Kraft-Tracker – Trainingsprotokoll', '');
  lines.push(`Training: ${input.planName}`);
  lines.push(
    `Datum: ${weekday.format(startedAt)}, ${formatDate(startedAt)}, ` +
      (endedAt
        ? `${formatTime(startedAt)}–${formatTime(endedAt)} Uhr (${formatDurationMinutes(startedAt, endedAt)})`
        : `ab ${formatTime(startedAt)} Uhr (läuft noch)`),
  );
  if (input.bodyWeight) {
    lines.push(
      `Körpergewicht: ${formatKg(input.bodyWeight.weightKg)} (gemessen am ${formatDate(input.bodyWeight.measuredAt)})`,
    );
  }

  let totalSets = 0;
  let totalVolume = 0;

  for (const exercise of input.exercises) {
    const { sets, measure } = exercise;
    lines.push('');
    const planned =
      exercise.targetSets > 0
        ? `${sets.length} von ${exercise.targetSets} geplanten Sätzen`
        : `${sets.length} ${sets.length === 1 ? 'Satz' : 'Sätze'} (nicht im Plan)`;
    lines.push(`${exercise.name} – ${sets.length > 0 ? planned : `keine Sätze eingetragen (${exercise.targetSets} geplant)`}`);

    sets.forEach((set, i) => lines.push(`  Satz ${i + 1}: ${describeSet(set, measure)}`));

    if (sets.length > 0) {
      const best = sets.reduce((a, b) => (setScore(b, measure) > setScore(a, measure) ? b : a));
      lines.push(
        measure === 'time'
          ? `  Längste Haltezeit: ${formatSeconds(best.reps)}`
          : `  Bester Satz: ${shortSet(best, measure)} → geschätztes 1RM ${formatScore(setScore(best, measure), measure)}`,
      );
      if (measure === 'reps') {
        lines.push(`  Volumen: ${formatNumber(volume(sets))} kg`);
        totalVolume += volume(sets);
      }
      totalSets += sets.length;
    }

    if (exercise.previous) {
      const previousSets = exercise.previous.sets.map((s) => shortSet(s, measure)).join(', ');
      lines.push(`  Letztes Mal (${formatDate(exercise.previous.date)}): ${previousSets}`);
    } else {
      lines.push('  Letztes Mal: – (erstes Training dieser Übung)');
    }
  }

  lines.push('', 'Zusammenfassung');
  lines.push(`  Sätze gesamt: ${totalSets}`);
  lines.push(`  Gesamtvolumen: ${formatNumber(totalVolume)} kg (Gewicht × Wiederholungen)`);
  lines.push('');
  lines.push('Hinweise: Das 1RM ist nach Epley geschätzt: Gewicht × (1 + Wiederholungen / 30).');
  lines.push('Halteübungen (z. B. Deadhang) sind in Sekunden angegeben und zählen nicht zum Volumen.');

  return `${lines.join('\n')}\n`;
}

/** Dateiname wie "training-2026-09-22-push-tag.txt". */
export function sessionFileName(planName: string, startedAt: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${startedAt.getFullYear()}-${pad(startedAt.getMonth() + 1)}-${pad(startedAt.getDate())}`;
  const slug = planName
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `training-${date}${slug ? `-${slug}` : ''}.txt`;
}
