const LOCALE = 'de-DE';

const numberFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit' });
const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit' });

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatKg(value: number): string {
  return `${numberFormat.format(value)} kg`;
}

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDateFormat.format(date);
}

export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

/** Datum als "YYYY-MM-DD" in lokaler Zeit, wie es `<input type="date">` erwartet. */
export function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Sekunden als m:ss, z. B. 90 → "1:30". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function formatDurationMinutes(from: Date, to: Date): string {
  return `${Math.max(1, Math.round((to.getTime() - from.getTime()) / 60000))} min`;
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '±';
  return `${sign}${numberFormat.format(Math.abs(value))} %`;
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Zahl für ein Eingabefeld, mit deutschem Dezimalkomma: 62.5 → "62,5". */
export function formatDecimalInput(value: number): string {
  return String(value).replace('.', ',');
}

/** Akzeptiert Komma und Punkt als Dezimaltrenner; liefert NaN bei ungültiger Eingabe. */
export function parseDecimal(input: string): number {
  const normalized = input.trim().replace(',', '.');
  return normalized === '' ? NaN : Number(normalized);
}
