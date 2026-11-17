import React from 'react';
import { Flame, Droplets, Zap, Check, AlertTriangle } from 'lucide-react';
import type { FuelEvaluation, FuelId } from '../types/energy';
import { formatEur, formatNumber } from '../utils/heatingMath';

interface FuelComparisonGridProps {
  evaluations: FuelEvaluation[];
  dailyKwh: number;
  includeHotWater: boolean;
  hotWaterKwhPerDay: number;
}

function getFuelIcon(id: FuelId) {
  switch (id) {
    case 'electricity':
      return Zap;
    case 'wood':
      return Flame;
    case 'oil':
      return Droplets;
  }
}

export const FuelComparisonGrid: React.FC<FuelComparisonGridProps> = ({
  evaluations,
  dailyKwh,
  includeHotWater,
  hotWaterKwhPerDay,
}) => {
  return (
    <section aria-label="Energiamuotojen vertailu">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {evaluations.map((item) => {
          const Icon = getFuelIcon(item.id);
          const isBest = item.isRecommended;

          return (
            <div
              key={item.id}
              className={`rounded-xl p-6 transition-colors ${
                isBest
                  ? 'bg-white border border-emerald-600'
                  : 'bg-white border border-slate-200'
              }`}
            >
              {/* Unboxed 1-line kicker */}
              <div className="flex items-center justify-between gap-2 text-xs mb-3">
                <span
                  className={`font-medium flex items-center gap-1.5 ${
                    isBest ? 'text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  {isBest && <Check className="w-3.5 h-3.5" />}
                  {isBest
                    ? 'Suositeltu lämmitysmuoto'
                    : `${item.rank}. sija · +${formatNumber(item.deltaPercentVsBest, 0)} % kalliimpi`}
                </span>
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isBest ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                />
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 truncate" title={item.systemLabel}>
                {item.systemLabel}
              </p>

              {/* Primary KPI */}
              <div className="mt-5 pb-5 border-b border-slate-100">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl font-semibold tracking-tight text-slate-900 tabular-nums">
                    {formatNumber(item.effectiveCentsPerKwh, 2)}
                  </span>
                  <span className="text-sm font-mono text-slate-500">snt / kWh</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Tilalämmityksen yksikköhinta
                  {includeHotWater && (
                    <span className="font-mono tabular-nums">
                      {' '}
                      · kokonaiskeskiarvo {formatNumber(item.blendedCentsPerKwh, 2)} snt
                    </span>
                  )}
                </p>
              </div>

              {/* Cost breakdown rows */}
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Tilat ({dailyKwh} kWh/vrk)</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {formatEur(item.spaceHeatingDailyCostEur, 2)}
                  </dd>
                </div>

                {includeHotWater && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500 flex items-center gap-1">
                      {!item.canHeatHotWater && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      )}
                      Käyttövesi ({hotWaterKwhPerDay} kWh)
                    </dt>
                    <dd className="font-mono font-medium text-slate-900 tabular-nums">
                      {formatEur(item.hotWaterDailyCostEur, 2)}
                    </dd>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                  <dt className="text-slate-700 font-medium">Yhteensä / vrk</dt>
                  <dd className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatEur(item.dailyCostEur, 2)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">Arvio / kk (30,4 vrk)</dt>
                  <dd className="font-mono font-medium text-slate-900 tabular-nums">
                    {formatEur(item.monthlyCostEur, 0)}
                  </dd>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <dt className="text-slate-500">
                    {isBest ? 'Edullisin kokonaisuus' : 'Lisäkustannus / vrk'}
                  </dt>
                  <dd
                    className={`font-mono font-medium tabular-nums ${
                      isBest ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {isBest ? '0,00 €' : `+${formatEur(item.savingsPerDayVsThis, 2)}`}
                  </dd>
                </div>
              </dl>

              {/* Technical basis */}
              <div className="mt-4 pt-3.5 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                <p className="font-mono tabular-nums truncate" title={item.rawPriceLabel}>
                  {item.rawPriceLabel}
                </p>
                <p>{item.efficiencyLabel}</p>
                {includeHotWater && (
                  <p className={!item.canHeatHotWater ? 'text-amber-700 font-medium' : 'text-slate-500'}>
                    Käyttövesi: {item.hotWaterSourceLabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
