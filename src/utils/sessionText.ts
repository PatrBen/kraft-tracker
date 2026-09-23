import type { ExerciseMeasure, WorkoutSet } from '../db/types';
import type { BodyWeightAt } from './bodyWeight';
import { formatDate, formatKg, formatNumber, formatSeconds, formatTime, formatDurationMinutes } from './format';
import { setScore } from './oneRepMax';
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
  /** Körpergewicht am Trainingstag; `measuredAt: null` = Standardwert, noch keine Messung. */
  bodyWeight: BodyWeightAt;
}

const weekday = new Intl.DateTimeFormat('de-DE', { weekday: 'short' });

function describeSet(set: SetValues, measure: ExerciseMeasure, bodyWeightKg: number): string {
  const oneRepMax = `geschätztes 1RM ${formatKg(setScore(set, measure, bodyWeightKg))}`;
  switch (measure) {
    case 'time':
      return `${formatSeconds(set.reps)}${set.weightKg > 0 ? ` mit ${formatKg(set.weightKg)} Zusatzgewicht` : ''}`;
    case 'bodyweight':
      return `${set.reps} Wdh. mit Körpergewicht${set.weightKg > 0 ? ` + ${formatKg(set.weightKg)} Zusatzgewicht` : ''} (${oneRepMax})`;
    case 'reps':
      return `${formatKg(set.weightKg)} × ${set.reps} Wdh. (${oneRepMax})`;
  }
}

function shortSet(set: SetValues, measure: ExerciseMeasure): string {
  const extra = set.weightKg > 0 ? ` (+${formatKg(set.weightKg)})` : '';
  switch (measure) {
    case 'time':
      return `${formatSeconds(set.reps)}${extra}`;
    case 'bodyweight':
      return `${set.reps} Wdh.${extra}`;
    case 'reps':
      return `${formatKg(set.weightKg)} × ${set.reps}`;
  }
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
  const bodyWeightKg = input.bodyWeight.weightKg;
  const hasBodyweightExercise = input.exercises.some((e) => e.measure === 'bodyweight' && e.sets.length > 0);
  if (input.bodyWeight.measuredAt) {
    lines.push(
      `Körpergewicht: ${formatKg(bodyWeightKg)} (gemessen am ${formatDate(input.bodyWeight.measuredAt)})`,
    );
  } else if (hasBodyweightExercise) {
    lines.push(`Körpergewicht: nicht erfasst – für Körpergewichtsübungen mit ${formatKg(bodyWeightKg)} gerechnet`);
  }

  let totalSets = 0;
  let totalVolume = 0;

  for (const exercise of input.exercises) {
    const { sets, measure } = exercise;
    const score = (set: SetValues) => setScore(set, measure, bodyWeightKg);
    lines.push('');
    const planned =
      exercise.targetSets > 0
        ? `${sets.length} von ${exercise.targetSets} geplanten Sätzen`
        : `${sets.length} ${sets.length === 1 ? 'Satz' : 'Sätze'} (nicht im Plan)`;
    lines.push(`${exercise.name} – ${sets.length > 0 ? planned : `keine Sätze eingetragen (${exercise.targetSets} geplant)`}`);

    sets.forEach((set, i) => lines.push(`  Satz ${i + 1}: ${describeSet(set, measure, bodyWeightKg)}`));

    if (sets.length > 0) {
      const best = sets.reduce((a, b) => (score(b) > score(a) ? b : a));
      lines.push(
        measure === 'time'
          ? `  Längste Haltezeit: ${formatSeconds(best.reps)}`
          : `  Bester Satz: ${shortSet(best, measure)} → geschätztes 1RM ${formatScore(score(best), measure)}` +
              (measure === 'bodyweight' ? ' (inkl. Körpergewicht)' : ''),
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
  if (hasBodyweightExercise) {
    lines.push(
      'Körpergewichtsübungen (z. B. Klimmzüge) sind mit Körpergewicht + Zusatzgewicht gerechnet und zählen nicht zum Volumen.',
    );
  }
  if (input.exercises.some((e) => e.measure === 'time' && e.sets.length > 0)) {
    lines.push('Halteübungen (z. B. Deadhang) sind in Sekunden angegeben und zählen nicht zum Volumen.');
  }

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
