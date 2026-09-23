import type { ExerciseMeasure } from '../../db/types';
import { DEFAULT_BODY_WEIGHT_KG } from '../../utils/bodyWeight';
import { formatDate, formatKg, formatSignedKg } from '../../utils/format';
import type { SessionBest } from '../../utils/oneRepMax';
import { formatScore, formatSet } from '../../utils/setFormat';

function formatDelta(delta: number, measure: ExerciseMeasure): string {
  if (measure === 'reps' || measure === 'bodyweight') return formatSignedKg(delta);
  const unit = measure === 'time' ? 's' : 'Wdh.';
  if (Math.round(delta) === 0) return `±0 ${unit}`;
  return `${delta > 0 ? '+' : '−'}${Math.abs(Math.round(delta))} ${unit}`;
}

const VALUE_HEADER: Record<ExerciseMeasure, string> = {
  reps: '1RM',
  bodyweight: '1RM',
  repsOnly: 'Wdh.',
  time: 'Zeit',
};

interface SessionTableProps {
  data: SessionBest[];
  measure: ExerciseMeasure;
}

/** Tabellarische Fassung des Diagramms – jeder Wert ist auch ohne Hover lesbar. */
export function SessionTable({ data, measure }: SessionTableProps) {
  const rows = [...data].reverse();
  const withBodyWeight = measure === 'bodyweight';
  const usesDefault = rows.some((r) => r.bodyWeight && !r.bodyWeight.measuredAt);

  return (
    <div className="card">
      <h2 className="card__title">Alle Sessions</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Datum</th>
              <th scope="col">Bester Satz</th>
              {withBodyWeight && (
                <th scope="col" className="num">
                  Körpergew.
                </th>
              )}
              <th scope="col" className="num">
                {VALUE_HEADER[measure]}
              </th>
              <th scope="col" className="num">
                Δ Vorher
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const previous = rows[i + 1];
              return (
                <tr key={row.sessionId}>
                  <td>{formatDate(row.date)}</td>
                  <td>{formatSet(row, measure)}</td>
                  {withBodyWeight && (
                    <td className="num">
                      {row.bodyWeight && formatKg(row.bodyWeight.weightKg)}
                      {row.bodyWeight && !row.bodyWeight.measuredAt && '*'}
                    </td>
                  )}
                  <td className="num">{formatScore(row.value, measure)}</td>
                  <td className="num muted">
                    {previous ? formatDelta(row.value - previous.value, measure) : '–'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {usesDefault && (
        <p className="muted card__hint">
          * Standardwert {formatKg(DEFAULT_BODY_WEIGHT_KG)} – bis zu diesem Tag gab es noch keine
          Gewichtsmessung.
        </p>
      )}
    </div>
  );
}
