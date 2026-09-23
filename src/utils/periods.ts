export type Granularity = 'day' | 'week' | 'month' | 'year';

const LOCALE = 'de-DE';
const DAY_MS = 86_400_000;

/** Beginn des Zeitraums in lokaler Zeit. Wochen beginnen am Montag (ISO 8601). */
export function startOfPeriod(date: Date, granularity: Granularity): Date {
  const y = date.getFullYear();
  const m = date.getMonth();
  switch (granularity) {
    case 'day':
      return new Date(y, m, date.getDate());
    case 'week':
      return new Date(y, m, date.getDate() - ((date.getDay() + 6) % 7));
    case 'month':
      return new Date(y, m, 1);
    case 'year':
      return new Date(y, 0, 1);
  }
}

/** Verschiebt einen Periodenbeginn um `n` Zeiträume (auch negativ). */
export function addPeriods(start: Date, granularity: Granularity, n: number): Date {
  const y = start.getFullYear();
  const m = start.getMonth();
  const d = start.getDate();
  switch (granularity) {
    case 'day':
      return new Date(y, m, d + n);
    case 'week':
      return new Date(y, m, d + 7 * n);
    case 'month':
      return new Date(y, m + n, 1);
    case 'year':
      return new Date(y + n, 0, 1);
  }
}

/** Kalenderwoche nach ISO 8601 (die Woche mit dem ersten Donnerstag ist KW 1). */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { year: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7) };
}

const dayLabel = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit' });
const monthLabel = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: '2-digit' });
const dayTitle = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
const monthTitle = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });
const fullDate = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Kurzes Achsen-Label: "22.09.", "KW 39", "Sep. 26", "2026". */
export function periodLabel(start: Date, granularity: Granularity): string {
  switch (granularity) {
    case 'day':
      return dayLabel.format(start);
    case 'week':
      return `KW ${isoWeek(start).week}`;
    case 'month':
      return monthLabel.format(start);
    case 'year':
      return String(start.getFullYear());
  }
}

/** Ausführlicher Titel für Tooltip und Tabelle, z. B. "KW 39 · 21.09.2026 – 27.09.2026". */
export function periodTitle(start: Date, granularity: Granularity): string {
  switch (granularity) {
    case 'day':
      return dayTitle.format(start);
    case 'week': {
      const end = addPeriods(start, 'day', 6);
      return `KW ${isoWeek(start).week} · ${fullDate.format(start)} – ${fullDate.format(end)}`;
    }
    case 'month':
      return monthTitle.format(start);
    case 'year':
      return String(start.getFullYear());
  }
}

export interface DatedValue {
  date: Date;
  value: number;
}

export interface PeriodValue {
  start: Date;
  value: number;
  /** Anzahl der Einträge im Zeitraum. */
  count: number;
}

/** Summen für die letzten `periods` Zeiträume bis einschließlich `now` – leere Zeiträume mit 0. */
export function sumByPeriod(
  entries: DatedValue[],
  granularity: Granularity,
  periods: number,
  now = new Date(),
): PeriodValue[] {
  const current = startOfPeriod(now, granularity);
  const buckets = new Map<number, PeriodValue>();
  for (let i = periods - 1; i >= 0; i--) {
    const start = addPeriods(current, granularity, -i);
    buckets.set(start.getTime(), { start, value: 0, count: 0 });
  }
  for (const entry of entries) {
    const bucket = buckets.get(startOfPeriod(entry.date, granularity).getTime());
    if (bucket) {
      bucket.value += entry.value;
      bucket.count += 1;
    }
  }
  return [...buckets.values()];
}

/**
 * Durchschnitt je Zeitraum, nur für Zeiträume mit Einträgen, chronologisch.
 * `periods` begrenzt auf die letzten n Zeiträume bis `now`; ohne Angabe: alle.
 */
export function averageByPeriod(
  entries: DatedValue[],
  granularity: Granularity,
  periods?: number,
  now = new Date(),
): PeriodValue[] {
  const from =
    periods === undefined
      ? -Infinity
      : addPeriods(startOfPeriod(now, granularity), granularity, -(periods - 1)).getTime();
  const buckets = new Map<number, { start: Date; sum: number; count: number }>();
  for (const entry of entries) {
    const start = startOfPeriod(entry.date, granularity);
    if (start.getTime() < from) continue;
    const bucket = buckets.get(start.getTime()) ?? { start, sum: 0, count: 0 };
    bucket.sum += entry.value;
    bucket.count += 1;
    buckets.set(start.getTime(), bucket);
  }
  return [...buckets.values()]
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .map(({ start, sum, count }) => ({ start, value: sum / count, count }));
}
