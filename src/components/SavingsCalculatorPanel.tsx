import React from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  ElectricSystemType,
  HeatingSettings,
  OilPurchaseMode,
  WoodUnitType,
} from '../types/energy';
import {
  DEFAULT_SETTINGS,
  ELECTRIC_SYSTEM_OPTIONS,
  HOME_SIZE_PRESETS,
  OIL_PURCHASE_OPTIONS,
  OUTSIDE_TEMP_PRESETS,
  PORTABLE_HEATER_WATTS_PRESETS,
  WOOD_UNIT_OPTIONS,
  estimateDailyKwh,
  formatEur,
  formatNumber,
  formatWattsLabel,
  getPurchasedElectricityCents,
  getWoodMeta,
} from '../utils/heatingMath';

interface SavingsCalculatorPanelProps {
  settings: HeatingSettings;
  liveSpotCents: number;
  onChange: (next: HeatingSettings) => void;
  onReset: () => void;
}

export const SavingsCalculatorPanel: React.FC<SavingsCalculatorPanelProps> = ({
  settings,
  liveSpotCents,
  onChange,
  onReset,
}) => {
  const woodMeta = getWoodMeta(settings.woodUnitType);

  const handleHomeSizeChange = (homeSizeM2: number) => {
    onChange({
      ...settings,
      homeSizeM2,
      dailyKwh: estimateDailyKwh(homeSizeM2, settings.outsideTempC),
    });
  };

  const handleOutsideTempChange = (outsideTempC: number) => {
    onChange({
      ...settings,
      outsideTempC,
      dailyKwh: estimateDailyKwh(settings.homeSizeM2, outsideTempC),
    });
  };

  const handleElectricSystemChange = (system: ElectricSystemType) => {
    const found = ELECTRIC_SYSTEM_OPTIONS.find((item) => item.id === system);
    onChange({
      ...settings,
      electricSystem: system,
      electricCop: found ? found.defaultCop : 1.0,
      portableHeaterWatts: found?.defaultWatts ?? settings.portableHeaterWatts,
    });
  };

  const handleWoodUnitChange = (unit: WoodUnitType) => {
    const found = WOOD_UNIT_OPTIONS.find((item) => item.id === unit);
    onChange({
      ...settings,
      woodUnitType: unit,
      woodPriceEurPerUnit: found ? found.defaultPriceEur : settings.woodPriceEurPerUnit,
    });
  };

  const handleOilModeChange = (mode: OilPurchaseMode) => {
    const found = OIL_PURCHASE_OPTIONS.find((item) => item.id === mode);
    onChange({
      ...settings,
      oilPurchaseMode: mode,
      oilPriceEurPerLiter: found ? found.defaultPriceEur : settings.oilPriceEurPerLiter,
    });
  };

  const isPoorManMode =
    settings.woodUnitType === 'small_bag' && settings.oilPurchaseMode === 'pump_retail';

  const togglePoorManMode = () => {
    if (isPoorManMode) {
      onChange({
        ...settings,
        woodUnitType: 'birch_loose',
        woodPriceEurPerUnit: 88,
        oilPurchaseMode: 'bulk_tank',
        oilPriceEurPerLiter: 1.82,
      });
    } else {
      onChange({
        ...settings,
        woodUnitType: 'small_bag',
        woodPriceEurPerUnit: 9.9,
        oilPurchaseMode: 'pump_retail',
        oilPriceEurPerLiter: 2.05,
      });
    }
  };

  const isModified = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  const isSmallBag = settings.woodUnitType === 'small_bag';
  const dailyWoodUnitsNeeded =
    settings.dailyKwh / (woodMeta.kwhPerUnit * (settings.woodEfficiencyPct / 100));
  const dailyOilLitersNeeded = settings.dailyKwh / (10 * (settings.oilEfficiencyPct / 100));

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Laskentaparametrit ja reaaliaikainen simulaattori
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            Valitse asunnon koko, ulkolämpötila, lämmitysjärjestelmä ja polttoaineiden ostotapa.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={togglePoorManMode}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              isPoorManMode
                ? 'bg-amber-700 text-white border-amber-700'
                : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
            }`}
          >
            {isPoorManMode
              ? 'Köyhänmiehen tila käytössä (poista)'
              : 'Köyhänmiehen tila (kannuöljy + 9,90 € pikkupussit)'}
          </button>

          {isModified && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Palauta oletusarvot
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
        {/* Left column: Home Size, Demand & Electricity */}
        <div className="space-y-6">
          {/* Home Size Selector */}
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <label htmlFor="home-size-slider" className="text-sm font-semibold text-slate-900">
                Asunnon lämmitettävä pinta-ala
              </label>
              <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {settings.homeSizeM2} m²
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {HOME_SIZE_PRESETS.map((preset) => {
                const active = settings.homeSizeM2 === preset.m2;
                return (
                  <button
                    key={preset.m2}
                    type="button"
                    onClick={() => handleHomeSizeChange(preset.m2)}
                    className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold tabular-nums">
                      {preset.label}
                    </div>
                    <div
                      className={`text-[11px] truncate ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {preset.hint}
                    </div>
                  </button>
                );
              })}
            </div>

            <input
              id="home-size-slider"
              type="range"
              min={35}
              max={300}
              step={5}
              value={settings.homeSizeM2}
              onChange={(e) => handleHomeSizeChange(Number(e.target.value))}
              className="w-full energy-slider"
            />
          </div>

          {/* Outside temperature & resulting daily heating demand */}
          <div className="pt-5 border-t border-slate-100 space-y-4">
            <div>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-sm font-medium text-slate-900">Ulkolämpötila</span>
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  Arvioitu kulutus: {estimateDailyKwh(settings.homeSizeM2, settings.outsideTempC)} kWh/vrk
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {OUTSIDE_TEMP_PRESETS.map((preset) => (
                  <button
                    key={preset.tempC}
                    type="button"
                    onClick={() => handleOutsideTempChange(preset.tempC)}
                    className={`px-2.5 py-1 text-xs rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                      settings.outsideTempC === preset.tempC
                        ? 'bg-slate-900 text-white border-slate-900 font-medium'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-baseline justify-between gap-2 mb-2">
                <label htmlFor="daily-kwh-slider" className="text-sm font-medium text-slate-900">
                  Vuorokauden lämmitystarve
                </label>
                <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                  {settings.dailyKwh} kWh / vrk ({formatNumber(settings.dailyKwh * 365, 0)} kWh/v)
                </span>
              </div>
              <input
                id="daily-kwh-slider"
                type="range"
                min={5}
                max={320}
                step={1}
                value={settings.dailyKwh}
                onChange={(e) => onChange({ ...settings, dailyKwh: Number(e.target.value) })}
                className="w-full energy-slider"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Sähkölämmitysjärjestelmä</h3>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                Live spot: {formatNumber(liveSpotCents, 2)} snt/kWh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ELECTRIC_SYSTEM_OPTIONS.map((opt) => {
                const active = settings.electricSystem === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleElectricSystemChange(opt.id)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{opt.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {opt.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {(settings.electricSystem === 'oil_radiator' ||
              settings.electricSystem === 'construction_heater') && (() => {
              const activeSpot = settings.manualSpotOverride ?? liveSpotCents;
              const purchasedCents = getPurchasedElectricityCents(activeSpot, settings);
              const heaterKw = settings.portableHeaterWatts / 1000;
              const hourlyCostEur = (heaterKw * purchasedCents) / 100;
              const heaterDailyKwh = Math.max(
                1,
                Math.round(heaterKw * settings.portableHeaterHours)
              );
              const dailyHeaterCostEur = (heaterKw * settings.portableHeaterHours * purchasedCents) / 100;

              return (
                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-900">
                      Lämmittimen teho (500 W – 3 kW)
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                      {settings.portableHeaterWatts} W ({formatWattsLabel(settings.portableHeaterWatts)})
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {PORTABLE_HEATER_WATTS_PRESETS.map((watts) => (
                      <button
                        key={watts}
                        type="button"
                        onClick={() =>
                          onChange({ ...settings, portableHeaterWatts: watts })
                        }
                        className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                          settings.portableHeaterWatts === watts
                            ? 'bg-slate-900 text-white border-slate-900 font-medium'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {formatWattsLabel(watts)}
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min={500}
                    max={3000}
                    step={100}
                    value={settings.portableHeaterWatts}
                    onChange={(e) =>
                      onChange({
                        ...settings,
                        portableHeaterWatts: Number(e.target.value),
                      })
                    }
                    className="w-full energy-slider"
                    aria-label="Lämmittimen teho watteina"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-600">Käyttöaika:</span>
                      {[4, 8, 12, 24].map((hrs) => (
                        <button
                          key={hrs}
                          type="button"
                          onClick={() =>
                            onChange({ ...settings, portableHeaterHours: hrs })
                          }
                          className={`px-2 py-0.5 text-xs font-mono tabular-nums rounded border transition-colors cursor-pointer ${
                            settings.portableHeaterHours === hrs
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {hrs} h
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onChange({
                          ...settings,
                          dailyKwh: Math.max(5, heaterDailyKwh),
                        })
                      }
                      className="text-xs font-medium text-teal-700 hover:text-teal-900 underline underline-offset-2 cursor-pointer whitespace-nowrap"
                    >
                      Aseta vertailukulutukseksi ({Math.max(5, heaterDailyKwh)} kWh/vrk)
                    </button>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 font-mono tabular-nums">
                    <span>Teho: {formatNumber(heaterKw, 1)} kWh/h</span>
                    <span aria-hidden="true">·</span>
                    <span>Hinta nyt: {formatEur(hourlyCostEur, 2)}/h</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {settings.portableHeaterHours} h/vrk: {formatNumber(heaterKw * settings.portableHeaterHours, 1)} kWh ({formatEur(dailyHeaterCostEur, 2)}/vrk)
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">COP-kerroin</label>
                <input
                  type="number"
                  step={0.1}
                  min={0.8}
                  max={5.5}
                  value={settings.electricCop}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      electricCop: Math.max(0.8, Number(e.target.value) || 1),
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Marginaali (snt)</label>
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={5}
                  value={settings.marginCents}
                  onChange={(e) =>
                    onChange({ ...settings, marginCents: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Siirto (snt/kWh)</label>
                <input
                  type="number"
                  step={0.1}
                  min={0}
                  max={20}
                  value={settings.transferCents}
                  onChange={(e) =>
                    onChange({
                      ...settings,
                      transferCents: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Sähkövero (snt)</label>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  max={10}
                  value={settings.taxCents}
                  onChange={(e) =>
                    onChange({ ...settings, taxCents: Math.max(0, Number(e.target.value) || 0) })
                  }
                  className="w-full px-2.5 py-1.5 text-sm font-mono tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900"
                />
              </div>
            </div>

            {/* Optional spot override simulation */}
            <div className="pt-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label className="text-slate-600 font-medium">
                  Testaa pörssisähkön hintapiikkiä manuaalisesti
                </label>
                {settings.manualSpotOverride !== null ? (
                  <button
                    type="button"
                    onClick={() => onChange({ ...settings, manualSpotOverride: null })}
                    className="text-teal-700 hover:text-teal-900 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Käytä live-hintaa ({formatNumber(liveSpotCents, 2)} snt)
                  </button>
                ) : (
                  <span className="text-slate-400">Käytössä live-hinta</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={-2}
                  max={60}
                  step={0.5}
                  value={settings.manualSpotOverride ?? liveSpotCents}
                  onChange={(e) =>
                    onChange({ ...settings, manualSpotOverride: Number(e.target.value) })
                  }
                  className="flex-1 energy-slider"
                />
                <span className="w-24 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums">
                  {formatNumber(settings.manualSpotOverride ?? liveSpotCents, 1)} snt/kWh
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Oil & Firewood */}
        <div className="space-y-6">
          {/* Firewood */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Polttopuu ja tulisija</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {WOOD_UNIT_OPTIONS.map((opt) => {
                const active = settings.woodUnitType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleWoodUnitChange(opt.id)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{opt.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {opt.kwhPerUnit} kWh / {opt.unitLabel}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <label className="text-slate-600 font-medium">
                    Puun hinta (€ / {woodMeta.unitLabel})
                  </label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatNumber(
                      settings.woodPriceEurPerUnit,
                      isSmallBag || settings.woodPriceEurPerUnit % 1 !== 0 ? 2 : 0
                    )}{' '}
                    €
                  </span>
                </div>
                <input
                  type="range"
                  min={isSmallBag ? 4 : 0}
                  max={isSmallBag ? 20 : 220}
                  step={isSmallBag ? 0.1 : 2}
                  value={settings.woodPriceEurPerUnit}
                  onChange={(e) =>
                    onChange({ ...settings, woodPriceEurPerUnit: Number(e.target.value) })
                  }
                  className="w-full energy-slider"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <label className="text-slate-600 font-medium">Tulisijan hyötysuhde</label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {settings.woodEfficiencyPct} %
                  </span>
                </div>
                <input
                  type="range"
                  min={45}
                  max={92}
                  step={1}
                  value={settings.woodEfficiencyPct}
                  onChange={(e) =>
                    onChange({ ...settings, woodEfficiencyPct: Number(e.target.value) })
                  }
                  className="w-full energy-slider"
                />
              </div>
            </div>

            <div className="mt-3 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Kulutus tänään:{' '}
                <strong className="font-mono text-slate-700 tabular-nums">
                  {formatNumber(dailyWoodUnitsNeeded, isSmallBag ? 1 : 2)} {woodMeta.unitLabel}/vrk
                </strong>
              </span>
              {isSmallBag && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-700">
                    Pikkupusseissa puu maksaa{' '}
                    <strong className="font-mono tabular-nums">
                      {formatNumber((settings.woodPriceEurPerUnit / woodMeta.kwhPerUnit) * 1010, 0)} €/i-m³
                    </strong>{' '}
                    vastaavan hinnan
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Heating Oil */}
          <div className="pt-5 border-t border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Lämmitysöljy (kevyt polttoöljy / pumpputankkaus)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {OIL_PURCHASE_OPTIONS.map((opt) => {
                const active = settings.oilPurchaseMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleOilModeChange(opt.id)}
                    className={`text-left px-3.5 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-medium truncate">{opt.label}</div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {opt.description}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <label className="text-slate-600 font-medium">Öljyn hinta (€ / litra)</label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatNumber(settings.oilPriceEurPerLiter, 2)} €
                  </span>
                </div>
                <input
                  type="range"
                  min={0.9}
                  max={3.2}
                  step={0.02}
                  value={settings.oilPriceEurPerLiter}
                  onChange={(e) =>
                    onChange({ ...settings, oilPriceEurPerLiter: Number(e.target.value) })
                  }
                  className="w-full energy-slider"
                />
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs mb-1.5">
                  <label className="text-slate-600 font-medium">Öljykattilan hyötysuhde</label>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {settings.oilEfficiencyPct} %
                  </span>
                </div>
                <input
                  type="range"
                  min={65}
                  max={96}
                  step={1}
                  value={settings.oilEfficiencyPct}
                  onChange={(e) =>
                    onChange({ ...settings, oilEfficiencyPct: Number(e.target.value) })
                  }
                  className="w-full energy-slider"
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>
                Kulutus tänään:{' '}
                <strong className="font-mono text-slate-700 tabular-nums">
                  {formatNumber(dailyOilLitersNeeded, 1)} l/vrk
                </strong>
              </span>
              <span aria-hidden="true">·</span>
              {settings.oilPurchaseMode === 'pump_retail' ? (
                <span>
                  10 l kannu pumpulta maksaa{' '}
                  <strong className="font-mono text-slate-700 tabular-nums">
                    {formatNumber(settings.oilPriceEurPerLiter * 10, 2)} €
                  </strong>
                </span>
              ) : (
                <span>
                  1 000 l erä maksaa{' '}
                  <strong className="font-mono text-slate-700 tabular-nums">
                    {formatNumber(settings.oilPriceEurPerLiter * 1000, 0)} €
                  </strong>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
