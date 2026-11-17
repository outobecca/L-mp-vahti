import React from 'react';
import type { FuelEvaluation, HeatingSettings, HybridSummary } from '../types/energy';
import {
  formatCents,
  formatEur,
  formatNumber,
  getEffectiveOilCents,
  getEffectiveWoodCents,
  getPurchasedElectricityCents,
} from '../utils/heatingMath';

interface MatrixViewProps {
  evaluations: FuelEvaluation[];
  summary: HybridSummary;
  settings: HeatingSettings;
  currentSpotCents: number;
}

const SPOT_SCENARIOS = [0, 3, 6, 10, 15, 22, 30, 45];

export const MatrixView: React.FC<MatrixViewProps> = ({
  evaluations,
  summary,
  settings,
  currentSpotCents,
}) => {
  const effectiveWood = getEffectiveWoodCents(settings);
  const effectiveOil = getEffectiveOilCents(settings);
  const cop = Math.max(0.8, settings.electricCop);

  const strategies = [
    {
      name: 'Älykäs hybridiohjaus (halvin tunti kerrallaan)',
      daily: summary.hybridDailyCostEur,
      description: 'Käyttää pörssisähköä halpoina tunteina ja vaihtaa puuhun tai öljyyn hintapiikeissä.',
      highlight: true,
    },
    {
      name: 'Pelkkä polttopuu',
      daily: summary.woodOnlyDailyCostEur,
      description: 'Kiinteä puulämmitys asetetulla puuhinnalla ja tulisijan hyötysuhteella.',
      highlight: false,
    },
    {
      name: 'Pelkkä pörssisähkö (24 h keskiarvo)',
      daily: summary.electricityOnlyDailyCostEur,
      description: 'Ympärivuorokautinen sähkölämmitys ilman vuorottelua kalliiden tuntien aikana.',
      highlight: false,
    },
    {
      name: 'Pelkkä lämmitysöljy',
      daily: summary.oilOnlyDailyCostEur,
      description: 'Tasainen öljykattilalämmitys nykyisellä litrahinnalla ja kattilan hyötysuhteella.',
      highlight: false,
    },
  ].sort((a, b) => a.daily - b.daily);

  const bestStrategyDaily = strategies[0].daily;

  return (
    <div className="space-y-6">
      {/* Hybrid vs Single-Fuel Strategy Comparison */}
      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Lämmitysstrategioiden kustannus- ja säästömatriisi
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Laskettu nykyisellä lämmitystarpeella ({settings.dailyKwh} kWh/vrk) seuraavan 24 tunnin hintaennusteella.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                <th className="py-3 px-6">Lämmitysstrategia</th>
                <th className="py-3 px-4 text-right">Kustannus / vrk</th>
                <th className="py-3 px-4 text-right">Arvio / kk</th>
                <th className="py-3 px-4 text-right">Arvio / vuosi</th>
                <th className="py-3 px-6 text-right">Lisäkustannus vs paras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {strategies.map((s) => {
                const extraDaily = s.daily - bestStrategyDaily;
                const isBest = extraDaily < 0.01;
                return (
                  <tr
                    key={s.name}
                    className={s.highlight ? 'bg-emerald-50/40' : 'hover:bg-slate-50/70'}
                  >
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{s.description}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-medium text-slate-900">
                      {formatEur(s.daily, 2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatEur(s.daily * 30.4, 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700">
                      {formatEur(s.daily * 365, 0)}
                    </td>
                    <td
                      className={`py-3.5 px-6 text-right font-mono tabular-nums font-semibold ${
                        isBest ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {isBest ? 'Edullisin' : `+${formatEur(extraDaily * 365, 0)} / v`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pairwise fuel comparison + Spot sensitivity table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breakeven thresholds */}
        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-base font-semibold text-slate-900">
            Hintakynnysarvot (milloin vaihtaa lämmitysmuotoa?)
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Pörssisähkön spot-hinnan rajat, joiden alapuolella sähkö on puuta tai öljyä edullisempaa.
          </p>

          <dl className="mt-5 divide-y divide-slate-100 text-sm">
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-600">
                Pörssisähkö voittaa <strong>polttopuun</strong>, kun spot on alle
              </dt>
              <dd className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                {formatCents(summary.woodBreakevenSpotCents, 2)}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-600">
                Pörssisähkö voittaa <strong>lämmitysöljyn</strong>, kun spot on alle
              </dt>
              <dd className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                {formatCents(summary.oilBreakevenSpotCents, 2)}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-600">Tämän hetken live spot-hinta</dt>
              <dd className="font-mono font-semibold text-teal-800 tabular-nums shrink-0">
                {formatCents(currentSpotCents, 2)}
              </dd>
            </div>
            <div className="py-3 flex items-center justify-between gap-4">
              <dt className="text-slate-600">Polttopuu vs Lämmitysöljy nyt</dt>
              <dd className="font-mono font-semibold text-emerald-700 tabular-nums shrink-0">
                {effectiveWood < effectiveOil
                  ? `Puu säästää ${formatEur(((effectiveOil - effectiveWood) * settings.dailyKwh) / 100, 2)}/vrk`
                  : `Öljy säästää ${formatEur(((effectiveWood - effectiveOil) * settings.dailyKwh) / 100, 2)}/vrk`}
              </dd>
            </div>
          </dl>

          {/* Current pairwise ranking summary */}
          <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            {evaluations.map((ev) => (
              <div key={ev.id} className="flex justify-between font-mono tabular-nums">
                <span>{ev.name}</span>
                <span>
                  {formatCents(ev.effectiveCentsPerKwh, 2)} · {formatEur(ev.annualCostEur, 0)}/v
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Spot sensitivity matrix */}
        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-base font-semibold text-slate-900">
              Herkkyystaulukko pörssisähkön eri hintatasoilla
            </h3>
            <p className="text-sm text-slate-600 mt-0.5">
              Vertailu olettaen nykyisen siirtohinnan ({formatNumber(settings.transferCents, 2)} snt) ja COP-kertoimen ({formatNumber(cop, 1)}).
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500">
                  <th className="py-2.5 px-4">Spot-hinta</th>
                  <th className="py-2.5 px-4 text-right">Sähkölämpö</th>
                  <th className="py-2.5 px-4">Halvin muoto</th>
                  <th className="py-2.5 px-4 text-right">Säästö vs öljy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SPOT_SCENARIOS.map((spot) => {
                  const purchased = getPurchasedElectricityCents(spot, settings);
                  const effElec = purchased / cop;
                  const bestVal = Math.min(effElec, effectiveWood, effectiveOil);
                  const bestLabel =
                    bestVal === effElec
                      ? 'Sähkö'
                      : bestVal === effectiveWood
                      ? 'Polttopuu'
                      : 'Öljy';
                  const savingsVsOilDaily =
                    ((effectiveOil - bestVal) * settings.dailyKwh) / 100;

                  return (
                    <tr key={spot} className="h-9 hover:bg-slate-50/70">
                      <td className="py-2 px-4 font-mono tabular-nums text-slate-900">
                        {spot} snt/kWh
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-slate-700">
                        {formatNumber(effElec, 2)} snt
                      </td>
                      <td className="py-2 px-4 font-medium text-xs">
                        <span
                          className={
                            bestLabel === 'Sähkö'
                              ? 'text-emerald-700'
                              : bestLabel === 'Polttopuu'
                              ? 'text-teal-800'
                              : 'text-amber-700'
                          }
                        >
                          {bestLabel}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-right font-mono tabular-nums text-emerald-700">
                        {formatEur(savingsVsOilDaily, 2)}/vrk
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
