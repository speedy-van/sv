import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Weather data interfaces
interface WeatherCondition {
  temperature: number; // Celsius
  feelsLike: number;
  humidity: number; // percentage
  pressure: number; // hPa
  visibility: number; // meters
  uvIndex: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGust?: number; // km/h
  precipitation: {
    type: 'none' | 'rain' | 'snow' | 'sleet' | 'hail';
    intensity: 'light' | 'moderate' | 'heavy' | 'extreme';
    amount?: number; // mm/hour
    probability: number; // 0-100
  };
  conditions: {
    main: string; // 'Clear', 'Clouds', 'Rain', etc.
    description: string; // 'clear sky', 'few clouds', etc.
    icon: string; // weather icon code
  };
  airQuality?: {
    aqi: number; // 1-5 (good to very poor)
    pm25: number;
    pm10: number;
    no2: number;
    o3: number;
    so2: number;
    co: number;
  };
}

interface RoadCondition {
  temperature: number;
  condition: 'dry' | 'wet' | 'icy' | 'snowy' | 'flooded';
  friction: number; // coefficient 0-1 (1 = perfect grip)
  visibility: 'excellent' | 'good' | 'poor' | 'very_poor';
  hazards: string[]; // ['black_ice', 'flooding', 'strong_wind', etc.]
}

interface WeatherData {
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  current: WeatherCondition;
  forecast: WeatherCondition[]; // Next 12 hours, hourly
  alerts: WeatherAlert[];
  roadCondition: RoadCondition;
  lastUpdated: string;
  dataSource: 'openweather' | 'accuweather' | 'weatherapi' | 'cached';
  coverage: number; // percentage confidence
}

interface WeatherAlert {
  id: string;
  type: 'warning' | 'watch' | 'advisory';
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  areas: string[];
  instructions?: string;
}

// Mock weather data for development
const MOCK_WEATHER_DATA: WeatherData = {
  location: {
    lat: 51.5074,
    lng: -0.1278,
    name: 'London, UK'
  },
  current: {
    temperature: 15,
    feelsLike: 13,
    humidity: 72,
    pressure: 1013,
    visibility: 10000,
    uvIndex: 3,
    windSpeed: 15,
    windDirection: 225,
    windGust: 25,
    precipitation: {
      type: 'rain',
      intensity: 'light',
      amount: 0.5,
      probability: 60
    },
    conditions: {
      main: 'Rain',
      description: 'light rain',
      icon: '10d'
    }
  },
  forecast: [
    {
      temperature: 16,
      feelsLike: 14,
      humidity: 68,
      pressure: 1012,
      visibility: 8000,
      uvIndex: 2,
      windSpeed: 18,
      windDirection: 230,
      precipitation: {
        type: 'rain',
        intensity: 'moderate',
        amount: 2.1,
        probability: 85
      },
      conditions: {
        main: 'Rain',
        description: 'moderate rain',
        icon: '10d'
      }
    }
  ],
  alerts: [
    {
      id: 'alert_001',
      type: 'warning',
      severity: 'moderate',
      title: 'Heavy Rain Warning',
      description: 'Heavy rain expected with possible flooding on roads',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      areas: ['Greater London', 'M25 Motorway'],
      instructions: 'Drive carefully, watch for standing water, reduce speed in wet conditions'
    }
  ],
  roadCondition: {
    temperature: 12,
    condition: 'wet',
    friction: 0.7,
    visibility: 'good',
    hazards: ['wet_roads', 'reduced_visibility']
  },
  lastUpdated: new Date().toISOString(),
  dataSource: 'openweather',
  coverage: 90
};

// Cache for weather data
const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes for weather

const weatherRequestSchema = z.object({
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  includeForecast: z.boolean().default(true),
  includeAlerts: z.boolean().default(true),
  includeRoadConditions: z.boolean().default(true),
  dataSource: z.enum(['openweather', 'accuweather', 'weatherapi', 'auto']).default('auto'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = weatherRequestSchema.parse(body);

    const { location, includeForecast, includeAlerts, includeRoadConditions, dataSource } = validatedData;

    // Generate cache key
    const cacheKey = `${location.lat.toFixed(2)},${location.lng.toFixed(2)}_${includeForecast}_${includeAlerts}_${includeRoadConditions}`;

    // Check cache first
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000)
      });
    }

    // Fetch real weather data
    let weatherData: WeatherData;

    if (process.env.NODE_ENV === 'production') {
      weatherData = await fetchRealWeatherData(location, dataSource);
    } else {
      weatherData = {
        ...MOCK_WEATHER_DATA,
        location: {
          ...MOCK_WEATHER_DATA.location,
          lat: location.lat,
          lng: location.lng
        },
        lastUpdated: new Date().toISOString()
      };
    }

    // Filter data based on request
    if (!includeForecast) {
      weatherData.forecast = [];
    }
    if (!includeAlerts) {
      weatherData.alerts = [];
    }

    // Always calculate road conditions based on weather
    if (includeRoadConditions) {
      weatherData.roadCondition = calculateRoadConditions(weatherData.current, weatherData.alerts);
    }

    // Cache the result
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (weatherCache.size > 500) {
      const oldestKey = Array.from(weatherCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      weatherCache.delete(oldestKey);
    }

    return NextResponse.json({
      ...weatherData,
      cached: false
    });

  } catch (error) {
    console.error('Weather API Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.errors
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Weather service unavailable' },
      { status: 503 }
    );
  }
}

async function fetchRealWeatherData(location: { lat: number; lng: number }, dataSource: string): Promise<WeatherData> {
  // OpenWeatherMap integration (free tier)
  if (dataSource === 'openweather' || dataSource === 'auto') {
    try {
      return await fetchOpenWeatherData(location);
    } catch (error) {
      console.warn('OpenWeather API failed:', error);
      if (dataSource === 'openweather') throw error;
    }
  }

  // AccuWeather integration
  if (dataSource === 'accuweather' || dataSource === 'auto') {
    try {
      return await fetchAccuWeatherData(location);
    } catch (error) {
      console.warn('AccuWeather API failed:', error);
      if (dataSource === 'accuweather') throw error;
    }
  }

  // WeatherAPI integration
  if (dataSource === 'weatherapi' || dataSource === 'auto') {
    try {
      return await fetchWeatherApiData(location);
    } catch (error) {
      console.warn('WeatherAPI failed:', error);
      if (dataSource === 'weatherapi') throw error;
    }
  }

  // Fallback to mock data
  console.warn('All weather APIs failed, using fallback data');
  return MOCK_WEATHER_DATA;
}

async function fetchOpenWeatherData(location: { lat: number; lng: number }): Promise<WeatherData> {
  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key not configured');
  }

  // Current weather
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  const currentResponse = await fetch(currentUrl);
  if (!currentResponse.ok) {
    throw new Error(`OpenWeather current weather API error: ${currentResponse.status}`);
  }
  const currentData = await currentResponse.json();

  // Forecast (next 12 hours)
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${location.lat}&lon=${location.lng}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=4`; // 4 * 3h = 12h
  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) {
    throw new Error(`OpenWeather forecast API error: ${forecastResponse.status}`);
  }
  const forecastData = await forecastResponse.json();

  return parseOpenWeatherResponse(currentData, forecastData, location);
}

async function fetchAccuWeatherData(location: { lat: number; lng: number }): Promise<WeatherData> {
  const ACCUWEATHER_API_KEY = process.env.ACCUWEATHER_API_KEY;

  if (!ACCUWEATHER_API_KEY) {
    throw new Error('AccuWeather API key not configured');
  }

  // First get location key
  const locationUrl = `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${location.lat},${location.lng}`;
  const locationResponse = await fetch(locationUrl);
  if (!locationResponse.ok) {
    throw new Error(`AccuWeather location API error: ${locationResponse.status}`);
  }
  const locationData = await locationResponse.json();

  const locationKey = locationData.Key;

  // Current conditions
  const currentUrl = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true`;
  const currentResponse = await fetch(currentUrl);
  if (!currentResponse.ok) {
    throw new Error(`AccuWeather current conditions API error: ${currentResponse.status}`);
  }
  const currentData = await currentResponse.json();

  // Hourly forecast
  const forecastUrl = `http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/${locationKey}?apikey=${ACCUWEATHER_API_KEY}&details=true&metric=true`;
  const forecastResponse = await fetch(forecastUrl);
  if (!forecastResponse.ok) {
    throw new Error(`AccuWeather forecast API error: ${forecastResponse.status}`);
  }
  const forecastData = await forecastResponse.json();

  return parseAccuWeatherResponse(currentData[0], forecastData, location, locationData);
}

async function fetchWeatherApiData(location: { lat: number; lng: number }): Promise<WeatherData> {
  const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

  if (!WEATHERAPI_KEY) {
    throw new Error('WeatherAPI key not configured');
  }

  const url = `http://api.weatherapi.com/v1/forecast.json?key=${WEATHERAPI_KEY}&q=${location.lat},${location.lng}&days=1&aqi=yes&alerts=yes`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`WeatherAPI error: ${response.status}`);
  }

  const data = await response.json();
  return parseWeatherApiResponse(data, location);
}

// Response parsers
function parseOpenWeatherResponse(current: any, forecast: any, location: { lat: number; lng: number }): WeatherData {
  const currentWeather: WeatherCondition = {
    temperature: Math.round(current.main.temp),
    feelsLike: Math.round(current.main.feels_like),
    humidity: current.main.humidity,
    pressure: current.main.pressure,
    visibility: current.visibility || 10000,
    uvIndex: 3, // Not available in free tier
    windSpeed: Math.round(current.wind.speed * 3.6), // m/s to km/h
    windDirection: current.wind.deg,
    windGust: current.wind.gust ? Math.round(current.wind.gust * 3.6) : undefined,
    precipitation: {
      type: current.rain || current.snow ? (current.rain ? 'rain' : 'snow') : 'none',
      intensity: 'light', // Simplified
      amount: current.rain ? current.rain['1h'] : (current.snow ? current.snow['1h'] : undefined),
      probability: 0 // Not available
    },
    conditions: {
      main: current.weather[0].main,
      description: current.weather[0].description,
      icon: current.weather[0].icon
    }
  };

  const forecastWeather: WeatherCondition[] = forecast.list.slice(0, 4).map((item: any) => ({
    temperature: Math.round(item.main.temp),
    feelsLike: Math.round(item.main.feels_like),
    humidity: item.main.humidity,
    pressure: item.main.pressure,
    visibility: item.visibility || 10000,
    uvIndex: 3,
    windSpeed: Math.round(item.wind.speed * 3.6),
    windDirection: item.wind.deg,
    precipitation: {
      type: item.rain || item.snow ? (item.rain ? 'rain' : 'snow') : 'none',
      intensity: 'light',
      amount: item.rain ? item.rain['3h'] : (item.snow ? item.snow['3h'] : undefined),
      probability: Math.round(item.pop * 100)
    },
    conditions: {
      main: item.weather[0].main,
      description: item.weather[0].description,
      icon: item.weather[0].icon
    }
  }));

  return {
    location: {
      lat: location.lat,
      lng: location.lng,
      name: current.name
    },
    current: currentWeather,
    forecast: forecastWeather,
    alerts: [], // Not available in free tier
    roadCondition: calculateRoadConditions(currentWeather, []),
    lastUpdated: new Date().toISOString(),
    dataSource: 'openweather',
    coverage: 85
  };
}

function parseAccuWeatherResponse(current: any, forecast: any[], location: { lat: number; lng: number }, locationData: any): WeatherData {
  const currentWeather: WeatherCondition = {
    temperature: Math.round(current.Temperature.Metric.Value),
    feelsLike: Math.round(current.RealFeelTemperature.Metric.Value),
    humidity: current.RelativeHumidity,
    pressure: current.Pressure.Metric.Value,
    visibility: Math.round(current.Visibility.Metric.Value * 1000), // km to meters
    uvIndex: current.UVIndex,
    windSpeed: Math.round(current.Wind.Speed.Metric.Value),
    windDirection: current.Wind.Direction.Degrees,
    windGust: current.WindGust?.Speed.Metric.Value ? Math.round(current.WindGust.Speed.Metric.Value) : undefined,
    precipitation: {
      type: current.HasPrecipitation ? (current.PrecipitationType === 'Rain' ? 'rain' : 'snow') : 'none',
      intensity: current.PrecipitationIntensity || 'light',
      amount: current.PrecipitationSummary?.PastHour?.Metric.Value,
      probability: current.PrecipitationSummary?.PastHour?.Metric.Value > 0 ? 100 : 0
    },
    conditions: {
      main: current.WeatherText,
      description: current.WeatherText,
      icon: current.WeatherIcon.toString()
    }
  };

  const forecastWeather: WeatherCondition[] = forecast.slice(0, 12).map((item: any) => ({
    temperature: Math.round(item.Temperature.Value),
    feelsLike: Math.round(item.RealFeelTemperature.Value),
    humidity: item.RelativeHumidity,
    pressure: item.Pressure.Value,
    visibility: Math.round(item.Visibility.Value * 1000),
    uvIndex: item.UVIndex,
    windSpeed: Math.round(item.Wind.Speed.Value),
    windDirection: item.Wind.Direction.Degrees,
    precipitation: {
      type: item.HasPrecipitation ? (item.PrecipitationType === 'Rain' ? 'rain' : 'snow') : 'none',
      intensity: item.PrecipitationIntensity || 'light',
      amount: item.TotalLiquid?.Value,
      probability: Math.round(item.PrecipitationProbability)
    },
    conditions: {
      main: item.IconPhrase,
      description: item.IconPhrase,
      icon: item.WeatherIcon.toString()
    }
  }));

  return {
    location: {
      lat: location.lat,
      lng: location.lng,
      name: locationData.LocalizedName
    },
    current: currentWeather,
    forecast: forecastWeather,
    alerts: [], // Would need separate alerts API
    roadCondition: calculateRoadConditions(currentWeather, []),
    lastUpdated: new Date().toISOString(),
    dataSource: 'accuweather',
    coverage: 95
  };
}

function parseWeatherApiResponse(data: any, location: { lat: number; lng: number }): WeatherData {
  const current = data.current;
  const forecast = data.forecast.forecastday[0];

  const currentWeather: WeatherCondition = {
    temperature: Math.round(current.temp_c),
    feelsLike: Math.round(current.feelslike_c),
    humidity: current.humidity,
    pressure: current.pressure_mb,
    visibility: Math.round(current.vis_km * 1000),
    uvIndex: current.uv,
    windSpeed: Math.round(current.wind_kph),
    windDirection: current.wind_degree,
    windGust: current.gust_kph ? Math.round(current.gust_kph) : undefined,
    precipitation: {
      type: current.precip_mm > 0 ? 'rain' : 'none',
      intensity: current.precip_mm > 2 ? 'moderate' : current.precip_mm > 0.5 ? 'light' : 'light',
      amount: current.precip_mm,
      probability: Math.round(current.precip_mm > 0 ? 80 : 0)
    },
    conditions: {
      main: current.condition.text,
      description: current.condition.text,
      icon: current.condition.icon
    },
    airQuality: data.current.air_quality ? {
      aqi: Math.round(data.current.air_quality['us-epa-index']),
      pm25: data.current.air_quality.pm2_5,
      pm10: data.current.air_quality.pm10,
      no2: data.current.air_quality.no2,
      o3: data.current.air_quality.o3,
      so2: data.current.air_quality.so2,
      co: data.current.air_quality.co
    } : undefined
  };

  const forecastWeather: WeatherCondition[] = forecast.hour.slice(0, 12).map((hour: any) => ({
    temperature: Math.round(hour.temp_c),
    feelsLike: Math.round(hour.feelslike_c),
    humidity: hour.humidity,
    pressure: hour.pressure_mb,
    visibility: Math.round(hour.vis_km * 1000),
    uvIndex: hour.uv,
    windSpeed: Math.round(hour.wind_kph),
    windDirection: hour.wind_degree,
    precipitation: {
      type: hour.precip_mm > 0 ? 'rain' : 'none',
      intensity: hour.precip_mm > 2 ? 'moderate' : hour.precip_mm > 0.5 ? 'light' : 'none',
      amount: hour.precip_mm,
      probability: hour.chance_of_rain
    },
    conditions: {
      main: hour.condition.text,
      description: hour.condition.text,
      icon: hour.condition.icon
    }
  }));

  const alerts: WeatherAlert[] = (data.alerts?.alert || []).map((alert: any) => ({
    id: alert.id || `alert_${Date.now()}`,
    type: 'warning',
    severity: alert.severity || 'moderate',
    title: alert.headline,
    description: alert.desc,
    startTime: new Date(alert.effective).toISOString(),
    endTime: new Date(alert.expires).toISOString(),
    areas: alert.areas || [],
    instructions: alert.instruction
  }));

  return {
    location: {
      lat: location.lat,
      lng: location.lng,
      name: data.location.name
    },
    current: currentWeather,
    forecast: forecastWeather,
    alerts,
    roadCondition: calculateRoadConditions(currentWeather, alerts),
    lastUpdated: new Date().toISOString(),
    dataSource: 'weatherapi',
    coverage: 90
  };
}

function calculateRoadConditions(weather: WeatherCondition, alerts: WeatherAlert[]): RoadCondition {
  const hazards: string[] = [];
  let condition: RoadCondition['condition'] = 'dry';
  let friction = 1.0; // Perfect grip
  let visibility: RoadCondition['visibility'] = 'excellent';

  // Temperature-based conditions
  if (weather.temperature <= 0) {
    if (weather.precipitation.type === 'snow' || weather.precipitation.type === 'sleet') {
      condition = 'icy';
      friction = 0.2;
      hazards.push('black_ice', 'snow');
    } else if (weather.temperature <= -2) {
      condition = 'icy';
      friction = 0.3;
      hazards.push('black_ice');
    }
  } else if (weather.precipitation.type !== 'none') {
    condition = 'wet';
    friction = weather.precipitation.intensity === 'heavy' ? 0.4 : 0.6;
    hazards.push('wet_roads');
  }

  // Precipitation intensity
  if (weather.precipitation.intensity === 'heavy') {
    hazards.push('heavy_rain');
    friction = Math.min(friction, 0.3);
  }

  // Visibility based on weather
  if (weather.visibility < 1000) {
    visibility = 'very_poor';
  } else if (weather.visibility < 5000) {
    visibility = 'poor';
  } else if (weather.visibility < 10000) {
    visibility = 'good';
  }

  if (visibility !== 'excellent') {
    hazards.push('reduced_visibility');
  }

  // Wind conditions
  if (weather.windSpeed > 50) {
    hazards.push('strong_wind');
  }

  // Weather alerts
  alerts.forEach(alert => {
    if (alert.title.toLowerCase().includes('flood')) {
      hazards.push('flooding');
      condition = 'flooded';
      friction = 0.1;
    }
  });

  return {
    temperature: weather.temperature,
    condition,
    friction,
    visibility,
    hazards
  };
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    message: 'Weather service is operational',
    supportedProviders: ['openweather', 'accuweather', 'weatherapi'],
    cacheSize: weatherCache.size,
    timestamp: new Date().toISOString()
  });
}