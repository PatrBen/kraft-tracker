import { useMemo, useState } from 'react';
import { usePushupEntries } from '../../hooks/usePushups';
import { formatDate, formatNumber } from '../../utils/format';
import { periodLabel, periodTitle, sumByPeriod, type Granularity } from '../../utils/periods';
import { PeriodBarChart } from '../charts/PeriodBarChart';
import { EmptyState } from '../common/EmptyState';
import { SegmentedControl } from '../common/SegmentedControl';
import { StatTile } from './StatTile';

type PushupGranularity = Extract<Granularity, 'day' | 'week' | 'month'>;

const WINDOWS: Record<PushupGranularity, { label: string; periods: number; unit: string; range: string }> = {
  day: { label: 'Täglich', periods: 30, unit: 'Tag', range: 'letzte 30 Tage' },
  week: { label: 'Wöchentlich', periods: 12, unit: 'Woche', range: 'letzte 12 Wochen' },
  month: { label: 'Monatlich', periods: 12, unit: 'Monat', range: 'letzte 12 Monate' },
};

const OPTIONS = (Object.keys(WINDOWS) as PushupGranularity[]).map((value) => ({
  value,
  label: WINDOWS[value].label,
}));

export function PushupStats() {
  const entries = usePushupEntries();
  const [granularity, setGranularity] = useState<PushupGranularity>('day');

  const values = useMemo(
    () => entries?.map((e) => ({ date: e.doneAt, value: e.count })) ?? [],
    [entries],
  );
  const bars = useMemo(
    () =>
      sumByPeriod(values, granularity, WINDOWS[granularity].periods).map((p) => ({
        ...p,
        key: p.start.getTime(),
        label: periodLabel(p.start, granularity),
      })),
    [values, granularity],
  );

  if (entries === undefined) return null;
  if (entries.length === 0) {
    return (
      <EmptyState title="Noch keine Liegestütze">
        <p>Auf der Seite „Pläne“ trägst du sie mit einem Klick auf „+1“ ein.</p>
      </EmptyState>
    );
  }

  const range = WINDOWS[granularity];
  const today = sumByPeriod(values, 'day', 1)[0].value;
  const thisWeek = sumByPeriod(values, 'week', 1)[0].value;
  const thisMonth = sumByPeriod(values, 'month', 1)[0].value;
  const total = values.reduce((sum, v) => sum + v.value, 0);
  const average = bars.reduce((sum, b) => sum + b.value, 0) / bars.length;

  return (
    <>
      <div className="stat-tiles">
        <StatTile label="Heute" value={formatNumber(today)} />
        <StatTile label="Diese Woche" value={formatNumber(thisWeek)} />
        <StatTile label="Dieser Monat" value={formatNumber(thisMonth)} />
        <StatTile label="Insgesamt" value={formatNumber(total)} detail={`seit ${formatDate(entries[0].doneAt)}`} />
      </div>

      <div className="card chart-card">
        <div className="chart-card__header">
          <div>
            <h2 className="card__title">Liegestütze pro {range.unit}</h2>
            <p className="chart-card__subtitle">
              {range.range} · Ø {formatNumber(Math.round(average))} pro {range.unit}
            </p>
          </div>
          <SegmentedControl label="Zeitraum" options={OPTIONS} value={granularity} onChange={setGranularity} />
        </div>
        <PeriodBarChart
          bars={bars}
          tooltip={(bar) => ({
            value: `${formatNumber(bar.value)} Liegestütze`,
            label: periodTitle(bar.start, granularity),
            detail: bar.count > 0 ? `${bar.count} × eingetragen` : undefined,
          })}
        />
        <details className="chart-card__table">
          <summary>Werte als Tabelle</summary>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Zeitraum</th>
                <th scope="col" className="num">
                  Liegestütze
                </th>
              </tr>
            </thead>
            <tbody>
              {[...bars].reverse().map((bar) => (
                <tr key={bar.key}>
                  <td>{periodTitle(bar.start, granularity)}</td>
                  <td className="num">{formatNumber(bar.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </>
  );
}
