import type { MarketBenchmarks, MarketDataResponse, SpotPricePoint } from '../types/energy';

const DEFAULT_BENCHMARKS: MarketBenchmarks = {
  oilEurPerLiter: 1.82,
  oilBenchmarkNote: 'Suomen keskimääräinen kuluttajahinta (sis. ALV 25,5 % ja valmistevero)',
  birchLooseEur: 88,
  birchStackedEur: 138,
  mixedLooseEur: 72,
  woodBenchmarkNote: 'Kuiva klapi (< 20 % kosteus), kotiin toimitettuna Etelä- ja Keski-Suomessa',
  transferCents: 4.25,
  taxCents: 2.83,
  marginCents: 0.45,
  electricityBenchmarkNote:
    'Sisältää sähköveroluokan I (2,8275 snt/kWh) ja keskimääräisen siirtohinnan',
};

function aggregateQuarterHoursToHours(
  entries: Array<{ dateIso: string; priceCents: number }>
): SpotPricePoint[] {
  const buckets = new Map<string, number[]>();

  for (const item of entries) {
    const dt = new Date(item.dateIso);
    if (Number.isNaN(dt.getTime())) continue;
    dt.setUTCMinutes(0, 0, 0);
    const hourKey = dt.toISOString();
    const list = buckets.get(hourKey);
    if (list) {
      list.push(item.priceCents);
    } else {
      buckets.set(hourKey, [item.priceCents]);
    }
  }

  return Array.from(buckets.entries())
    .map(([startDate, values]) => {
      const start = new Date(startDate);
      const end = new Date(start.getTime() + 3600 * 1000);
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      return {
        startDate,
        endDate: end.toISOString(),
        priceCents: Number(avg.toFixed(3)),
      };
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

function buildOfflineFallbackPrices(): SpotPricePoint[] {
  const now = new Date();
  const baseMidnight = new Date(now);
  baseMidnight.setUTCHours(0, 0, 0, 0);

  const hourlyCurve = [
    4.2, 3.8, 3.4, 3.2, 3.6, 5.1, 8.9, 14.4,
    18.2, 16.5, 13.8, 12.1, 11.4, 10.8, 11.9, 13.5,
    16.8, 21.4, 22.8, 19.6, 15.2, 11.7, 7.9, 5.3,
  ];

  const entries: SpotPricePoint[] = [];
  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    for (let h = 0; h < 24; h++) {
      const start = new Date(baseMidnight.getTime() + (dayOffset * 24 + h) * 3600 * 1000);
      const end = new Date(start.getTime() + 3600 * 1000);
      const factor = dayOffset === 1 ? 0.92 : 1.0;
      entries.push({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        priceCents: Number((hourlyCurve[h] * factor).toFixed(3)),
      });
    }
  }
  return entries;
}

async function fetchFromBackend(isManualRefresh: boolean): Promise<MarketDataResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const base = import.meta.env.BASE_URL || '/';
    const prefix = base.endsWith('/') ? base : `${base}/`;
    const url = isManualRefresh
      ? `${prefix}api/market-data?refresh=1`
      : `${prefix}api/market-data`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`Backend unavailable (${res.status})`);
    }
    const data = (await res.json()) as MarketDataResponse;
    if (!Array.isArray(data.spotPrices) || data.spotPrices.length === 0) {
      throw new Error('Backend returned empty prices');
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchDirectlyFromSpotHinta(): Promise<MarketDataResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch('https://api.spot-hinta.fi/TodayAndDayForward?Region=FI', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`spot-hinta.fi HTTP ${res.status}`);
    }
    const raw = (await res.json()) as Array<{
      DateTime: string;
      PriceWithTax: number;
    }>;
    if (!Array.isArray(raw) || raw.length === 0) {
      throw new Error('spot-hinta.fi returned empty data');
    }

    const spotPrices = aggregateQuarterHoursToHours(
      raw.map((item) => ({
        dateIso: item.DateTime,
        priceCents: item.PriceWithTax * 100,
      }))
    );

    return {
      spotPrices,
      fetchedAt: new Date().toISOString(),
      isLive: true,
      source: 'spot-hinta.fi (suora selainhaku)',
      marketBenchmarks: DEFAULT_BENCHMARKS,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadMarketData(isManualRefresh = false): Promise<MarketDataResponse> {
  try {
    return await fetchFromBackend(isManualRefresh);
  } catch {
    try {
      return await fetchDirectlyFromSpotHinta();
    } catch {
      return {
        spotPrices: buildOfflineFallbackPrices(),
        fetchedAt: new Date().toISOString(),
        isLive: false,
        source: 'Markkina-arvio (offline-varahaku)',
        marketBenchmarks: DEFAULT_BENCHMARKS,
      };
    }
  }
}
