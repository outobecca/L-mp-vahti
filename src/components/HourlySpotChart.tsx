import React, { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { HourlySimulationPoint } from '../types/energy';
import { formatCents, formatEur, formatNumber, fuelLabelFi } from '../utils/heatingMath';

interface HourlySpotChartProps {
  points: HourlySimulationPoint[];
  selectedStartDate: string | null;
  onSelectHour: (startDate: string | null) => void;
}

export const HourlySpotChart: React.FC<HourlySpotChartProps> = ({
  points,
  selectedStartDate,
  onSelectHour,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (points.length === 0) return null;

    const effectiveWood = points[0].effectiveWoodCents;
    const effectiveOil = points[0].effectiveOilCents;
    const maxElec = Math.max(...points.map((p) => p.effectiveElectricityCents));
    const minElec = Math.min(...points.map((p) => p.effectiveElectricityCents), 0);

    const yMax = Math.max(maxElec, effectiveOil, effectiveWood, 15) * 1.12;
    const yMin = Math.min(minElec, 0);

    // Nice grid steps
    const span = yMax - yMin;
    const step = span > 45 ? 10 : span > 20 ? 5 : 2;
    const gridValues: number[] = [];
    const firstStep = Math.ceil(yMin / step) * step;
    for (let v = firstStep; v <= yMax; v += step) {
      gridValues.push(Number(v.toFixed(1)));
    }

    return {
      yMin,
      yMax,
      gridValues,
      effectiveWood,
      effectiveOil,
    };
  }, [points]);

  if (!chartData || points.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-sm text-slate-500">
        Tuntikohtaisia pörssihintoja ei ole vielä saatavilla.
      </div>
    );
  }

  const width = 960;
  const height = 310;
  const padLeft = 52;
  const padRight = 132;
  const padTop = 22;
  const padBottom = 40;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const yToPx = (val: number) => {
    const ratio = (val - chartData.yMin) / (chartData.yMax - chartData.yMin);
    return padTop + plotH - ratio * plotH;
  };

  const zeroY = yToPx(0);
  const barSlot = plotW / points.length;
  const barWidth = Math.max(4, Math.min(22, barSlot * 0.72));

  const woodY = yToPx(chartData.effectiveWood);
  const oilY = yToPx(chartData.effectiveOil);

  // Determine active inspection point (hover > selected > current)
  const currentIdx = points.findIndex((p) => p.isCurrentHour);
  const selectedIdx = selectedStartDate
    ? points.findIndex((p) => p.startDate === selectedStartDate)
    : -1;
  const activeIdx =
    hoveredIdx !== null
      ? hoveredIdx
      : selectedIdx >= 0
      ? selectedIdx
      : currentIdx >= 0
      ? currentIdx
      : 0;
  const activePoint = points[activeIdx];

  // Find midnight separator index for tomorrow
  const tomorrowStartIdx = points.findIndex((p, idx) => idx > 0 && p.helsinkiHour === 0);

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Lämmitysenergian tuntihinta ja kannattavuusrajat
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Pörssisähkön todellinen lämpöhinta (spot + siirto + vero / COP) verrattuna polttopuun ja öljyn nettokustannukseen.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 shrink-0">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-emerald-600" />
            Sähkö halvin
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-amber-600" />
            Sähkö keskikastia
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-red-600" />
            Sähkö kallein
          </span>
          {selectedStartDate && (
            <button
              type="button"
              onClick={() => onSelectHour(null)}
              className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-medium underline underline-offset-4 cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Palaa nykyhetkeen
            </button>
          )}
        </div>
      </div>

      {/* Interactive inspector strip */}
      {activePoint && (
        <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 mb-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-mono font-semibold text-slate-900 tabular-nums">
              {activePoint.helsinkiDateLabel} klo {activePoint.helsinkiTimeLabel}
              {activePoint.isCurrentHour ? ' (Nyt)' : ''}
            </span>
            <span className="text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-600">
              Spot:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {formatNumber(activePoint.spotPriceCents, 2)} snt/kWh
              </strong>
            </span>
            <span className="text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="text-slate-600">
              Sähkölämpö:{' '}
              <strong className="font-mono text-slate-900 tabular-nums">
                {formatCents(activePoint.effectiveElectricityCents, 2)}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="text-slate-600">
              Suositus:{' '}
              <strong
                className={
                  activePoint.bestFuel === 'electricity'
                    ? 'text-emerald-700 font-semibold'
                    : activePoint.bestFuel === 'wood'
                    ? 'text-teal-800 font-semibold'
                    : 'text-amber-700 font-semibold'
                }
              >
                {fuelLabelFi(activePoint.bestFuel)}
              </strong>
            </span>
            <span className="text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="font-mono tabular-nums text-emerald-700 font-medium">
              Säästö {formatEur(activePoint.hourlySavingsVsSecondBestEur, 2)}/h seuraavaan
            </span>
          </div>
        </div>
      )}

      {/* Responsive SVG Chart */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[680px] h-auto select-none"
          role="img"
          aria-label="Tuntikohtainen lämmityskustannuskaavio"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Horizontal grid lines */}
          {chartData.gridValues.map((val) => {
            const y = yToPx(val);
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={val === 0 ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth={val === 0 ? 1.2 : 1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[11px] font-mono tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Y-axis unit */}
          <text
            x={padLeft - 8}
            y={padTop - 8}
            textAnchor="end"
            className="fill-slate-400 text-[10px] font-mono"
          >
            snt/kWh
          </text>

          {/* Tomorrow separator */}
          {tomorrowStartIdx > 0 && (
            <g>
              <line
                x1={padLeft + tomorrowStartIdx * barSlot}
                y1={padTop}
                x2={padLeft + tomorrowStartIdx * barSlot}
                y2={height - padBottom}
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <text
                x={padLeft + tomorrowStartIdx * barSlot + 6}
                y={padTop + 12}
                className="fill-slate-500 text-[11px] font-medium"
              >
                Huomenna ({points[tomorrowStartIdx].helsinkiDateLabel})
              </text>
            </g>
          )}

          {/* Bars */}
          {points.map((pt, idx) => {
            const cx = padLeft + idx * barSlot + barSlot / 2;
            const x = cx - barWidth / 2;
            const valY = yToPx(pt.effectiveElectricityCents);
            const barTop = Math.min(valY, zeroY);
            const barH = Math.max(2, Math.abs(zeroY - valY));

            const minOther = Math.min(pt.effectiveWoodCents, pt.effectiveOilCents);
            const maxOther = Math.max(pt.effectiveWoodCents, pt.effectiveOilCents);

            let fill = '#d97706'; // amber (middle)
            if (pt.effectiveElectricityCents <= minOther) {
              fill = '#16a34a'; // green (cheapest)
            } else if (pt.effectiveElectricityCents > maxOther) {
              fill = '#dc2626'; // crimson (most expensive)
            }

            const isFocused = idx === activeIdx;

            return (
              <g
                key={pt.startDate}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => onSelectHour(pt.startDate)}
              >
                {/* Invisible wider hit target */}
                <rect
                  x={padLeft + idx * barSlot}
                  y={padTop}
                  width={barSlot}
                  height={plotH}
                  fill="transparent"
                />

                {/* Active highlight column */}
                {isFocused && (
                  <rect
                    x={padLeft + idx * barSlot + 1}
                    y={padTop}
                    width={Math.max(1, barSlot - 2)}
                    height={plotH}
                    fill="#0f172a"
                    fillOpacity={0.05}
                    rx={2}
                  />
                )}

                {/* Cost bar */}
                <rect
                  x={x}
                  y={barTop}
                  width={barWidth}
                  height={barH}
                  rx={2}
                  fill={fill}
                  fillOpacity={isFocused ? 1 : 0.85}
                />

                {/* Current hour marker dot above axis */}
                {pt.isCurrentHour && (
                  <polygon
                    points={`${cx - 4},${height - padBottom + 2} ${cx + 4},${
                      height - padBottom + 2
                    } ${cx},${height - padBottom - 4}`}
                    fill="#0f172a"
                  />
                )}

                {/* X-axis tick labels every 3 hours */}
                {pt.helsinkiHour % 3 === 0 && (
                  <text
                    x={cx}
                    y={height - padBottom + 18}
                    textAnchor="middle"
                    className={`text-[11px] font-mono tabular-nums ${
                      pt.isCurrentHour ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                    }`}
                  >
                    {String(pt.helsinkiHour).padStart(2, '0')}
                  </text>
                )}
              </g>
            );
          })}

          {/* Reference threshold line: Wood */}
          <g>
            <line
              x1={padLeft}
              y1={woodY}
              x2={width - padRight}
              y2={woodY}
              stroke="#0f766e"
              strokeWidth={1.75}
              strokeDasharray="6 4"
            />
            <text
              x={width - padRight + 8}
              y={woodY + 4}
              className="fill-teal-800 text-[11px] font-mono font-semibold tabular-nums"
            >
              Puu {formatNumber(chartData.effectiveWood, 1)} snt
            </text>
          </g>

          {/* Reference threshold line: Oil */}
          <g>
            <line
              x1={padLeft}
              y1={oilY}
              x2={width - padRight}
              y2={oilY}
              stroke="#475569"
              strokeWidth={1.75}
              strokeDasharray="4 4"
            />
            <text
              x={width - padRight + 8}
              y={
                Math.abs(oilY - woodY) < 14
                  ? oilY < woodY
                    ? woodY - 12
                    : woodY + 16
                  : oilY + 4
              }
              className="fill-slate-700 text-[11px] font-mono font-semibold tabular-nums"
            >
              Öljy {formatNumber(chartData.effectiveOil, 1)} snt
            </text>
          </g>
        </svg>
      </div>
    </section>
  );
};
