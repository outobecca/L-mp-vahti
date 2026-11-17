import React, { useMemo, useState } from 'react';
import type { HourlySimulationPoint } from '../types/energy';
import { formatEur, formatNumber, fuelLabelFi } from '../utils/heatingMath';

interface HourlyTableViewProps {
  points: HourlySimulationPoint[];
}

type FilterMode = 'all' | 'electricity_best' | 'alternative_best';

export const HourlyTableView: React.FC<HourlyTableViewProps> = ({ points }) => {
  const [filter, setFilter] = useState<FilterMode>('all');

  const filteredPoints = useMemo(() => {
    if (filter === 'electricity_best') {
      return points.filter((p) => p.bestFuel === 'electricity');
    }
    if (filter === 'alternative_best') {
      return points.filter((p) => p.bestFuel !== 'electricity');
    }
    return points;
  }, [points, filter]);

  return (
    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Tuntikohtainen lämmitysajoitus (48 h)
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Suositeltu lämmitysmuoto ja säästö euroina kullekin tunnille pörssisähkön hintakehityksen mukaan.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kaikki tunnit ({points.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('electricity_best')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'electricity_best'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sähkö halvin ({points.filter((p) => p.bestFuel === 'electricity').length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('alternative_best')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'alternative_best'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Puu / Öljy halvin ({points.filter((p) => p.bestFuel !== 'electricity').length})
          </button>
        </div>
      </div>

      {filteredPoints.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">
          Ei tunteja valitulla suodattimella.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-2.5 px-4">Ajankohta</th>
                <th className="py-2.5 px-4 text-right">Spot (snt/kWh)</th>
                <th className="py-2.5 px-4 text-right">Sähkölämpö (snt/kWh)</th>
                <th className="py-2.5 px-4 text-right">Polttopuu (snt/kWh)</th>
                <th className="py-2.5 px-4 text-right">Öljy (snt/kWh)</th>
                <th className="py-2.5 px-4">Suositus</th>
                <th className="py-2.5 px-4 text-right">Säästö vs 2. sija</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredPoints.map((pt) => {
                const isElec = pt.bestFuel === 'electricity';
                const isWood = pt.bestFuel === 'wood';
                return (
                  <tr
                    key={pt.startDate}
                    className={`h-10 transition-colors ${
                      pt.isCurrentHour
                        ? 'bg-teal-50/70 font-medium'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-2 px-4 whitespace-nowrap text-slate-900 font-mono text-xs tabular-nums">
                      {pt.helsinkiDateLabel} · {pt.helsinkiTimeLabel}
                      {pt.isCurrentHour ? ' (Nyt)' : ''}
                    </td>
                    <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatNumber(pt.spotPriceCents, 2)}
                    </td>
                    <td
                      className={`py-2 px-4 text-right font-mono tabular-nums ${
                        isElec ? 'text-emerald-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      {formatNumber(pt.effectiveElectricityCents, 2)}
                    </td>
                    <td
                      className={`py-2 px-4 text-right font-mono tabular-nums ${
                        isWood ? 'text-teal-800 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {formatNumber(pt.effectiveWoodCents, 2)}
                    </td>
                    <td
                      className={`py-2 px-4 text-right font-mono tabular-nums ${
                        pt.bestFuel === 'oil' ? 'text-amber-700 font-semibold' : 'text-slate-500'
                      }`}
                    >
                      {formatNumber(pt.effectiveOilCents, 2)}
                    </td>
                    <td className="py-2 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          isElec
                            ? 'text-emerald-700'
                            : isWood
                            ? 'text-teal-800'
                            : 'text-amber-700'
                        }`}
                      >
                        {fuelLabelFi(pt.bestFuel)}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-right font-mono tabular-nums text-emerald-700">
                      {formatEur(pt.hourlySavingsVsSecondBestEur, 2)}/h
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
