import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ArrowRight, Flame, Zap, Droplets, AlertTriangle, Info } from 'lucide-react';
import type { HeatingSettings, MarketDataResponse } from './types/energy';
import {
  DEFAULT_SETTINGS,
  HOME_SIZE_PRESETS,
  estimateDailyKwh,
  evaluateHeatingOptions,
  findCurrentSpotPrice,
  formatCents,
  formatEur,
  formatNumber,
  getHelsinkiParts,
  getRecommendationWarnings,
  simulateHourlySchedule,
} from './utils/heatingMath';
import { loadMarketData } from './utils/marketClient';
import { FuelComparisonGrid } from './components/FuelComparisonGrid';
import { HourlySpotChart } from './components/HourlySpotChart';
import { SavingsCalculatorPanel } from './components/SavingsCalculatorPanel';
import { HourlyTableView } from './components/HourlyTableView';
import { MatrixView } from './components/MatrixView';

type ActiveTab = 'overview' | 'hourly' | 'matrix' | 'settings';

const STORAGE_KEY = 'lampovahti_settings_v1';

function loadSavedSettings(): HeatingSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<HeatingSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [marketData, setMarketData] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [settings, setSettings] = useState<HeatingSettings>(loadSavedSettings);
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  const fetchMarketData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setErrorMsg(null);

    try {
      const data = await loadMarketData(isManualRefresh);
      setMarketData(data);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Markkinahintojen lataus epäonnistui.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData(false);
    const interval = setInterval(() => fetchMarketData(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const trueLiveSpotPoint = useMemo(() => {
    if (!marketData) return null;
    return findCurrentSpotPrice(marketData.spotPrices);
  }, [marketData]);

  const currentSpotPoint = useMemo(() => {
    if (!marketData) return null;
    if (selectedStartDate) {
      const matched = marketData.spotPrices.find((p) => p.startDate === selectedStartDate);
      if (matched) return matched;
    }
    return trueLiveSpotPoint;
  }, [marketData, selectedStartDate, trueLiveSpotPoint]);

  const handleSelectHour = useCallback((startDate: string | null) => {
    setSelectedStartDate(startDate);
    if (startDate !== null) {
      setSettings((prev) =>
        prev.manualSpotOverride !== null ? { ...prev, manualSpotOverride: null } : prev
      );
    }
  }, []);

  const liveSpotCents = currentSpotPoint?.priceCents ?? 8.5;
  const trueLiveSpotCents = trueLiveSpotPoint?.priceCents ?? 8.5;

  const evaluations = useMemo(
    () => evaluateHeatingOptions(liveSpotCents, settings),
    [liveSpotCents, settings]
  );

  const simulation = useMemo(() => {
    const prices = marketData?.spotPrices ?? [];
    return simulateHourlySchedule(prices, settings);
  }, [marketData, settings]);

  const recommended = evaluations[0];
  const secondBest = evaluations[1];
  const mostExpensive = evaluations[2];

  const recommendationWarnings = useMemo(
    () => getRecommendationWarnings(recommended, settings),
    [recommended, settings]
  );

  const inspectedTimeLabel = useMemo(() => {
    if (!currentSpotPoint) return 'Nykyhetki';
    const parts = getHelsinkiParts(currentSpotPoint.startDate);
    return `${parts.dateStr} klo ${String(parts.hour).padStart(2, '0')}:00`;
  }, [currentSpotPoint]);

  const fetchedTimeLabel = useMemo(() => {
    if (!marketData?.fetchedAt) return '';
    return new Intl.DateTimeFormat('fi-FI', {
      timeZone: 'Europe/Helsinki',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(marketData.fetchedAt));
  }, [marketData]);

  const RecommendedIcon =
    recommended.id === 'electricity'
      ? Zap
      : recommended.id === 'wood'
      ? Flame
      : Droplets;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('overview');
            }}
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            Lämpövahti
          </a>

          {/* Zone 2: Concise single-line navigation links */}
          <nav
            aria-label="Päävalikko"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'overview'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Yleiskatsaus
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hourly')}
              className={`py-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'hourly'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Tuntiennuste
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`py-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'matrix'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Säästömatriisi
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`py-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'settings'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              Laitteistoasetukset
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => fetchMarketData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Päivitetään...' : 'Päivitä hinnat'}
            </button>
          </div>
        </div>

        {/* Mobile navigation row */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`py-1 whitespace-nowrap shrink-0 ${
              activeTab === 'overview' ? 'text-slate-900 font-semibold' : 'text-slate-500'
            }`}
          >
            Yleiskatsaus
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hourly')}
            className={`py-1 whitespace-nowrap shrink-0 ${
              activeTab === 'hourly' ? 'text-slate-900 font-semibold' : 'text-slate-500'
            }`}
          >
            Tuntiennuste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`py-1 whitespace-nowrap shrink-0 ${
              activeTab === 'matrix' ? 'text-slate-900 font-semibold' : 'text-slate-500'
            }`}
          >
            Säästömatriisi
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-1 whitespace-nowrap shrink-0 ${
              activeTab === 'settings' ? 'text-slate-900 font-semibold' : 'text-slate-500'
            }`}
          >
            Asetukset
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Clean unboxed market status metadata line */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Tarkasteluhetki: <strong className="text-slate-700 font-medium">{inspectedTimeLabel}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Pörssihintalähde:{' '}
              <strong className="text-slate-700 font-medium">
                {marketData?.source ?? 'Haetaan markkinadataa...'}
              </strong>
            </span>
            {fetchedTimeLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Haettu klo {fetchedTimeLabel}</span>
              </>
            )}
            {settings.manualSpotOverride !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-medium">
                  Manuaalinen spot-testi käytössä ({formatNumber(settings.manualSpotOverride, 1)} snt/kWh)
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg">
              {HOME_SIZE_PRESETS.map((preset) => {
                const active = settings.homeSizeM2 === preset.m2;
                return (
                  <button
                    key={preset.m2}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        homeSizeM2: preset.m2,
                        dailyKwh: estimateDailyKwh(preset.m2, prev.outsideTempC),
                      }))
                    }
                    className={`px-2.5 py-1 text-xs font-mono tabular-nums rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
            <span className="font-mono tabular-nums">
              {settings.homeSizeM2} m² · Tilat {settings.dailyKwh} kWh
              {settings.includeHotWater ? ` + Vesi ${settings.hotWaterKwhPerDay} kWh` : ''}/vrk
            </span>
          </div>
        </div>

        {/* Error state */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between gap-4 text-sm text-red-800">
            <span>Markkinahintojen haku epäonnistui: {errorMsg}</span>
            <button
              type="button"
              onClick={() => fetchMarketData(true)}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer whitespace-nowrap"
            >
              Yritä uudelleen
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !marketData ? (
          <div className="space-y-6" aria-busy="true" aria-label="Ladataan hintatietoja">
            <div className="h-44 bg-white border border-slate-200 rounded-xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
              <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
              <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Dominant Focal Anchor: Current Recommendation & Real-Time Savings */}
                <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    <div className="lg:col-span-7 space-y-3">
                      <p className="text-xs font-medium text-emerald-700 flex items-center gap-1.5">
                        <RecommendedIcon className="w-4 h-4" />
                        Suositeltava lämmitysmuoto{' '}
                        {selectedStartDate ? 'valitulle tunnille' : 'juuri nyt'}
                      </p>

                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                        Lämmitä nyt: {recommended.name}
                      </h1>

                      <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
                        Tilalämmityksen yksikköhinta on{' '}
                        <strong className="font-mono text-slate-900 tabular-nums">
                          {formatCents(recommended.effectiveCentsPerKwh, 2)}
                        </strong>{' '}
                        ja kokonaiskustannus{' '}
                        <strong className="font-mono text-slate-900 tabular-nums">
                          {formatEur(recommended.dailyCostEur, 2)}/vrk
                        </strong>
                        {settings.includeHotWater
                          ? ` (tilat ${formatEur(recommended.spaceHeatingDailyCostEur, 2)} € + käyttövesi ${formatEur(
                              recommended.hotWaterDailyCostEur,
                              2
                            )} €)`
                          : ''}
                        . Säästät{' '}
                        <strong className="font-mono text-emerald-700 tabular-nums">
                          {formatEur(secondBest.savingsPerDayVsThis, 2)}/vrk
                        </strong>{' '}
                        verrattuna {secondBest.shortName.toLowerCase()}n ja{' '}
                        <strong className="font-mono text-emerald-700 tabular-nums">
                          {formatEur(mostExpensive.savingsPerDayVsThis, 2)}/vrk
                        </strong>{' '}
                        verrattuna kalleimpaan vaihtoehtoon ({mostExpensive.shortName.toLowerCase()}).
                      </p>
                    </div>

                    {/* Right KPI column (hairline separated, no nested cards) */}
                    <div className="lg:col-span-5 lg:border-l lg:border-slate-200 lg:pl-8 grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-slate-500">Säästö vs {secondBest.shortName}</p>
                        <p className="font-mono text-2xl sm:text-3xl font-semibold text-emerald-700 tabular-nums mt-1">
                          {formatEur(secondBest.savingsPerMonthVsThis, 0)}
                          <span className="text-sm font-normal text-slate-500"> / kk</span>
                        </p>
                        <p className="font-mono text-xs text-slate-500 tabular-nums mt-1">
                          {formatEur(secondBest.savingsPerYearVsThis, 0)} / vuosi
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Säästö vs {mostExpensive.shortName}</p>
                        <p className="font-mono text-2xl sm:text-3xl font-semibold text-emerald-700 tabular-nums mt-1">
                          {formatEur(mostExpensive.savingsPerMonthVsThis, 0)}
                          <span className="text-sm font-normal text-slate-500"> / kk</span>
                        </p>
                        <p className="font-mono text-xs text-slate-500 tabular-nums mt-1">
                          {formatEur(mostExpensive.savingsPerYearVsThis, 0)} / vuosi
                        </p>
                      </div>

                      <div className="col-span-2 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 text-xs">
                        <span className="text-slate-600">
                          Halvin 3 h sähköikkuna:{' '}
                          <strong className="font-mono text-slate-900 tabular-nums">
                            {simulation.summary.cheapestElectricWindowLabel}
                          </strong>{' '}
                          ({formatCents(simulation.summary.cheapestElectricAvgCents, 1)})
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveTab('matrix')}
                          className="inline-flex items-center gap-1 font-medium text-slate-900 hover:text-teal-700 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Säästömatriisi
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contextual Warning Sign based on user's equipment & hot water selections */}
                  {recommendationWarnings.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                      {recommendationWarnings.map((warn) => {
                        const isWarning = warn.severity === 'warning';
                        return (
                          <div
                            key={warn.id}
                            role="alert"
                            className={`rounded-lg border p-4 flex items-start gap-3 ${
                              isWarning
                                ? 'bg-amber-50 border-amber-300 text-amber-950'
                                : 'bg-slate-50 border-slate-200 text-slate-800'
                            }`}
                          >
                            {isWarning ? (
                              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                            ) : (
                              <Info className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                            )}
                            <div className="space-y-1 text-sm">
                              <p className="font-semibold leading-snug">{warn.title}</p>
                              <p
                                className={`leading-relaxed text-xs sm:text-sm ${
                                  isWarning ? 'text-amber-900' : 'text-slate-600'
                                }`}
                              >
                                {warn.body}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* 3-Column Comparison Grid */}
                <FuelComparisonGrid
                  evaluations={evaluations}
                  dailyKwh={settings.dailyKwh}
                  includeHotWater={settings.includeHotWater}
                  hotWaterKwhPerDay={settings.hotWaterKwhPerDay}
                />

                {/* 48h Interactive Chart */}
                <HourlySpotChart
                  points={simulation.points}
                  selectedStartDate={selectedStartDate}
                  onSelectHour={handleSelectHour}
                />

                {/* Full-width 4-KPI Summary Strip */}
                <section
                  aria-label="Keskeiset tunnusluvut"
                  className="bg-white border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
                >
                  <div className="p-5">
                    <p className="text-xs text-slate-500">Sähkö voittaa polttopuun</p>
                    <p className="font-mono text-xl font-semibold text-slate-900 tabular-nums mt-1">
                      Spot &lt; {formatNumber(simulation.summary.woodBreakevenSpotCents, 1)} snt
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {simulation.summary.electricityBestHours} / {simulation.summary.windowHours} tuntia jaksolla
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-slate-500">Sähkö voittaa öljyn</p>
                    <p className="font-mono text-xl font-semibold text-slate-900 tabular-nums mt-1">
                      Spot &lt; {formatNumber(simulation.summary.oilBreakevenSpotCents, 1)} snt
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Öljy edullisin {simulation.summary.oilBestHours} tunnilla
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-slate-500">Älykäs hybridiohjaus</p>
                    <p className="font-mono text-xl font-semibold text-emerald-700 tabular-nums mt-1">
                      {formatEur(simulation.summary.hybridDailyCostEur, 2)} / vrk
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Säästää {formatEur(simulation.summary.hybridSavingsVsElectricityOnlyDailyEur * 30.4, 0)}/kk vs pelkkä sähkö
                    </p>
                  </div>

                  <div className="p-5">
                    <p className="text-xs text-slate-500">Hybridisäästö vs öljylämmitys</p>
                    <p className="font-mono text-xl font-semibold text-emerald-700 tabular-nums mt-1">
                      {formatEur(simulation.summary.hybridSavingsVsOilOnlyDailyEur * 365, 0)} / vuosi
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatEur(simulation.summary.hybridSavingsVsOilOnlyDailyEur, 2)} / vrk nykytahdilla
                    </p>
                  </div>
                </section>

                {/* Real-time interactive simulator */}
                <SavingsCalculatorPanel
                  settings={settings}
                  liveSpotCents={trueLiveSpotCents}
                  onChange={setSettings}
                  onReset={() => setSettings(DEFAULT_SETTINGS)}
                />
              </div>
            )}

            {activeTab === 'hourly' && <HourlyTableView points={simulation.points} />}

            {activeTab === 'matrix' && (
              <MatrixView
                evaluations={evaluations}
                summary={simulation.summary}
                settings={settings}
                currentSpotCents={liveSpotCents}
              />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <SavingsCalculatorPanel
                  settings={settings}
                  liveSpotCents={trueLiveSpotCents}
                  onChange={setSettings}
                  onReset={() => setSettings(DEFAULT_SETTINGS)}
                />

                {/* Transparent methodology & Finnish market benchmarks */}
                <section className="bg-white border border-slate-200 rounded-xl p-6">
                  <h2 className="text-base font-semibold text-slate-900">
                    Laskentaperusteet ja energiasisällöt
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 text-sm text-slate-600">
                    <div>
                      <h3 className="font-medium text-slate-900">Pörssisähkö</h3>
                      <p className="mt-1 leading-relaxed">
                        {marketData?.marketBenchmarks.electricityBenchmarkNote} Kaava: (Spot + marginaali + siirto + sähkövero) / COP.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Polttopuu</h3>
                      <p className="mt-1 leading-relaxed">
                        {marketData?.marketBenchmarks.woodBenchmarkNote} Kuivan koivuklapin energiasisältö on n. 1 010 kWh/i-m³ ja 1 700 kWh/p-m³.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium text-slate-900">Lämmitysöljy</h3>
                      <p className="mt-1 leading-relaxed">
                        {marketData?.marketBenchmarks.oilBenchmarkNote} Kevyen polttoöljyn lämpöarvo on 10,0 kWh/litra.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>Lämpövahti · Lämmitysenergian reaaliaikainen vertailutyökalu</span>
          <span>Pörssisähködata: Nord Pool FI (sis. ALV 25,5 %) · Ajat Suomen ajassa (EET/EEST)</span>
        </div>
      </footer>
    </div>
  );
}
