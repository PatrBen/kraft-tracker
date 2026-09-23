import { describe, expect, it } from 'vitest';
import { dateTicks, niceAxis, zeroBasedAxis } from './chartAxis';

describe('niceAxis', () => {
  it('liefert runde Ticks, die alle Werte einschließen', () => {
    const { domain, ticks } = niceAxis([93.3, 101.3, 108]);
    expect(domain[0]).toBeLessThan(93.3);
    expect(domain[1]).toBeGreaterThan(108);
    expect(ticks[0]).toBe(domain[0]);
    expect(ticks.at(-1)).toBe(domain[1]);
    const step = ticks[1] - ticks[0];
    expect([1, 2, 2.5, 5, 10, 20, 25]).toContain(step);
  });

  it('kommt mit einem einzigen Wert zurecht', () => {
    const { domain, ticks } = niceAxis([100]);
    expect(domain[0]).toBeLessThan(100);
    expect(domain[1]).toBeGreaterThan(100);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });
});

describe('zeroBasedAxis', () => {
  it('beginnt bei 0 und endet auf einem runden Wert über dem Maximum', () => {
    expect(zeroBasedAxis(48)).toEqual({ domain: [0, 60], ticks: [0, 20, 40, 60] });
    expect(zeroBasedAxis(591).domain[1]).toBeGreaterThanOrEqual(591);
    expect(zeroBasedAxis(0).ticks[0]).toBe(0);
  });
});

describe('dateTicks', () => {
  const day = (d: number, h = 10) => new Date(2026, 0, d, h).getTime();

  it('fasst mehrere Sessions am selben Tag zu einem Tick zusammen', () => {
    expect(dateTicks([day(1, 9), day(1, 18), day(3)])).toEqual([day(1, 9), day(3)]);
  });

  it('dünnt aus und behält ersten und letzten Tag', () => {
    const times = Array.from({ length: 20 }, (_, i) => day(i + 1));
    const ticks = dateTicks(times, 5);
    expect(ticks).toHaveLength(5);
    expect(ticks[0]).toBe(times[0]);
    expect(ticks.at(-1)).toBe(times.at(-1));
  });
});
