interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  /** Richtung einer Veränderung – wird als Pfeil *und* Farbe gezeigt, nie nur als Farbe. */
  trend?: 'up' | 'down' | 'flat';
  highlight?: boolean;
}

const TREND_ICON = { up: '▲', down: '▼', flat: '●' } as const;

export function StatTile({ label, value, detail, trend, highlight }: StatTileProps) {
  return (
    <div className={`stat-tile${highlight ? ' stat-tile--highlight' : ''}`}>
      <span className="stat-tile__label">{label}</span>
      <span className={`stat-tile__value${trend ? ` stat-tile__value--${trend}` : ''}`}>
        {trend && (
          <span className="stat-tile__icon" aria-hidden="true">
            {TREND_ICON[trend]}
          </span>
        )}
        {value}
      </span>
      {detail && <span className="stat-tile__detail">{detail}</span>}
    </div>
  );
}
