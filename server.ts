import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache to respect public API rate limits

interface SpotPriceEntry {
  startDate: string;
  endDate: string;
  priceCents: number;
}

interface MarketPayload {
  spotPrices: SpotPriceEntry[];
  fetchedAt: string;
  isLive: boolean;
  source: string;
  marketBenchmarks: {
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
  };
}

let cachedMarketData: MarketPayload | null = null;
let cacheTimestamp = 0;

function getMarketBenchmarks() {
  return {
    oilEurPerLiter: 1.82,
    oilBenchmarkNote: 'Suomen keskimääräinen kuluttajahinta (sis. ALV 25,5 % ja valmistevero)',
    birchLooseEur: 88,
    birchStackedEur: 138,
    mixedLooseEur: 72,
    woodBenchmarkNote: 'Kuiva klapi (< 20 % kosteus), kotiin toimitettuna Etelä- ja Keski-Suomessa',
    transferCents: 4.25,
    taxCents: 2.83,
    marginCents: 0.45,
    electricityBenchmarkNote: 'Sisältää sähköveroluokan I (2,8275 snt/kWh) ja keskimääräisen siirtohinnan',
  };
}

function buildFallbackPrices(): SpotPriceEntry[] {
  const now = new Date();
  const baseMidnight = new Date(now);
  baseMidnight.setUTCHours(0, 0, 0, 0);

  const hourlyCurve = [
    4.2, 3.8, 3.4, 3.2, 3.6, 5.1, 8.9, 14.4,
    18.2, 16.5, 13.8, 12.1, 11.4, 10.8, 11.9, 13.5,
    16.8, 21.4, 22.8, 19.6, 15.2, 11.7, 7.9, 5.3,
  ];

  const entries: SpotPriceEntry[] = [];
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

async function fetchFromPorssisahko(): Promise<SpotPriceEntry[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch('https://api.porssisahko.net/v1/latest-prices.json', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`porssisahko.net HTTP ${response.status}`);
    }
    const json = (await response.json()) as {
      prices?: Array<{ price: number; startDate: string; endDate: string }>;
    };
    if (!Array.isArray(json.prices) || json.prices.length === 0) {
      throw new Error('porssisahko.net returned empty prices');
    }
    return json.prices
      .map((item) => ({
        startDate: item.startDate,
        endDate: item.endDate,
        priceCents: Number(item.price),
      }))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchFromSpotHinta(): Promise<SpotPriceEntry[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const response = await fetch('https://api.spot-hinta.fi/TodayAndDayForward?Region=FI', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`spot-hinta.fi HTTP ${response.status}`);
    }
    const json = (await response.json()) as Array<{
      DateTime: string;
      PriceWithTax: number;
    }>;
    if (!Array.isArray(json) || json.length === 0) {
      throw new Error('spot-hinta.fi returned empty prices');
    }
    const buckets = new Map<string, number[]>();
    for (const item of json) {
      const dt = new Date(item.DateTime);
      if (Number.isNaN(dt.getTime())) continue;
      dt.setUTCMinutes(0, 0, 0);
      const key = dt.toISOString();
      const list = buckets.get(key);
      if (list) {
        list.push(item.PriceWithTax * 100);
      } else {
        buckets.set(key, [item.PriceWithTax * 100]);
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
  } finally {
    clearTimeout(timeout);
  }
}

async function getMarketData(forceRefresh = false): Promise<MarketPayload> {
  const now = Date.now();
  if (!forceRefresh && cachedMarketData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedMarketData;
  }

  let spotPrices: SpotPriceEntry[] = [];
  let source = '';
  let isLive = false;

  try {
    spotPrices = await fetchFromPorssisahko();
    source = 'porssisahko.net (Nord Pool FI)';
    isLive = true;
  } catch (err1) {
    console.warn('Primary spot API failed, trying secondary:', err1 instanceof Error ? err1.message : err1);
    try {
      spotPrices = await fetchFromSpotHinta();
      source = 'spot-hinta.fi (Nord Pool FI)';
      isLive = true;
    } catch (err2) {
      console.warn('Secondary spot API failed, using offline fallback:', err2 instanceof Error ? err2.message : err2);
      spotPrices = buildFallbackPrices();
      source = 'Markkina-arvio (yhteys estetty)';
      isLive = false;
    }
  }

  const payload: MarketPayload = {
    spotPrices,
    fetchedAt: new Date().toISOString(),
    isLive,
    source,
    marketBenchmarks: getMarketBenchmarks(),
  };

  cachedMarketData = payload;
  cacheTimestamp = now;
  return payload;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/api/market-data', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    try {
      const data = await getMarketData(forceRefresh);
      res.json(data);
    } catch (error) {
      res.status(500).json({
        error: 'Markkinadatan haku epäonnistui',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lampovahti server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
