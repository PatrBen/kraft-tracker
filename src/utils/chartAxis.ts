export interface NiceAxis {
  domain: [number, number];
  ticks: number[];
}

const NICE_STEPS = [1, 2, 2.5, 5];

function niceStep(rawStep: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = NICE_STEPS.find((s) => s * magnitude >= rawStep) ?? 10;
  return step * magnitude;
}

/** Y-Achse mit runden Ticks (z. B. 90 / 95 / 100) und etwas Luft über und unter den Daten. */
export function niceAxis(values: number[], targetTicks = 4): NiceAxis {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.15, max * 0.03, 1);
  const step = niceStep((max - min + 2 * padding) / targetTicks);

  const lo = Math.max(0, Math.floor((min - padding) / step) * step);
  const hi = Math.ceil((max + padding) / step) * step;

  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);
  return { domain: [lo, hi], ticks };
}

/** Y-Achse ab 0 mit runden Ticks für Säulen, z. B. Maximum 48 → 0 / 20 / 40 / 60. */
export function zeroBasedAxis(max: number, targetTicks = 4): NiceAxis {
  const step = niceStep(Math.max(max, 1) / targetTicks);
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let t = 0; t <= top + step / 2; t += step) ticks.push(Math.round(t * 100) / 100);
  return { domain: [0, top], ticks };
}

/**
 * X-Ticks auf echten Session-Tagen (ein Tick pro Kalendertag), bei vielen Sessions
 * gleichmäßig ausgedünnt – erster und letzter Tag bleiben immer erhalten.
 */
export function dateTicks(times: number[], maxTicks = 6): number[] {
  const byDay = new Map<string, number>();
  for (const t of times) {
    const d = new Date(t);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, t);
  }
  const unique = [...byDay.values()].sort((a, b) => a - b);
  if (unique.length <= maxTicks) return unique;

  const picked = new Set<number>();
  for (let i = 0; i < maxTicks; i++) {
    picked.add(unique[Math.round((i * (unique.length - 1)) / (maxTicks - 1))]);
  }
  return [...picked];
}
