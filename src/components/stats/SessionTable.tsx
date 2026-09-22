import { formatDate, formatKg, formatNumber } from '../../utils/format';
import type { SessionBest } from '../../utils/oneRepMax';

function formatDelta(delta: number): string {
  if (Math.abs(delta) < 0.05) return '±0 kg';
  return `${delta > 0 ? '+' : '−'}${formatNumber(Math.abs(delta))} kg`;
}

/** Tabellarische Fassung des Diagramms – jeder Wert ist auch ohne Hover lesbar. */
export function SessionTable({ data }: { data: SessionBest[] }) {
  const rows = [...data].reverse();

  return (
    <div className="card">
      <h2 className="card__title">Alle Sessions</h2>
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Datum</th>
              <th scope="col">Bester Satz</th>
              <th scope="col" className="num">
                1RM
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
                  <td>
                    {formatKg(row.weightKg)} × {row.reps}
                  </td>
                  <td className="num">{formatKg(row.oneRepMax)}</td>
                  <td className="num muted">
                    {previous ? formatDelta(row.oneRepMax - previous.oneRepMax) : '–'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
