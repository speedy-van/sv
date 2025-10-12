import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const date = searchParams.get('date');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Get weather API key from environment (server-side only)
    const weatherApiKey = process.env.WEATHER_API_KEY;

    if (!weatherApiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      );
    }

    // Call OpenWeatherMap API for current weather
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`
    );

    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();

    // Get 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${weatherApiKey}&units=metric`
    );

    if (!forecastResponse.ok) {
      throw new Error(`Forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();

    // Process current weather
    const currentWeather = {
      condition: weatherData.weather[0]?.main || 'Unknown',
      temperature: Math.round(weatherData.main?.temp || 0),
      precipitation: weatherData.rain?.['1h'] || 0,
      windSpeed: Math.round(weatherData.wind?.speed || 0),
      visibility: Math.round((weatherData.visibility || 10000) / 1000), // Convert to km
      humidity: weatherData.main?.humidity || 0,
      pressure: weatherData.main?.pressure || 0,
    };

    // Process forecast for specific date if provided
    let targetForecast = null;
    if (date) {
      const targetDate = new Date(date);
      const targetForecastData = forecastData.list.find((item: any) => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.toDateString() === targetDate.toDateString();
      });

      if (targetForecastData) {
        targetForecast = {
          condition: targetForecastData.weather[0]?.main || 'Unknown',
          temperature: Math.round(targetForecastData.main?.temp || 0),
          precipitation: targetForecastData.rain?.['3h'] || 0,
          windSpeed: Math.round(targetForecastData.wind?.speed || 0),
          visibility: Math.round(
            (targetForecastData.visibility || 10000) / 1000
          ),
          humidity: targetForecastData.main?.humidity || 0,
          pressure: targetForecastData.main?.pressure || 0,
        };
      }
    }

    // Generate weather recommendations
    const recommendations = generateWeatherRecommendations(
      targetForecast || currentWeather
    );

    const response = {
      current: currentWeather,
      forecast: targetForecast,
      recommendations,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Weather forecast API error:', error);

    // Return mock data as fallback
    return NextResponse.json({
      current: {
        condition: 'Clear',
        temperature: 18,
        precipitation: 0,
        windSpeed: 5,
        visibility: 10,
        humidity: 65,
        pressure: 1013,
      },
      forecast: null,
      recommendations: ['Good weather conditions for travel'],
      timestamp: new Date().toISOString(),
      fallback: true,
    });
  }
}

function generateWeatherRecommendations(weather: any): string[] {
  const recommendations = [];

  if (weather.precipitation > 5) {
    recommendations.push('Heavy rain expected - allow extra travel time');
    recommendations.push('Use windshield wipers and maintain safe distance');
  } else if (weather.precipitation > 2) {
    recommendations.push('Light rain expected - drive carefully');
  }

  if (weather.visibility < 5) {
    recommendations.push('Poor visibility - use headlights and drive slowly');
  } else if (weather.visibility < 8) {
    recommendations.push('Reduced visibility - drive with caution');
  }

  if (weather.windSpeed > 20) {
    recommendations.push(
      'High winds - secure loose items and drive cautiously'
    );
  } else if (weather.windSpeed > 15) {
    recommendations.push('Moderate winds - be aware of gusts');
  }

  if (weather.temperature < 5) {
    recommendations.push(
      'Cold weather - check vehicle fluids and tire pressure'
    );
  } else if (weather.temperature > 30) {
    recommendations.push('Hot weather - ensure proper vehicle cooling');
  }

  if (recommendations.length === 0) {
    recommendations.push('Good weather conditions for travel');
  }

  return recommendations;
}
