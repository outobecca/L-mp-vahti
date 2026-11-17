export type FuelId = 'electricity' | 'wood' | 'oil';

export type ElectricSystemType =
  | 'direct'
  | 'oil_radiator'
  | 'construction_heater'
  | 'air_pump'
  | 'air_water_pump'
  | 'ground_pump';

export type WoodUnitType =
  | 'birch_loose'
  | 'birch_stacked'
  | 'mixed_loose'
  | 'custom_own'
  | 'small_bag';

export type OilPurchaseMode = 'bulk_tank' | 'pump_retail';

export interface SpotPricePoint {
  startDate: string;
  endDate: string;
  priceCents: number;
}

export interface MarketBenchmarks {
  oilEurPerLiter: number;
  oilBenchmarkNote: string;
  birchLooseEur: number;
  birchStackedEur: number;
  mixedLooseEur: number;
  woodBenchmarkNote: string;
  transferCents: number;
  taxCents: number;
  marginCents: number;
  electricityBenchmarkNote: string;
}

export interface MarketDataResponse {
  spotPrices: SpotPricePoint[];
  fetchedAt: string;
  isLive: boolean;
  source: string;
  marketBenchmarks: MarketBenchmarks;
}

export interface HeatingSettings {
  homeSizeM2: number;
  outsideTempC: number;
  dailyKwh: number;
  electricSystem: ElectricSystemType;
  electricCop: number;
  portableHeaterWatts: number;
  portableHeaterHours: number;
  marginCents: number;
  transferCents: number;
  taxCents: number;
  oilPurchaseMode: OilPurchaseMode;
  oilPriceEurPerLiter: number;
  oilEfficiencyPct: number;
  woodUnitType: WoodUnitType;
  woodPriceEurPerUnit: number;
  woodEfficiencyPct: number;
  manualSpotOverride: number | null;
}

export interface FuelEvaluation {
  id: FuelId;
  name: string;
  shortName: string;
  systemLabel: string;
  effectiveCentsPerKwh: number;
  rawPriceLabel: string;
  efficiencyLabel: string;
  hourlyCostEur: number;
  dailyCostEur: number;
  monthlyCostEur: number;
  annualCostEur: number;
  rank: number;
  isRecommended: boolean;
  deltaPercentVsBest: number;
  savingsPerDayVsThis: number;
  savingsPerMonthVsThis: number;
  savingsPerYearVsThis: number;
}

export interface HourlySimulationPoint {
  startDate: string;
  endDate: string;
  helsinkiHour: number;
  helsinkiDateLabel: string;
  helsinkiTimeLabel: string;
  isCurrentHour: boolean;
  isTomorrow: boolean;
  spotPriceCents: number;
  purchasedElectricityCents: number;
  effectiveElectricityCents: number;
  effectiveWoodCents: number;
  effectiveOilCents: number;
  bestFuel: FuelId;
  bestCostCents: number;
  hourlySavingsVsSecondBestEur: number;
  hourlySavingsVsOilEur: number;
}

export interface HybridSummary {
  windowHours: number;
  electricityBestHours: number;
  woodBestHours: number;
  oilBestHours: number;
  cheapestElectricWindowLabel: string;
  cheapestElectricAvgCents: number;
  hybridDailyCostEur: number;
  electricityOnlyDailyCostEur: number;
  woodOnlyDailyCostEur: number;
  oilOnlyDailyCostEur: number;
  hybridSavingsVsWorstDailyEur: number;
  hybridSavingsVsElectricityOnlyDailyEur: number;
  hybridSavingsVsOilOnlyDailyEur: number;
  woodBreakevenSpotCents: number;
  oilBreakevenSpotCents: number;
}
