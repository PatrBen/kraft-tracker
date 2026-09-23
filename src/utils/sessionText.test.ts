import { describe, expect, it } from 'vitest';
import { sessionFileName, sessionToText, type SessionTextInput } from './sessionText';

const input: SessionTextInput = {
  planName: 'Push-Tag',
  startedAt: new Date(2026, 8, 22, 18, 0),
  endedAt: new Date(2026, 8, 22, 19, 0),
  bodyWeight: { weightKg: 82.4, measuredAt: new Date(2026, 8, 22, 7, 30) },
  exercises: [
    {
      name: 'Bankdrücken',
      measure: 'reps',
      targetSets: 3,
      sets: [
        { weightKg: 62.5, reps: 8 },
        { weightKg: 62.5, reps: 7 },
      ],
      previous: { date: new Date(2026, 8, 19), sets: [{ weightKg: 60, reps: 8 }] },
    },
    {
      name: 'Deadhang',
      measure: 'time',
      targetSets: 2,
      sets: [
        { weightKg: 0, reps: 45 },
        { weightKg: 10, reps: 30 },
      ],
      previous: null,
    },
    {
      name: 'Klimmzug',
      measure: 'bodyweight',
      targetSets: 2,
      sets: [
        { weightKg: 0, reps: 7 }, // 82,4 × (1 + 7/30) = 101,6
        { weightKg: 5, reps: 3 }, // 87,4 × 1,1 = 96,1
      ],
      previous: { date: new Date(2026, 8, 15), sets: [{ weightKg: 0, reps: 5 }] },
    },
    { name: 'Dips', measure: 'reps', targetSets: 3, sets: [], previous: null },
  ],
};

describe('sessionToText', () => {
  const text = sessionToText(input);

  it('enthält Kopf mit Datum, Dauer und Körpergewicht', () => {
    expect(text).toContain('Training: Push-Tag');
    expect(text).toContain('22.09.2026, 18:00–19:00 Uhr (60 min)');
    expect(text).toContain('Körpergewicht: 82,4 kg');
  });

  it('listet Sätze mit 1RM, Bestwert, Volumen und Vergleich', () => {
    expect(text).toContain('Bankdrücken – 2 von 3 geplanten Sätzen');
    expect(text).toContain('Satz 1: 62,5 kg × 8 Wdh. (geschätztes 1RM 79,2 kg)');
    expect(text).toContain('Bester Satz: 62,5 kg × 8 → geschätztes 1RM 79,2 kg');
    expect(text).toContain('Volumen: 937,5 kg');
    expect(text).toContain('Letztes Mal (19.09.2026): 60 kg × 8');
  });

  it('gibt Halteübungen in Sekunden aus und rechnet sie nicht ins Volumen', () => {
    expect(text).toContain('Satz 1: 45 s');
    expect(text).toContain('Satz 2: 30 s mit 10 kg Zusatzgewicht');
    expect(text).toContain('Längste Haltezeit: 45 s');
    expect(text).toContain('Gesamtvolumen: 937,5 kg');
  });

  it('rechnet Klimmzüge mit Körpergewicht + Zusatzgewicht, ohne sie ins Volumen zu zählen', () => {
    expect(text).toContain('Satz 1: 7 Wdh. mit Körpergewicht (geschätztes 1RM 101,6 kg)');
    expect(text).toContain('Satz 2: 3 Wdh. mit Körpergewicht + 5 kg Zusatzgewicht (geschätztes 1RM 96,1 kg)');
    expect(text).toContain('Bester Satz: 7 Wdh. → geschätztes 1RM 101,6 kg (inkl. Körpergewicht)');
    expect(text).toContain('Letztes Mal (15.09.2026): 5 Wdh.');
    expect(text).toContain('Gesamtvolumen: 937,5 kg');
  });

  it('nennt den Standardwert, wenn es noch keine Gewichtsmessung gab', () => {
    const withoutWeight = sessionToText({ ...input, bodyWeight: { weightKg: 75, measuredAt: null } });
    expect(withoutWeight).toContain('Körpergewicht: nicht erfasst – für Körpergewichtsübungen mit 75 kg gerechnet');
    expect(withoutWeight).toContain('Satz 1: 7 Wdh. mit Körpergewicht (geschätztes 1RM 92,5 kg)');
  });

  it('vermerkt Übungen ohne Sätze', () => {
    expect(text).toContain('Dips – keine Sätze eingetragen (3 geplant)');
  });
});

describe('sessionFileName', () => {
  it('baut einen sprechenden, dateisystemfreundlichen Namen', () => {
    expect(sessionFileName('Push-Tag', new Date(2026, 8, 22))).toBe('training-2026-09-22-push-tag.txt');
    expect(sessionFileName('Ganzkörper Übungen', new Date(2026, 0, 5))).toBe(
      'training-2026-01-05-ganzkoerper-uebungen.txt',
    );
  });
});
