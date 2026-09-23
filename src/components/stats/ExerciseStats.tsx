import { useMemo } from 'react';
import type { ExerciseMeasure } from '../../db/types';
import { formatDate, formatKg, formatPercent, pluralize } from '../../utils/format';
import { percentChange, type SessionBest } from '../../utils/oneRepMax';
import { formatScore, formatSet } from '../../utils/setFormat';
import { TrendChart } from '../charts/TrendChart';
import { EmptyState } from '../common/EmptyState';
import { SessionTable } from './SessionTable';
import { StatTile } from './StatTile';

const TEXTS: Record<ExerciseMeasure, { title: string; subtitle: string; valueLabel: string }> = {
  reps: {
    title: 'Geschätztes 1RM in kg',
    subtitle: 'Bester Satz je Session nach Epley: Gewicht × (1 + Wdh. / 30)',
    valueLabel: 'geschätztes 1RM',
  },
  time: {
    title: 'Längste Haltezeit in Sekunden',
    subtitle: 'Bester Satz je Session',
    valueLabel: 'Haltezeit',
  },
};

interface ExerciseStatsProps {
  data: SessionBest[];
  measure: ExerciseMeasure;
}

export function ExerciseStats({ data, measure }: ExerciseStatsProps) {
  const points = useMemo(() => data.map((d) => ({ ...d, time: d.date.getTime() })), [data]);

  if (data.length === 0) {
    return <EmptyState title="Für diese Übung wurden noch keine Sätze eingetragen." />;
  }

  const text = TEXTS[measure];
  const first = data[0];
  const current = data[data.length - 1];
  const best = data.reduce((a, b) => (b.value > a.value ? b : a));
  const change = data.length > 1 ? percentChange(first.value, current.value) : null;
  const format = (value: number) => formatScore(value, measure);

  return (
    <>
      <div className="stat-tiles">
        <StatTile label="Erste Session" value={format(first.value)} detail={formatDate(first.date)} />
        <StatTile label="Aktuelle Session" value={format(current.value)} detail={formatDate(current.date)} />
        <StatTile
          label="Steigerung"
          value={change === null ? '–' : formatPercent(change)}
          trend={change === null ? undefined : change > 0 ? 'up' : change < 0 ? 'down' : 'flat'}
          detail={
            data.length > 1
              ? `erste vs. aktuelle, ${pluralize(data.length, 'Session', 'Sessions')}`
              : 'ab der zweiten Session'
          }
          highlight
        />
        <StatTile
          label="Bestwert"
          value={format(best.value)}
          detail={
            measure === 'time'
              ? `am ${formatDate(best.date)}`
              : `${formatKg(best.weightKg)} × ${best.reps} am ${formatDate(best.date)}`
          }
        />
      </div>

      <div className="card chart-card">
        <h2 className="card__title">{text.title}</h2>
        <p className="chart-card__subtitle">{text.subtitle}</p>
        <TrendChart
          points={points}
          formatValue={format}
          tooltip={(p) => ({
            value: format(p.value),
            label: text.valueLabel,
            detail: `${formatDate(p.date)} · ${formatSet(p, measure)}`,
          })}
        />
      </div>

      <SessionTable data={data} measure={measure} />
    </>
  );
}
