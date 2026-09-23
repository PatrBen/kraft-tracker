export interface TooltipContent {
  /** Der Wert – steht groß und zuerst. */
  value: string;
  label: string;
  detail?: string;
}

interface ChartTooltipProps<P> {
  render: (point: P) => TooltipContent;
  // Von Recharts beim Klonen gesetzt:
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: P }>;
}

/** Gemeinsamer Tooltip aller Diagramme: Wert vorne, Linien-Schlüssel statt Kästchen. */
export function ChartTooltip<P>({ render, active, payload }: ChartTooltipProps<P>) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  const content = render(point);

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__value">
        <span className="chart-tooltip__key" aria-hidden="true" />
        {content.value}
      </div>
      <div className="chart-tooltip__label">{content.label}</div>
      {content.detail && <div className="chart-tooltip__meta">{content.detail}</div>}
    </div>
  );
}
