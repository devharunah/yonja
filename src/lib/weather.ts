import { KAMPALA } from "@/lib/constants";

export type RainDay = { date: string; rain_mm: number; chance_pct: number };

const URL_BASE = "https://api.open-meteo.com/v1/forecast";

export function parseForecast(body: unknown): RainDay[] {
  const daily = (body as { daily?: Record<string, unknown[]> }).daily;
  const dates = (daily?.["time"] ?? []) as string[];
  const rain = (daily?.["precipitation_sum"] ?? []) as (number | null)[];
  const chance = (daily?.["precipitation_probability_max"] ?? []) as (number | null)[];
  return dates.map((date, i) => ({
    date,
    rain_mm: rain[i] ?? 0,
    chance_pct: chance[i] ?? 0,
  }));
}

export async function rainForecast(): Promise<RainDay[]> {
  const params = new URLSearchParams({
    latitude: String(KAMPALA.lat),
    longitude: String(KAMPALA.lng),
    daily: "precipitation_sum,precipitation_probability_max",
    timezone: "Africa/Kampala",
    forecast_days: "3",
  });
  const res = await fetch(`${URL_BASE}?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`);
  return parseForecast(await res.json());
}
