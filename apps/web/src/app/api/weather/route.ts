import { NextResponse, NextRequest } from 'next/server';

type Theme = 'sunny' | 'rain' | 'clouds' | 'snow' | 'wind' | 'fog';

function mapOpenMeteoCodeToTheme(code: number): {
  theme: Theme;
  condition: string;
} {
  // https://open-meteo.com/en/docs
  if (code === 0) return { theme: 'sunny', condition: 'Clear sky' };
  if ([1, 2, 3].includes(code))
    return { theme: 'clouds', condition: 'Partly cloudy' };
  if ([45, 48].includes(code)) return { theme: 'fog', condition: 'Fog' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { theme: 'rain', condition: 'Rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { theme: 'snow', condition: 'Snow' };
  if ([95, 96, 99].includes(code))
    return { theme: 'rain', condition: 'Thunderstorm' };
  return { theme: 'clouds', condition: 'Clouds' };
}

function nearestHourIndex(targetIso: string, hours: string[]): number {
  const t = new Date(targetIso).getTime();
  let bestIdx = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < hours.length; i++) {
    const diff = Math.abs(new Date(hours[i]).getTime() - t);
    if (diff < best) {
      best = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return new Response('Weather code required', { status: 400 });
  }

  const weatherCode = parseInt(code);

  if (isNaN(weatherCode)) {
    return new Response('Invalid weather code', { status: 400 });
  }

  function getWeatherInfo(code: number) {
    if (code === 0) return { theme: 'sunny', condition: 'Clear sky' };
    if ([1, 2, 3].includes(code))
      return { theme: 'clouds', condition: 'Partly cloudy' };
    if ([45, 48].includes(code)) return { theme: 'fog', condition: 'Fog' };
    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
      return { theme: 'rain', condition: 'Rain' };
    if ([71, 73, 75, 77, 85, 86].includes(code))
      return { theme: 'snow', condition: 'Snow' };
    if ([95, 96, 99].includes(code))
      return { theme: 'rain', condition: 'Thunderstorm' };
    return { theme: 'unknown', condition: 'Unknown' };
  }

  const weather = getWeatherInfo(weatherCode);

  return Response.json(weather);
}
