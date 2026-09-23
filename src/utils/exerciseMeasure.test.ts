import { describe, expect, it } from 'vitest';
import { exerciseMeasure, guessMeasure } from './exerciseMeasure';

describe('guessMeasure', () => {
  it('erkennt Halteübungen am Namen', () => {
    for (const name of ['Deadhang', 'Dead Hang', 'dead-hang', 'Plank', 'Unterarmstütz', 'L-Sit']) {
      expect(guessMeasure(name), name).toBe('time');
    }
  });

  it('erkennt Körpergewichtsübungen am Namen', () => {
    for (const name of ['Klimmzug', 'Klimmzüge', 'Klimmzuege', 'Pull-ups', 'Pullup', 'Chin-Up']) {
      expect(guessMeasure(name), name).toBe('bodyweight');
    }
  });

  it('erkennt Übungen, bei denen nur die Wiederholungen zählen', () => {
    for (const name of ['Leg Raises', 'Hanging Leg Raise', 'Leg-Raises', 'Beinheben', 'Knee Raises']) {
      expect(guessMeasure(name), name).toBe('repsOnly');
    }
  });

  it('bleibt sonst bei Gewicht × Wiederholungen', () => {
    for (const name of ['Bankdrücken', 'Latzug', 'Pullover', 'Kniebeuge', 'Side crunches']) {
      expect(guessMeasure(name), name).toBe('reps');
    }
  });
});

describe('exerciseMeasure', () => {
  it('bevorzugt die gespeicherte Einstellung', () => {
    expect(exerciseMeasure({ name: 'Deadhang', measure: 'reps' })).toBe('reps');
    expect(exerciseMeasure({ name: 'Bankdrücken', measure: 'time' })).toBe('time');
    expect(exerciseMeasure({ name: 'Dips', measure: 'bodyweight' })).toBe('bodyweight');
  });

  it('leitet ältere Übungen ohne Einstellung aus dem Namen ab', () => {
    expect(exerciseMeasure({ name: 'Deadhang' })).toBe('time');
    expect(exerciseMeasure({ name: 'Klimmzug' })).toBe('bodyweight');
  });
});
