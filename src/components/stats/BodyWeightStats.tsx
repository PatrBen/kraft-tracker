import { useMemo, useState } from 'react';
import { deleteBodyWeight } from '../../db/bodyWeights';
import { useBodyWeights } from '../../hooks/useBodyWeights';
import { formatDate, formatKg, formatSignedKg, formatTime } from '../../utils/format';
import { averageByPeriod, periodLabel, periodTitle, type Granularity } from '../../utils/periods';
import { TrendChart } from '../charts/TrendChart';
import { EmptyState } from '../common/EmptyState';
import { SegmentedControl } from '../common/SegmentedControl';
import { StatTile } from './StatTile';

const WINDOWS: Record<Granularity, { label: string; periods?: number; range: string }> = {
  day: { label: 'Täglich', periods: 30, range: 'letzte 30 Tage' },
  week: { label: 'Wöchentlich', periods: 26, range: 'letzte 26 Wochen' },
  month: { label: 'Monatlich', periods: 24, range: 'letzte 24 Monate' },
  year: { label: 'Jährlich', range: 'alle Jahre' },
};

const OPTIONS = (Object.keys(WINDOWS) as Granularity[]).map((value) => ({
  value,
  label: WINDOWS[value].label,
}));

export function BodyWeightStats() {
  const entries = useBodyWeights();
  const [granularity, setGranularity] = useState<Granularity>('week');

  const points = useMemo(() => {
    const values = entries?.map((e) => ({ date: e.measuredAt, value: e.weightKg })) ?? [];
    return averageByPeriod(values, granularity, WINDOWS[granularity].periods).map((p) => ({
      ...p,
      time: p.start.getTime(),
    }));
  }, [entries, granularity]);

  if (entries === undefined) return null;
  if (entries.length === 0) {
    return (
      <EmptyState title="Noch kein Gewicht eingetragen">
        <p>Auf der Seite „Pläne“ trägst du dein aktuelles Körpergewicht ein.</p>
      </EmptyState>
    );
  }

  const first = entries[0];
  const latest = entries[entries.length - 1];
  const weights = entries.map((e) => e.weightKg);
  const change = latest.weightKg - first.weightKg;

  const handleDelete = async (id: string, weightKg: number, measuredAt: Date) => {
    if (window.confirm(`Messung ${formatKg(weightKg)} vom ${formatDate(measuredAt)} löschen?`)) {
      await deleteBodyWeight(id);
    }
  };

  return (
    <>
      <div className="stat-tiles">
        <StatTile label="Aktuell" value={formatKg(latest.weightKg)} detail={formatDate(latest.measuredAt)} />
        <StatTile
          label="Veränderung"
          value={formatSignedKg(change)}
          detail={`seit ${formatDate(first.measuredAt)}`}
          highlight
        />
        <StatTile label="Tiefstwert" value={formatKg(Math.min(...weights))} />
        <StatTile label="Höchstwert" value={formatKg(Math.max(...weights))} />
      </div>

      <div className="card chart-card">
        <div className="chart-card__header">
          <div>
            <h2 className="card__title">Körpergewicht in kg</h2>
            <p className="chart-card__subtitle">
              {granularity === 'day' ? 'Tageswerte' : 'Durchschnitt je Zeitraum'} · {WINDOWS[granularity].range}
            </p>
          </div>
          <SegmentedControl label="Zeitraum" options={OPTIONS} value={granularity} onChange={setGranularity} />
        </div>
        {points.length > 0 ? (
          <TrendChart
            points={points}
            formatValue={formatKg}
            formatTick={(t) => periodLabel(new Date(t), granularity)}
            tooltip={(p) => ({
              value: formatKg(p.value),
              label: periodTitle(p.start, granularity),
              detail: p.count > 1 ? `Ø aus ${p.count} Messungen` : undefined,
            })}
          />
        ) : (
          <p className="muted chart-card__empty">Keine Messungen in diesem Zeitraum.</p>
        )}
      </div>

      <div className="card">
        <details>
          <summary className="card__title">Alle Messungen ({entries.length})</summary>
          <ul className="entry-list">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id} className="entry-row">
                <span>
                  {formatDate(entry.measuredAt)}{' '}
                  <span className="muted">{formatTime(entry.measuredAt)} Uhr</span>
                </span>
                <span className="entry-row__value">{formatKg(entry.weightKg)}</span>
                <button
                  type="button"
                  className="btn btn--icon btn--ghost btn--danger"
                  onClick={() => handleDelete(entry.id, entry.weightKg, entry.measuredAt)}
                  aria-label={`Messung vom ${formatDate(entry.measuredAt)} löschen`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </>
  );
}
