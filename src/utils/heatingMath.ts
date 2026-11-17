import type {
  ElectricSystemType,
  FuelEvaluation,
  FuelId,
  HeatingSettings,
  HourlySimulationPoint,
  HybridSummary,
  OilPurchaseMode,
  OilSystemType,
  RecommendationWarning,
  SpotPricePoint,
  WoodSystemType,
  WoodUnitType,
} from '../types/energy';

export const ELECTRIC_SYSTEM_OPTIONS: Array<{
  id: ElectricSystemType;
  label: string;
  defaultCop: number;
  defaultWatts?: number;
  description: string;
}> = [
  {
    id: 'direct',
    label: 'Suora sähkölämmitys / Sähkökattila',
    defaultCop: 1.0,
    description: 'Hyötysuhde 100 % (COP 1,0)',
  },
  {
    id: 'oil_radiator',
    label: 'Öljypatteri (500 W – 2 kW)',
    defaultCop: 1.0,
    defaultWatts: 1500,
    description: 'Sähkökäyttöinen öljytäytteinen patteri · COP 1,0',
  },
  {
    id: 'construction_heater',
    label: 'Rakennuslämmitin (500 W – 3 kW)',
    defaultCop: 1.0,
    defaultWatts: 2000,
    description: 'Lämpöpuhallin / työmaalämmitin · COP 1,0',
  },
  {
    id: 'air_pump',
    label: 'Ilmalämpöpumppu',
    defaultCop: 2.3,
    description: 'Tyypillinen lämpökerroin COP 2,1–2,6',
  },
  {
    id: 'air_water_pump',
    label: 'Vesi-ilmalämpöpumppu (VILP)',
    defaultCop: 2.7,
    description: 'Tyypillinen lämpökerroin COP 2,5–3,0',
  },
  {
    id: 'ground_pump',
    label: 'Maalämpöpumppu',
    defaultCop: 3.5,
    description: 'Korkea ympärivuotinen COP 3,2–4,0',
  },
];

export const PORTABLE_HEATER_WATTS_PRESETS = [500, 1000, 1500, 2000, 3000];

export function formatWattsLabel(watts: number): string {
  if (watts >= 1000 && watts % 1000 === 0) {
    return `${watts / 1000} kW`;
  }
  if (watts >= 1000) {
    return `${formatNumber(watts / 1000, 1)} kW`;
  }
  return `${watts} W`;
}

export const WOOD_UNIT_OPTIONS: Array<{
  id: WoodUnitType;
  label: string;
  fuelTitle: string;
  shortTitle: string;
  unitLabel: string;
  kwhPerUnit: number;
  defaultPriceEur: number;
  defaultEfficiencyPct: number;
  minPrice: number;
  maxPrice: number;
  priceStep: number;
  description: string;
}> = [
  {
    id: 'birch_loose',
    label: 'Koivuklapi (heittomotti)',
    fuelTitle: 'Polttopuu',
    shortTitle: 'Polttopuu',
    unitLabel: 'i-m³',
    kwhPerUnit: 1010,
    defaultPriceEur: 88,
    defaultEfficiencyPct: 82,
    minPrice: 0,
    maxPrice: 220,
    priceStep: 2,
    description: 'Kuiva koivu ~1 010 kWh / irtokuutio',
  },
  {
    id: 'birch_stacked',
    label: 'Koivuklapi (pinokuutio)',
    fuelTitle: 'Polttopuu',
    shortTitle: 'Polttopuu',
    unitLabel: 'p-m³',
    kwhPerUnit: 1700,
    defaultPriceEur: 138,
    defaultEfficiencyPct: 82,
    minPrice: 0,
    maxPrice: 260,
    priceStep: 2,
    description: 'Tiiviisti ladottu koivu ~1 700 kWh / pinokuutio',
  },
  {
    id: 'mixed_loose',
    label: 'Sekapuu (heittomotti)',
    fuelTitle: 'Polttopuu',
    shortTitle: 'Polttopuu',
    unitLabel: 'i-m³',
    kwhPerUnit: 850,
    defaultPriceEur: 72,
    defaultEfficiencyPct: 82,
    minPrice: 0,
    maxPrice: 200,
    priceStep: 2,
    description: 'Havupuu / sekapuu ~850 kWh / irtokuutio',
  },
  {
    id: 'custom_own',
    label: 'Oma polttopuu (heittomotti)',
    fuelTitle: 'Polttopuu',
    shortTitle: 'Polttopuu',
    unitLabel: 'i-m³',
    kwhPerUnit: 980,
    defaultPriceEur: 28,
    defaultEfficiencyPct: 82,
    minPrice: 0,
    maxPrice: 150,
    priceStep: 2,
    description: 'Omakustannushinta (kaato, pilkonta, kuljetus)',
  },
  {
    id: 'small_bag',
    label: 'Klapisäkki 40 l (pikkupussi)',
    fuelTitle: 'Polttopuu',
    shortTitle: 'Polttopuu',
    unitLabel: 'pussi',
    kwhPerUnit: 50,
    defaultPriceEur: 9.9,
    defaultEfficiencyPct: 82,
    minPrice: 4,
    maxPrice: 20,
    priceStep: 0.1,
    description: 'Kauppa / huoltoasema ~50 kWh / pussi',
  },
  {
    id: 'briquette_pack',
    label: 'Puubriketti (10 kg paketti)',
    fuelTitle: 'Puubriketti',
    shortTitle: 'Briketti',
    unitLabel: '10 kg',
    kwhPerUnit: 50,
    defaultPriceEur: 5.5,
    defaultEfficiencyPct: 84,
    minPrice: 2,
    maxPrice: 14,
    priceStep: 0.1,
    description: 'Kuiva briketti ~5,0 kWh/kg · 50 kWh / paketti',
  },
  {
    id: 'briquette_pallet',
    label: 'Puubriketti (500 kg lava)',
    fuelTitle: 'Puubriketti',
    shortTitle: 'Briketti',
    unitLabel: '500 kg',
    kwhPerUnit: 2500,
    defaultPriceEur: 260,
    defaultEfficiencyPct: 84,
    minPrice: 100,
    maxPrice: 450,
    priceStep: 5,
    description: 'Brikettilava ~5,0 kWh/kg · 2 500 kWh / lava',
  },
  {
    id: 'pellet_bag',
    label: 'Puupelletti (15 kg säkki)',
    fuelTitle: 'Puupelletti',
    shortTitle: 'Pelletti',
    unitLabel: '15 kg',
    kwhPerUnit: 72.8,
    defaultPriceEur: 8.5,
    defaultEfficiencyPct: 88,
    minPrice: 4,
    maxPrice: 16,
    priceStep: 0.1,
    description: 'Pikkusäkki ~4,85 kWh/kg · 72,8 kWh / säkki',
  },
  {
    id: 'pellet_ton',
    label: 'Puupelletti (suursäkki / 1 000 kg)',
    fuelTitle: 'Puupelletti',
    shortTitle: 'Pelletti',
    unitLabel: 't',
    kwhPerUnit: 4850,
    defaultPriceEur: 390,
    defaultEfficiencyPct: 89,
    minPrice: 200,
    maxPrice: 700,
    priceStep: 5,
    description: 'Suursäkki tai irtotoimitus ~4 850 kWh / t',
  },
];

export const OIL_PURCHASE_OPTIONS: Array<{
  id: OilPurchaseMode;
  label: string;
  defaultPriceEur: number;
  description: string;
}> = [
  {
    id: 'bulk_tank',
    label: 'Säiliötoimitus (kotiin)',
    defaultPriceEur: 1.82,
    description: 'Tukkutoimitus omaan öljysäiliöön (1 000 l+)',
  },
  {
    id: 'pump_retail',
    label: 'Pumpulta litra kerrallaan',
    defaultPriceEur: 2.05,
    description: 'Kannuhaku huoltoasemalta (MPÖ / diesel)',
  },
];

export const WOOD_SYSTEM_OPTIONS: Array<{
  id: WoodSystemType;
  label: string;
  canHeatHotWater: boolean;
  description: string;
}> = [
  {
    id: 'fireplace',
    label: 'Takka / leivinuuni (ilmalämmitys)',
    canHeatHotWater: false,
    description: 'Lämmittää huoneilmaa · ei lämmitä käyttövettä tai pattereita',
  },
  {
    id: 'wood_hydronic_boiler',
    label: 'Vesikiertoinen puukattila + varaaja',
    canHeatHotWater: true,
    description: 'Lämmittää vesikiertoiset patterit ja käyttöveden',
  },
];

export const OIL_SYSTEM_OPTIONS: Array<{
  id: OilSystemType;
  label: string;
  canHeatHotWater: boolean;
  description: string;
}> = [
  {
    id: 'hydronic_boiler',
    label: 'Vesikiertoiset patterit + käyttövesi',
    canHeatHotWater: true,
    description: 'Öljykattila lämmittää patteriverkon ja käyttöveden',
  },
  {
    id: 'hydronic_separate_dhw',
    label: 'Vesikiertoiset patterit (käyttövesi sähköllä)',
    canHeatHotWater: false,
    description: 'Patterit öljyllä, käyttövesi erillisellä sähkövaraajalla',
  },
];

export const HOT_WATER_PRESETS: Array<{ kwh: number; label: string }> = [
  { kwh: 6, label: '1 hlö · 6 kWh' },
  { kwh: 10, label: '2–3 hlö · 10 kWh' },
  { kwh: 15, label: '4–5 hlö · 15 kWh' },
  { kwh: 20, label: 'Suuri kulutus · 20 kWh' },
];

export const HOME_SIZE_PRESETS: Array<{ m2: number; label: string; hint: string }> = [
  { m2: 75, label: '75 m²', hint: 'Pieni talo / rivitalo' },
  { m2: 120, label: '120 m²', hint: 'Keskikokoinen talo' },
  { m2: 165, label: '165 m²', hint: 'Tilava omakotitalo' },
  { m2: 220, label: '220 m²', hint: 'Suuri kiinteistö' },
];

export const OUTSIDE_TEMP_PRESETS: Array<{ tempC: number; label: string }> = [
  { tempC: 5, label: '+5 °C Lauha' },
  { tempC: 0, label: '0 °C Nollakeli' },
  { tempC: -10, label: '-10 °C Pakkanen' },
  { tempC: -20, label: '-20 °C Kova pakkanen' },
];

export function estimateDailyKwh(homeSizeM2: number, outsideTempC: number): number {
  const kwhPerM2PerDay = Math.max(0.15, 0.48 + -outsideTempC * 0.032);
  return Math.max(15, Math.min(350, Math.round(homeSizeM2 * kwhPerM2PerDay)));
}

export const DEFAULT_SETTINGS: HeatingSettings = {
  homeSizeM2: 120,
  outsideTempC: 0,
  dailyKwh: 58,
  includeHotWater: true,
  hotWaterKwhPerDay: 10,
  dhwBackupFuel: 'electricity',
  electricSystem: 'direct',
  electricCop: 1.0,
  portableHeaterWatts: 1500,
  portableHeaterHours: 12,
  marginCents: 0.45,
  transferCents: 4.25,
  taxCents: 2.83,
  oilSystemType: 'hydronic_boiler',
  oilPurchaseMode: 'bulk_tank',
  oilPriceEurPerLiter: 1.82,
  oilEfficiencyPct: 88,
  woodSystemType: 'fireplace',
  woodUnitType: 'birch_loose',
  woodPriceEurPerUnit: 88,
  woodEfficiencyPct: 82,
  manualSpotOverride: null,
};

export function getWoodMeta(unitType: WoodUnitType) {
  return WOOD_UNIT_OPTIONS.find((item) => item.id === unitType) ?? WOOD_UNIT_OPTIONS[0];
}

export function getElectricMeta(systemType: ElectricSystemType) {
  return ELECTRIC_SYSTEM_OPTIONS.find((item) => item.id === systemType) ?? ELECTRIC_SYSTEM_OPTIONS[0];
}

export function getEffectiveOilCents(settings: HeatingSettings): number {
  // Light heating oil energy content: 10.0 kWh / liter
  const efficiency = Math.max(0.4, Math.min(1.0, settings.oilEfficiencyPct / 100));
  return (settings.oilPriceEurPerLiter * 100) / (10.0 * efficiency);
}

export function getEffectiveWoodCents(settings: HeatingSettings): number {
  const meta = getWoodMeta(settings.woodUnitType);
  const efficiency = Math.max(0.35, Math.min(0.95, settings.woodEfficiencyPct / 100));
  return (settings.woodPriceEurPerUnit * 100) / (meta.kwhPerUnit * efficiency);
}

export function getPurchasedElectricityCents(
  spotPriceCents: number,
  settings: HeatingSettings
): number {
  return spotPriceCents + settings.marginCents + settings.transferCents + settings.taxCents;
}

export function getEffectiveElectricityCents(
  spotPriceCents: number,
  settings: HeatingSettings
): number {
  const purchased = getPurchasedElectricityCents(spotPriceCents, settings);
  const cop = Math.max(0.8, settings.electricCop);
  return purchased / cop;
}

export function evaluateHeatingOptions(
  spotPriceCents: number,
  settings: HeatingSettings
): FuelEvaluation[] {
  const effectiveSpot = settings.manualSpotOverride ?? spotPriceCents;
  const purchasedElecCents = getPurchasedElectricityCents(effectiveSpot, settings);
  const elecCents = getEffectiveElectricityCents(effectiveSpot, settings);
  const woodCents = getEffectiveWoodCents(settings);
  const oilCents = getEffectiveOilCents(settings);

  const woodMeta = getWoodMeta(settings.woodUnitType);
  const elecMeta = getElectricMeta(settings.electricSystem);

  const dailyKwh = settings.dailyKwh;
  const hotWaterKwh = settings.includeHotWater ? settings.hotWaterKwhPerDay : 0;
  const totalKwh = dailyKwh + hotWaterKwh;

  const electricCanHeatDhw =
    settings.electricSystem === 'direct' ||
    settings.electricSystem === 'air_water_pump' ||
    settings.electricSystem === 'ground_pump';
  const electricSupportsHydronic =
    settings.electricSystem === 'direct' ||
    settings.electricSystem === 'air_water_pump' ||
    settings.electricSystem === 'ground_pump';

  const woodCanHeatDhw = settings.woodSystemType === 'wood_hydronic_boiler';
  const oilCanHeatDhw = settings.oilSystemType === 'hydronic_boiler';

  const calcDhwDailyCost = (
    id: FuelId,
    canHeatHotWater: boolean,
    ownEffectiveCents: number
  ): { costEur: number; sourceLabel: string } => {
    if (!settings.includeHotWater || hotWaterKwh <= 0) {
      return { costEur: 0, sourceLabel: 'Ei mukana vertailussa' };
    }
    if (canHeatHotWater) {
      return {
        costEur: (ownEffectiveCents * hotWaterKwh) / 100,
        sourceLabel: 'Sisältyy järjestelmään',
      };
    }
    if (settings.dhwBackupFuel === 'none') {
      return {
        costEur: 0,
        sourceLabel: 'Ei tuoteta',
      };
    }
    if (id === 'oil' && settings.oilSystemType === 'hydronic_separate_dhw') {
      return {
        costEur: (purchasedElecCents * hotWaterKwh) / 100,
        sourceLabel: `Sähkövaraaja (${formatNumber(purchasedElecCents, 1)} snt/kWh)`,
      };
    }
    if (settings.dhwBackupFuel === 'oil') {
      return {
        costEur: (oilCents * hotWaterKwh) / 100,
        sourceLabel: `Öljykattila (${formatNumber(oilCents, 1)} snt/kWh)`,
      };
    }
    return {
      costEur: (purchasedElecCents * hotWaterKwh) / 100,
      sourceLabel: `Sähkövaraaja (${formatNumber(purchasedElecCents, 1)} snt/kWh)`,
    };
  };

  const elecDhw = calcDhwDailyCost('electricity', electricCanHeatDhw, elecCents);
  const woodDhw = calcDhwDailyCost('wood', woodCanHeatDhw, woodCents);
  const oilDhw = calcDhwDailyCost('oil', oilCanHeatDhw, oilCents);

  const rawItems: Array<{
    id: FuelId;
    name: string;
    shortName: string;
    systemLabel: string;
    canHeatHotWater: boolean;
    supportsHydronicRadiators: boolean;
    effectiveCentsPerKwh: number;
    rawPriceLabel: string;
    efficiencyLabel: string;
    spaceHeatingDailyCostEur: number;
    hotWaterDailyCostEur: number;
    hotWaterSourceLabel: string;
    dailyCostEur: number;
  }> = [
    {
      id: 'electricity',
      name: 'Pörssisähkö',
      shortName: 'Sähkö',
      systemLabel:
        settings.electricSystem === 'oil_radiator'
          ? `Öljypatteri (${formatWattsLabel(settings.portableHeaterWatts)})`
          : settings.electricSystem === 'construction_heater'
          ? `Rakennuslämmitin (${formatWattsLabel(settings.portableHeaterWatts)})`
          : elecMeta.label,
      canHeatHotWater: electricCanHeatDhw,
      supportsHydronicRadiators: electricSupportsHydronic,
      effectiveCentsPerKwh: elecCents,
      rawPriceLabel: `${formatNumber(effectiveSpot, 2)} snt spot + ${formatNumber(
        settings.marginCents + settings.transferCents + settings.taxCents,
        2
      )} snt siirto/vero (${formatNumber(purchasedElecCents, 2)} snt/kWh)`,
      efficiencyLabel: `Lämpökerroin COP ${formatNumber(settings.electricCop, 1)}`,
      spaceHeatingDailyCostEur: (elecCents * dailyKwh) / 100,
      hotWaterDailyCostEur: elecDhw.costEur,
      hotWaterSourceLabel: elecDhw.sourceLabel,
      dailyCostEur: (elecCents * dailyKwh) / 100 + elecDhw.costEur,
    },
    {
      id: 'wood',
      name: settings.woodSystemType === 'fireplace' ? `${woodMeta.fuelTitle} (takka)` : `${woodMeta.fuelTitle} (vesikierto)`,
      shortName: woodMeta.shortTitle,
      systemLabel: `${woodMeta.label} · ${
        settings.woodSystemType === 'fireplace' ? 'Takka / leivinuuni' : 'Vesikiertoinen puukattila'
      }`,
      canHeatHotWater: woodCanHeatDhw,
      supportsHydronicRadiators: woodCanHeatDhw,
      effectiveCentsPerKwh: woodCents,
      rawPriceLabel: `${formatNumber(
        settings.woodPriceEurPerUnit,
        woodMeta.priceStep < 1 || settings.woodPriceEurPerUnit % 1 !== 0 ? 2 : 0
      )} € / ${woodMeta.unitLabel} (${formatNumber(woodMeta.kwhPerUnit, woodMeta.kwhPerUnit % 1 !== 0 ? 1 : 0)} kWh)`,
      efficiencyLabel: `${
        woodMeta.fuelTitle === 'Puupelletti'
          ? 'Pellettikattilan / -takan hyötysuhde'
          : 'Tulisijan hyötysuhde'
      } ${settings.woodEfficiencyPct} %`,
      spaceHeatingDailyCostEur: (woodCents * dailyKwh) / 100,
      hotWaterDailyCostEur: woodDhw.costEur,
      hotWaterSourceLabel: woodDhw.sourceLabel,
      dailyCostEur: (woodCents * dailyKwh) / 100 + woodDhw.costEur,
    },
    {
      id: 'oil',
      name: 'Lämmitysöljy',
      shortName: 'Öljy',
      systemLabel: `${
        settings.oilSystemType === 'hydronic_boiler'
          ? 'Vesikiertoiset patterit + käyttövesi'
          : 'Vesikiertoiset patterit (käyttövesi sähköllä)'
      } · ${
        settings.oilPurchaseMode === 'pump_retail' ? 'Pumpulta' : 'Säiliö'
      }`,
      canHeatHotWater: oilCanHeatDhw,
      supportsHydronicRadiators: true,
      effectiveCentsPerKwh: oilCents,
      rawPriceLabel: `${formatNumber(settings.oilPriceEurPerLiter, 2)} € / litra`,
      efficiencyLabel: `Kattilan hyötysuhde ${settings.oilEfficiencyPct} %`,
      spaceHeatingDailyCostEur: (oilCents * dailyKwh) / 100,
      hotWaterDailyCostEur: oilDhw.costEur,
      hotWaterSourceLabel: oilDhw.sourceLabel,
      dailyCostEur: (oilCents * dailyKwh) / 100 + oilDhw.costEur,
    },
  ];

  const sorted = [...rawItems].sort((a, b) => a.dailyCostEur - b.dailyCostEur);
  const best = sorted[0];

  return sorted.map((item, index) => {
    const hourlyCostEur = item.dailyCostEur / 24;
    const monthlyCostEur = item.dailyCostEur * 30.4;
    const annualCostEur = item.dailyCostEur * 365;
    const blendedCentsPerKwh = totalKwh > 0 ? (item.dailyCostEur * 100) / totalKwh : item.effectiveCentsPerKwh;

    const savingsPerDayVsThis = Math.max(0, item.dailyCostEur - best.dailyCostEur);
    const deltaPercentVsBest =
      best.dailyCostEur > 0
        ? ((item.dailyCostEur - best.dailyCostEur) / best.dailyCostEur) * 100
        : item.dailyCostEur > best.dailyCostEur
        ? 100
        : 0;

    return {
      ...item,
      blendedCentsPerKwh,
      rank: index + 1,
      isRecommended: index === 0,
      hourlyCostEur,
      monthlyCostEur,
      annualCostEur,
      deltaPercentVsBest,
      savingsPerDayVsThis,
      savingsPerMonthVsThis: savingsPerDayVsThis * 30.4,
      savingsPerYearVsThis: savingsPerDayVsThis * 365,
    };
  });
}

export function getRecommendationWarnings(
  recommended: FuelEvaluation,
  settings: HeatingSettings
): RecommendationWarning[] {
  const warnings: RecommendationWarning[] = [];

  if (!recommended.canHeatHotWater) {
    if (recommended.id === 'wood' && settings.woodSystemType === 'fireplace') {
      warnings.push({
        id: 'fireplace_no_dhw',
        severity: 'warning',
        title: 'Huomio käyttövedestä ja vesikierrosta: Takalla ei voi lämmittää käyttövettä',
        body: !settings.includeHotWater
          ? `Takka lämmittää vain huoneilmaa eikä lämmitä käyttövettä. Ota käyttövesi mukaan laskuriin nähdäksesi erillisen sähkövaraajan tai öljykattilan todellisen lisäkustannuksen.`
          : settings.dhwBackupFuel === 'none'
          ? `Takka lämmittää vain huoneilmaa eikä tuota käyttövettä tai pattereiden kiertovettä. Käyttöveden tuotannoksi on valittu "Ei tuoteta" (0,00 €/vrk) — lämmintä käyttövettä ei siis tällä valinnalla synny ilman erillistä varaajaa tai kattilaa.`
          : `Takka lämmittää vain huoneilmaa eikä tuota käyttövettä tai pattereiden kiertovettä. Lämpimän käyttöveden (${settings.hotWaterKwhPerDay} kWh/vrk) osuus (${formatEur(
              recommended.hotWaterDailyCostEur,
              2
            )}/vrk · ${recommended.hotWaterSourceLabel}) on laskettu mukaan kokonaiskustannukseen.`,
      });
    } else if (recommended.id === 'electricity') {
      warnings.push({
        id: 'electric_no_dhw',
        severity: 'warning',
        title: `Huomio käyttövedestä: ${recommended.systemLabel} ei lämmitä käyttövettä`,
        body: !settings.includeHotWater
          ? `Valittu lämmityslaite lämmittää vain huoneilmaa. Käyttöveden lämmitykseen tarvitaan erillinen sähkövaraaja tai öljykattila.`
          : settings.dhwBackupFuel === 'none'
          ? `Valittu lämmityslaite lämmittää vain huoneilmaa, ja käyttöveden tuotannoksi on valittu "Ei tuoteta" (0,00 €/vrk). Lämpimään käyttöveteen tarvitaan erillinen varaaja tai kattila.`
          : `Valittu lämmityslaite lämmittää vain huoneilmaa. Lämpimän käyttöveden (${settings.hotWaterKwhPerDay} kWh/vrk) osuus (${formatEur(
              recommended.hotWaterDailyCostEur,
              2
            )}/vrk · ${recommended.hotWaterSourceLabel}) on lisätty kokonaislaskelmaan.`,
      });
    } else if (recommended.id === 'oil' && settings.oilSystemType === 'hydronic_separate_dhw') {
      warnings.push({
        id: 'oil_separate_dhw',
        severity: settings.dhwBackupFuel === 'none' ? 'warning' : 'info',
        title:
          settings.dhwBackupFuel === 'none'
            ? 'Huomio käyttövedestä: Käyttövettä ei tuoteta'
            : 'Käyttövesi lämpiää sähkövaraajalla',
        body: !settings.includeHotWater
          ? `Öljykattila lämmittää vain patterit; muista huomioida erillisen sähkövaraajan käyttövesikustannus.`
          : settings.dhwBackupFuel === 'none'
          ? `Öljykattila lämmittää vain vesikiertoiset patterit, ja käyttöveden tuotanto on asetettu tilaan "Ei tuoteta" (0,00 €/vrk).`
          : `Öljykattila lämmittää vain vesikiertoiset patterit. Lämpimän käyttöveden (${settings.hotWaterKwhPerDay} kWh/vrk) kustannus (${formatEur(
              recommended.hotWaterDailyCostEur,
              2
            )}/vrk) lasketaan pörssisähkön mukaan.`,
      });
    }
  }

  // Hydronic radiator freeze / cold room warning when switching off boiler in freezing weather
  if (
    !recommended.supportsHydronicRadiators &&
    settings.outsideTempC <= -10
  ) {
    warnings.push({
      id: 'hydronic_freeze_risk',
      severity: 'warning',
      title: `Pakkashuomio vesikiertoisille pattereille (${settings.outsideTempC} °C)`,
      body: `Jos kohteessa on vesikiertoinen patterilämmitys ja pääkattila kytketään pois pelkän ilmalämmityksen (takka, ilmalämpöpumppu tai irtolämmitin) ajaksi, pidä patteriverkon kierto- ja peruslämpö päällä ulkoseinien ja pesutilojen jäätymisriskin välttämiseksi.`,
    });
  }

  return warnings;
}

export function getHelsinkiParts(isoDate: string): {
  hour: number;
  dateStr: string;
  dayKey: string;
} {
  const date = new Date(isoDate);
  const hourFormatter = new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    hour: '2-digit',
    hour12: false,
  });
  const dateFormatter = new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });
  const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Helsinki',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const rawHour = Number(hourFormatter.format(date));
  return {
    hour: Number.isNaN(rawHour) ? date.getHours() : rawHour % 24,
    dateStr: dateFormatter.format(date),
    dayKey: dayKeyFormatter.format(date),
  };
}

export function findCurrentSpotPrice(spotPrices: SpotPricePoint[], nowMs = Date.now()): SpotPricePoint | null {
  if (spotPrices.length === 0) return null;
  const active = spotPrices.find((p) => {
    const start = new Date(p.startDate).getTime();
    const end = new Date(p.endDate).getTime();
    return nowMs >= start && nowMs < end;
  });
  if (active) return active;

  // Fallback to closest upcoming or latest available
  let closest = spotPrices[0];
  let bestDiff = Math.abs(new Date(closest.startDate).getTime() - nowMs);
  for (const item of spotPrices) {
    const diff = Math.abs(new Date(item.startDate).getTime() - nowMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      closest = item;
    }
  }
  return closest;
}

export function simulateHourlySchedule(
  spotPrices: SpotPricePoint[],
  settings: HeatingSettings,
  nowMs = Date.now()
): { points: HourlySimulationPoint[]; summary: HybridSummary } {
  const effectiveWoodCents = getEffectiveWoodCents(settings);
  const effectiveOilCents = getEffectiveOilCents(settings);
  const hourlyKwh = settings.dailyKwh / 24;
  const fixedElecCents = settings.marginCents + settings.transferCents + settings.taxCents;
  const cop = Math.max(0.8, settings.electricCop);

  const todayKey = getHelsinkiParts(new Date(nowMs).toISOString()).dayKey;

  // Keep relevant hours from current day start onwards (up to 48h)
  const relevantPrices = spotPrices.filter((p) => {
    const pDay = getHelsinkiParts(p.startDate).dayKey;
    return pDay >= todayKey;
  });

  const sourceList = relevantPrices.length >= 12 ? relevantPrices : spotPrices;

  const points: HourlySimulationPoint[] = sourceList.map((p) => {
    const startMs = new Date(p.startDate).getTime();
    const endMs = new Date(p.endDate).getTime();
    const isCurrentHour = nowMs >= startMs && nowMs < endMs;
    const parts = getHelsinkiParts(p.startDate);
    const isTomorrow = parts.dayKey > todayKey;

    const purchasedElectricityCents = getPurchasedElectricityCents(p.priceCents, settings);
    const effectiveElectricityCents = purchasedElectricityCents / cop;

    const rawCosts: Array<{ id: FuelId; cost: number }> = [
      { id: 'electricity', cost: effectiveElectricityCents },
      { id: 'wood', cost: effectiveWoodCents },
      { id: 'oil', cost: effectiveOilCents },
    ];
    const costs = rawCosts.sort((a, b) => a.cost - b.cost);

    const best = costs[0];
    const second = costs[1];

    return {
      startDate: p.startDate,
      endDate: p.endDate,
      helsinkiHour: parts.hour,
      helsinkiDateLabel: parts.dateStr,
      helsinkiTimeLabel: `${String(parts.hour).padStart(2, '0')}:00`,
      isCurrentHour,
      isTomorrow,
      spotPriceCents: p.priceCents,
      purchasedElectricityCents,
      effectiveElectricityCents,
      effectiveWoodCents,
      effectiveOilCents,
      bestFuel: best.id,
      bestCostCents: best.cost,
      hourlySavingsVsSecondBestEur: ((second.cost - best.cost) * hourlyKwh) / 100,
      hourlySavingsVsOilEur: ((effectiveOilCents - best.cost) * hourlyKwh) / 100,
    };
  });

  // Compute summary over next 24h (or all available points scaled to 24h)
  const upcomingPoints = points.filter((p) => new Date(p.endDate).getTime() > nowMs);
  const next24 = (upcomingPoints.length >= 12 ? upcomingPoints : points).slice(0, 24);

  const count = Math.max(1, next24.length);
  const hybridAvgCents = next24.reduce((acc, p) => acc + p.bestCostCents, 0) / count;
  const elecAvgCents = next24.reduce((acc, p) => acc + p.effectiveElectricityCents, 0) / count;

  const hybridDailyCostEur = (hybridAvgCents * settings.dailyKwh) / 100;
  const electricityOnlyDailyCostEur = (elecAvgCents * settings.dailyKwh) / 100;
  const woodOnlyDailyCostEur = (effectiveWoodCents * settings.dailyKwh) / 100;
  const oilOnlyDailyCostEur = (effectiveOilCents * settings.dailyKwh) / 100;

  const worstStaticDaily = Math.max(
    electricityOnlyDailyCostEur,
    woodOnlyDailyCostEur,
    oilOnlyDailyCostEur
  );

  // Best consecutive 3-hour electric window in next 24h
  let bestWindowStartIdx = 0;
  let bestWindowAvg = Infinity;
  const winLen = Math.min(3, next24.length);
  for (let i = 0; i <= next24.length - winLen; i++) {
    let sum = 0;
    for (let j = 0; j < winLen; j++) {
      sum += next24[i + j].effectiveElectricityCents;
    }
    const avg = sum / winLen;
    if (avg < bestWindowAvg) {
      bestWindowAvg = avg;
      bestWindowStartIdx = i;
    }
  }

  const startPt = next24[bestWindowStartIdx];
  const endPt = next24[Math.min(next24.length - 1, bestWindowStartIdx + winLen - 1)];
  const cheapestElectricWindowLabel =
    startPt && endPt
      ? `${String(startPt.helsinkiHour).padStart(2, '0')}:00–${String(
          (endPt.helsinkiHour + 1) % 24
        ).padStart(2, '0')}:00`
      : '—';

  // Breakeven spot electricity price where effectiveElectricityCents == effectiveWoodCents / Oil
  // effectiveElectricityCents = (spot + fixedElecCents) / cop => spot = effectiveTarget * cop - fixedElecCents
  const woodBreakevenSpotCents = effectiveWoodCents * cop - fixedElecCents;
  const oilBreakevenSpotCents = effectiveOilCents * cop - fixedElecCents;

  return {
    points,
    summary: {
      windowHours: points.length,
      electricityBestHours: points.filter((p) => p.bestFuel === 'electricity').length,
      woodBestHours: points.filter((p) => p.bestFuel === 'wood').length,
      oilBestHours: points.filter((p) => p.bestFuel === 'oil').length,
      cheapestElectricWindowLabel,
      cheapestElectricAvgCents: Number.isFinite(bestWindowAvg) ? bestWindowAvg : 0,
      hybridDailyCostEur,
      electricityOnlyDailyCostEur,
      woodOnlyDailyCostEur,
      oilOnlyDailyCostEur,
      hybridSavingsVsWorstDailyEur: Math.max(0, worstStaticDaily - hybridDailyCostEur),
      hybridSavingsVsElectricityOnlyDailyEur: Math.max(
        0,
        electricityOnlyDailyCostEur - hybridDailyCostEur
      ),
      hybridSavingsVsOilOnlyDailyEur: Math.max(0, oilOnlyDailyCostEur - hybridDailyCostEur),
      woodBreakevenSpotCents,
      oilBreakevenSpotCents,
    },
  };
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('fi-FI', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatEur(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)} €`;
}

export function formatCents(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)} snt/kWh`;
}

export function fuelLabelFi(id: FuelId): string {
  switch (id) {
    case 'electricity':
      return 'Pörssisähkö';
    case 'wood':
      return 'Polttopuu';
    case 'oil':
      return 'Lämmitysöljy';
  }
}
