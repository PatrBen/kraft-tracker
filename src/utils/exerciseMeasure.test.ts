import { describe, expect, it } from 'vitest';
import { exerciseMeasure, guessMeasure } from './exerciseMeasure';

describe('guessMeasure', () => {
  it('erkennt Halteübungen am Namen', () => {
    for (const name of ['Deadhang', 'Dead Hang', 'dead-hang', 'Plank', 'Unterarmstütz', 'L-Sit']) {
      expect(guessMeasure(name), name).toBe('time');
    }
  });

  it('bleibt sonst bei Wiederholungen', () => {
    for (const name of ['Bankdrücken', 'Klimmzüge', 'Hanging Leg Raise', 'Kniebeuge']) {
      expect(guessMeasure(name), name).toBe('reps');
    }
  });
});

describe('exerciseMeasure', () => {
  it('bevorzugt die gespeicherte Einstellung', () => {
    expect(exerciseMeasure({ name: 'Deadhang', measure: 'reps' })).toBe('reps');
    expect(exerciseMeasure({ name: 'Bankdrücken', measure: 'time' })).toBe('time');
  });

  it('leitet ältere Übungen ohne Einstellung aus dem Namen ab', () => {
    expect(exerciseMeasure({ name: 'Deadhang' })).toBe('time');
  });
});
