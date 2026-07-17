"use client";

// Gráfica de barras apiladas por día (SVG puro, sin dependencias).
// Paleta categórica validada para superficie oscura #0e1013 con
// el validador del sistema de diseño (banda L, croma, CVD y contraste):
//   verde #09b06a · azul #4a90e0 · ámbar #b87a16

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
}

export interface DailyChartProps {
  /** Filas con { date: "YYYY-MM-DD", [serie]: número } */
  data: Record<string, string | number>[];
  series: ChartSeries[];
  /** Línea extra para el tooltip de cada día (p. ej. sesiones únicas) */
  tooltipExtra?: (row: Record<string, string | number>) => string | null;
}

const W = 640;
const H = 200;
const PAD = { top: 12, right: 8, bottom: 22, left: 34 };
const GAP = 2; // separación entre segmentos apilados (spec de marcas)

function shortDay(date: string): string {
  return date.slice(8, 10);
}

function fullDay(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function DailyChart({ data, series, tooltipExtra }: DailyChartProps) {
  const totals = data.map((row) =>
    series.reduce((acc, s) => acc + Number(row[s.key] ?? 0), 0)
  );
  const max = Math.max(...totals, 0);

  if (max === 0) {
    return (
      <p className="text-sm text-gray-400">
        Aún no hay actividad en los últimos {data.length} días.
      </p>
    );
  }

  const yMax = Math.max(4, Math.ceil(max * 1.1));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const band = innerW / data.length;
  const barW = Math.min(28, band * 0.62);
  const yScale = (v: number) => (v / yMax) * innerH;
  const gridLines = [0.5, 1].map((f) => Math.round(yMax * f));

  return (
    <div>
      {/* Leyenda (identidad siempre con chip + texto, nunca solo color) */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
        {series.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Actividad por día"
      >
        {/* rejilla recesiva + etiquetas del eje y */}
        {gridLines.map((v) => {
          const y = PAD.top + innerH - yScale(v);
          return (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y + 3}
                textAnchor="end"
                fontSize="9"
                fill="rgba(255,255,255,0.45)"
              >
                {v}
              </text>
            </g>
          );
        })}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={PAD.top + innerH}
          y2={PAD.top + innerH}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
        />

        {data.map((row, i) => {
          const x = PAD.left + i * band + (band - barW) / 2;
          const date = String(row.date);
          let yCursor = PAD.top + innerH;
          const extra = tooltipExtra?.(row);
          const tooltip = [
            fullDay(date),
            ...series.map((s) => `${s.label}: ${Number(row[s.key] ?? 0)}`),
            ...(extra ? [extra] : []),
          ].join("\n");

          return (
            <g key={date}>
              {/* zona de hover más amplia que la marca */}
              <rect
                x={PAD.left + i * band}
                y={PAD.top}
                width={band}
                height={innerH}
                fill="transparent"
              >
                <title>{tooltip}</title>
              </rect>
              {series.map((s) => {
                const v = Number(row[s.key] ?? 0);
                if (v <= 0) return null;
                const h = Math.max(2, yScale(v) - GAP);
                yCursor -= yScale(v);
                return (
                  <rect
                    key={s.key}
                    x={x}
                    y={yCursor}
                    width={barW}
                    height={h}
                    rx="2"
                    fill={s.color}
                    pointerEvents="none"
                  />
                );
              })}
              {/* etiqueta del día, alternada para no saturar */}
              {(data.length <= 8 || i % 2 === 0) && (
                <text
                  x={PAD.left + i * band + band / 2}
                  y={H - 7}
                  textAnchor="middle"
                  fontSize="9"
                  fill="rgba(255,255,255,0.45)"
                >
                  {shortDay(date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* vista de tabla accesible */}
      <details className="mt-2 text-xs text-gray-400">
        <summary className="cursor-pointer hover:text-gray-200">
          Ver como tabla
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left">
            <thead>
              <tr className="text-gray-500">
                <th className="py-1 pr-3 font-medium">Día</th>
                {series.map((s) => (
                  <th key={s.key} className="py-1 pr-3 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={String(row.date)} className="border-t border-white/5">
                  <td className="py-1 pr-3">{fullDay(String(row.date))}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1 pr-3 text-right">
                      {Number(row[s.key] ?? 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
