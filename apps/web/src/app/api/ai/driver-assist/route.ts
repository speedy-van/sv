import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import Groq from 'groq-sdk';

// Driver App API Key - Namespaced for isolation
function getGroqClient() {
  const GROQ_API_KEY_DRIVER = process.env.GROQ_API_KEY_DRIVER || process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY_DRIVER) {
    return null;
  }
  return new Groq({
    apiKey: GROQ_API_KEY_DRIVER,
  });
}

// Rate limiting: Simple in-memory store (in production, use Redis)
const RATE_LIMITS = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = RATE_LIMITS.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    RATE_LIMITS.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (clientIP) {
    return clientIP;
  }

  // Fallback for development
  return request.ip || '127.0.0.1';
}

const driverAssistSchema = z.object({
  requestType: z.enum(['route_optimization', 'job_reordering', 'fuel_efficiency', 'rest_recommendations', 'multi_stop_optimization']),
  currentLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }),
  activeJobs: z.array(z.object({
    id: z.string(),
    reference: z.string(),
    pickup: z.object({
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
      time: z.string(),
    }),
    dropoff: z.object({
      address: z.string(),
      lat: z.number(),
      lng: z.number(),
      time: z.string(),
    }),
    earnings: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    vehicleType: z.string().optional(),
  })).optional(),
  constraints: z.object({
    maxDrivingHours: z.number().optional(), // hours remaining today
    fuelEfficiency: z.boolean().optional(), // prioritize fuel efficiency
    trafficAware: z.boolean().optional(), // consider live traffic
    avoidTolls: z.boolean().optional(),
    preferredRoutes: z.array(z.string()).optional(), // preferred road types
    weatherAware: z.boolean().optional(), // consider weather conditions
  }).optional(),
  weatherConditions: z.object({
    temperature: z.number().optional(),
    conditions: z.string().optional(), // rain, snow, clear, etc.
    visibility: z.string().optional(), // good, poor, etc.
  }).optional(),
  trafficData: z.object({
    segments: z.array(z.any()).optional(),
    incidents: z.array(z.any()).optional(),
  }).optional(),
  driverPreferences: z.object({
    preferredSpeed: z.number().optional(),
    riskTolerance: z.enum(['low', 'medium', 'high']).optional(),
    fuelPriority: z.number().optional(), // 0-1
    timePriority: z.number().optional(), // 0-1
  }).optional(),
});

const SYSTEM_PROMPT = `You are Speedy AI Driver Assistant, an intelligent AI system designed to optimize routes, schedules, and operations for Speedy Van drivers.

Your role is to provide smart, data-driven recommendations that improve efficiency, safety, and earnings for drivers.

Key capabilities:
1. Route optimization considering traffic, distance, time, and fuel efficiency
2. Job reordering to minimize travel time and maximize earnings
3. Real-time recommendations for rest stops, fuel stations, and breaks
4. Weather-aware routing suggestions
5. Predictive maintenance alerts based on driving patterns
6. Earnings optimization strategies

Always provide:
- Clear, actionable recommendations
- Time and distance savings estimates
- Safety considerations
- Alternative options when available
- Confidence levels for your suggestions

Be concise but informative. Focus on the driver's immediate needs and long-term efficiency.

Company context:
- Speedy Van is a UK-based moving and logistics company
- Drivers typically use Luton vans or similar vehicles
- Peak hours are 9 AM - 5 PM weekdays
- Fuel efficiency is critical for driver earnings
- Safety and compliance are top priorities

Response format: Provide structured recommendations with clear reasoning.`;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP = getClientIP(request);
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60
        },
        { status: 429 }
      );
    }

    const groq = getGroqClient();
    if (!groq) {
      return NextResponse.json(
        { error: 'AI service unavailable' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const validatedData = driverAssistSchema.parse(body);

    const {
      requestType,
      currentLocation,
      activeJobs = [],
      constraints = {},
      weatherConditions = {},
      trafficData,
      driverPreferences
    } = validatedData;

    // Fetch real-time data if needed
    let enrichedTrafficData = trafficData;
    let enrichedWeatherData = weatherConditions;
    let weatherAlerts: any[] = [];

    // Fetch traffic data if traffic-aware and not provided
    if ((constraints.trafficAware || requestType === 'route_optimization') && !trafficData) {
      try {
        const trafficResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/traffic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route: {
              origin: currentLocation,
              destination: activeJobs.length > 0 ? activeJobs[0].dropoff : currentLocation,
              waypoints: activeJobs.slice(1).map(job => job.dropoff)
            },
            departureTime: new Date().toISOString(),
            includeIncidents: true,
            dataSource: 'auto'
          })
        });

        if (trafficResponse.ok) {
          enrichedTrafficData = await trafficResponse.json();
        }
      } catch (error) {
        console.warn('Failed to fetch traffic data:', error);
      }
    }

    // Fetch weather data if weather-aware and not provided
    if ((constraints.weatherAware || requestType === 'route_optimization') && Object.keys(weatherConditions).length === 0) {
      try {
        const weatherResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/weather`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: currentLocation,
            includeForecast: true,
            includeAlerts: true,
            includeRoadConditions: true,
            dataSource: 'auto'
          })
        });

        if (weatherResponse.ok) {
          const weatherResult = await weatherResponse.json();
          enrichedWeatherData = weatherResult.current;
          weatherAlerts = weatherResult.alerts || [];
        }
      } catch (error) {
        console.warn('Failed to fetch weather data:', error);
      }
    }

    // Build context-aware prompt based on request type
    let contextPrompt = '';

    switch (requestType) {
      case 'route_optimization':
        contextPrompt = buildRouteOptimizationPrompt(
          currentLocation,
          activeJobs,
          constraints,
          enrichedWeatherData,
          enrichedTrafficData,
          weatherAlerts,
          driverPreferences
        );
        break;
      case 'job_reordering':
        contextPrompt = buildJobReorderingPrompt(activeJobs, constraints, enrichedTrafficData, driverPreferences);
        break;
      case 'fuel_efficiency':
        contextPrompt = buildFuelEfficiencyPrompt(currentLocation, activeJobs, constraints, enrichedWeatherData, driverPreferences);
        break;
      case 'rest_recommendations':
        contextPrompt = buildRestRecommendationsPrompt(currentLocation, constraints, enrichedWeatherData);
        break;
      case 'multi_stop_optimization':
        contextPrompt = buildMultiStopOptimizationPrompt(currentLocation, activeJobs, constraints, enrichedTrafficData, enrichedWeatherData, driverPreferences);
        break;
      default:
        contextPrompt = 'Provide general driver assistance recommendations.';
    }

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${contextPrompt}`;

    // Call GROQ API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: fullPrompt
        },
        {
          role: 'user',
          content: `Please provide ${requestType.replace('_', ' ')} recommendations for the current situation.`
        }
      ],
      model: 'llama3-8b-8192',
      temperature: 0.3, // Lower temperature for more consistent recommendations
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI service');
    }

    // Parse and validate AI response
    let aiResponse;
    try {
      aiResponse = JSON.parse(response);
    } catch (parseError) {
      console.error('Failed to parse AI response:', response);
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    // Add metadata
    const enhancedResponse = {
      ...aiResponse,
      metadata: {
        requestType,
        timestamp: new Date().toISOString(),
        processingTime: Date.now(),
        confidence: aiResponse.confidence || 0.8,
        requestId: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('AI Driver Assist API Error:', error);

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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildRouteOptimizationPrompt(
  currentLocation: any,
  activeJobs: any[],
  constraints: any,
  weatherData: any,
  trafficData: any,
  weatherAlerts: any[],
  driverPreferences: any
): string {
  const jobsText = activeJobs.map((job, index) =>
    `${index + 1}. ${job.reference}: ${job.pickup.address} → ${job.dropoff.address} (${job.earnings})`
  ).join('\n');

  // Build traffic information
  const trafficInfo = trafficData?.segments ? `
Traffic Conditions:
- Average speed: ${Math.round(trafficData.segments.reduce((sum: number, s: any) => sum + (s.speed || 0), 0) / trafficData.segments.length)} km/h
- Congestion level: ${trafficData.segments.some((s: any) => s.congestionLevel === 'blocked') ? 'Heavy with blockages' :
                     trafficData.segments.some((s: any) => s.congestionLevel === 'congested') ? 'Congested' :
                     trafficData.segments.some((s: any) => s.congestionLevel === 'heavy') ? 'Heavy' : 'Light'}
- Incidents: ${trafficData.incidents?.length || 0} reported (${trafficData.incidents?.map((i: any) => i.type).join(', ') || 'None'})
- Route coverage: ${trafficData.coverage || 0}%` : 'Traffic data not available';

  // Build weather information
  const weatherInfo = weatherData ? `
Weather Conditions:
- Temperature: ${weatherData.temperature || 'N/A'}°C (feels like ${weatherData.feelsLike || weatherData.temperature || 'N/A'}°C)
- Conditions: ${weatherData.conditions?.description || weatherData.conditions?.main || 'Clear'}
- Precipitation: ${weatherData.precipitation?.type !== 'none' ?
    `${weatherData.precipitation.intensity} ${weatherData.precipitation.type} (${weatherData.precipitation.probability}% chance)` :
    'None expected'}
- Visibility: ${weatherData.visibility ? `${Math.round(weatherData.visibility/1000)}km` : 'Good'}
- Wind: ${weatherData.windSpeed || 0} km/h ${weatherData.windDirection ? `from ${getWindDirection(weatherData.windDirection)}` : ''}
- Road conditions: ${weatherData.roadCondition ? `${weatherData.roadCondition.condition}, friction ${weatherData.roadCondition.friction}` : 'Dry'}` :
    'Weather data not available';

  // Build alerts information
  const alertsInfo = weatherAlerts.length > 0 ? `
Weather Alerts:
${weatherAlerts.map(alert => `- ${alert.severity.toUpperCase()}: ${alert.title} (${alert.description})`).join('\n')}` : '';

  // Build driver preferences
  const preferencesInfo = driverPreferences ? `
Driver Preferences:
- Preferred speed: ${driverPreferences.preferredSpeed || 'Standard'} km/h
- Risk tolerance: ${driverPreferences.riskTolerance || 'Medium'}
- Fuel vs Time priority: ${driverPreferences.fuelPriority && driverPreferences.timePriority ?
    `${Math.round(driverPreferences.fuelPriority * 100)}% fuel, ${Math.round(driverPreferences.timePriority * 100)}% time` :
    'Balanced'}` : '';

  return `
Current Location: ${currentLocation.address || `${currentLocation.lat}, ${currentLocation.lng}`}

Active Jobs (${activeJobs.length}):
${jobsText}

${trafficInfo}

${weatherInfo}

${alertsInfo}

Constraints:
- Max driving hours remaining: ${constraints.maxDrivingHours || 'Not specified'}
- Fuel efficiency priority: ${constraints.fuelEfficiency ? 'High' : 'Normal'}
- Traffic awareness: ${constraints.trafficAware ? 'Enabled' : 'Disabled'}
- Weather awareness: ${constraints.weatherAware ? 'Enabled' : 'Disabled'}
- Avoid tolls: ${constraints.avoidTolls ? 'Yes' : 'No'}
- Preferred road types: ${constraints.preferredRoutes?.join(', ') || 'Any'}

${preferencesInfo}

Analyze the current traffic, weather, and road conditions. Provide route optimization recommendations that:
1. Minimize total travel time considering live traffic data
2. Ensure driver safety given current weather and road conditions
3. Balance fuel efficiency with time constraints based on driver preferences
4. Suggest alternative routes if incidents or congestion are detected
5. Provide specific recommendations for handling weather-related challenges
6. Consider driver risk tolerance and time/fuel priorities

Include estimated time/fuel savings and confidence levels for your recommendations.
  `;
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

function buildJobReorderingPrompt(activeJobs: any[], constraints: any, trafficData: any, driverPreferences: any): string {
  const jobsText = activeJobs.map((job, index) =>
    `${index + 1}. ${job.reference}: Pickup ${job.pickup.time} at ${job.pickup.address}, Dropoff ${job.dropoff.time} at ${job.dropoff.address} (${job.earnings})`
  ).join('\n');

  // Build traffic summary for job areas
  const trafficSummary = trafficData?.segments ?
    `Traffic Summary: ${trafficData.segments.some((s: any) => s.congestionLevel === 'blocked' || s.congestionLevel === 'congested') ?
      'Heavy congestion expected' : 'Normal traffic conditions'}` :
    'Traffic data not available';

  // Build driver preferences
  const preferencesInfo = driverPreferences ? `
Driver Preferences:
- Risk tolerance: ${driverPreferences.riskTolerance || 'Medium'}
- Fuel vs Time priority: ${driverPreferences.fuelPriority && driverPreferences.timePriority ?
    `${Math.round(driverPreferences.fuelPriority * 100)}% fuel, ${Math.round(driverPreferences.timePriority * 100)}% time` :
    'Balanced'}` : '';

  return `
Active Jobs to Reorder (${activeJobs.length}):
${jobsText}

${trafficSummary}

Constraints:
- Max driving hours remaining: ${constraints.maxDrivingHours || 'Not specified'}
- Fuel efficiency priority: ${constraints.fuelEfficiency ? 'High' : 'Normal'}
- Traffic awareness: ${constraints.trafficAware ? 'Enabled' : 'Disabled'}

${preferencesInfo}

Analyze the job list and provide an optimal reordering that:
1. Minimizes total travel time considering current traffic conditions
2. Reduces fuel consumption through efficient geographic clustering
3. Maximizes earnings efficiency while respecting time windows
4. Considers job priorities and pickup/dropoff time constraints
5. Accounts for traffic patterns between job locations
6. Balances fuel efficiency with time priorities based on driver preferences

Provide specific time and distance savings estimates, and explain the reasoning behind the recommended order.
  `;
}

function buildFuelEfficiencyPrompt(currentLocation: any, activeJobs: any[], constraints: any, weatherData: any, driverPreferences: any): string {
  const jobsText = activeJobs.map((job, index) =>
    `${index + 1}. ${job.reference}: ${job.pickup.address} → ${job.dropoff.address}`
  ).join('\n');

  // Build weather impact on fuel efficiency
  const weatherImpact = weatherData ? `
Weather Impact on Fuel Efficiency:
- Temperature: ${weatherData.temperature || 'N/A'}°C (${weatherData.temperature && weatherData.temperature < 5 ? 'Cold weather increases fuel consumption' : 'Optimal temperature range'})
- Wind: ${weatherData.windSpeed || 0} km/h ${weatherData.windDirection ? `from ${getWindDirection(weatherData.windDirection)}` : ''} ${weatherData.windSpeed && weatherData.windSpeed > 20 ? '(Headwinds increase fuel use)' : ''}
- Precipitation: ${weatherData.precipitation?.type !== 'none' ? `${weatherData.precipitation.intensity} ${weatherData.precipitation.type} increases rolling resistance` : 'Dry conditions - optimal efficiency'}` : '';

  // Build driver preferences
  const preferencesInfo = driverPreferences ? `
Driver Preferences:
- Fuel priority level: ${driverPreferences.fuelPriority ? `${Math.round(driverPreferences.fuelPriority * 100)}%` : 'Standard'}
- Preferred speed: ${driverPreferences.preferredSpeed || 'Standard'} km/h` : '';

  return `
Current Location: ${currentLocation.address || `${currentLocation.lat}, ${currentLocation.lng}`}

Planned Route Jobs:
${jobsText}

${weatherImpact}

Constraints:
- Fuel efficiency priority: ${constraints.fuelEfficiency ? 'High' : 'Normal'}
- Max driving hours remaining: ${constraints.maxDrivingHours || 'Not specified'}

${preferencesInfo}

Provide comprehensive fuel-efficient routing and driving recommendations:

1. **Route Optimization:**
   - Suggest routes that minimize fuel consumption considering gradients, traffic, and road types
   - Recommend avoiding toll roads or urban areas with frequent stops if fuel savings justify
   - Consider weather impacts on fuel efficiency

2. **Driving Techniques:**
   - Optimal speed recommendations for different road conditions
   - Engine-off strategies for stops over 3 minutes
   - Acceleration and braking patterns for fuel efficiency
   - Gear change recommendations for manual transmission vans

3. **Weather-Adaptive Driving:**
   - Speed adjustments for wind, rain, or temperature conditions
   - Tire pressure and traction considerations
   - HVAC usage optimization

4. **Vehicle-Specific Tips:**
   - Luton van aerodynamics and weight considerations
   - Maintenance reminders that affect fuel efficiency
   - Load distribution impact on consumption

Include specific fuel savings estimates, time trade-offs, and confidence levels for each recommendation.
  `;
}

function buildRestRecommendationsPrompt(currentLocation: any, constraints: any, weatherData: any): string {
  // Build weather considerations for rest stops
  const weatherConsiderations = weatherData ? `
Weather Conditions:
- Temperature: ${weatherData.temperature || 'N/A'}°C
- Conditions: ${weatherData.conditions?.description || weatherData.conditions?.main || 'Clear'}
- Wind: ${weatherData.windSpeed || 0} km/h
- Visibility: ${weatherData.visibility ? `${Math.round(weatherData.visibility/1000)}km` : 'Good'}

Consider weather when recommending rest stops - suggest indoor facilities during extreme weather.` : '';

  return `
Current Location: ${currentLocation.address || `${currentLocation.lat}, ${currentLocation.lng}`}
Max driving hours remaining: ${constraints.maxDrivingHours || 'Not specified'}

${weatherConsiderations}

Recommend optimal rest stops, break locations, and safety considerations:

1. **Legal Requirements:**
   - UK driving regulations (maximum 4.5 hours continuous driving)
   - Minimum break requirements (45 minutes after 4.5 hours)
   - Tachograph requirements for commercial vehicles

2. **Location Recommendations:**
   - Nearby motorway service areas (M6, M1, M25 junctions)
   - Safe parking locations with amenities
   - Truck stops and rest areas
   - Weather-appropriate facilities (indoor vs outdoor)

3. **Health & Safety:**
   - Fatigue indicators and countermeasures
   - Exercise recommendations during breaks
   - Hydration and nutrition advice
   - Weather-related safety considerations

4. **Practical Considerations:**
   - Fuel station availability
   - Food and toilet facilities
   - Parking space for Luton vans
   - Security and lighting conditions

Provide specific locations, estimated driving time to reach them, and comprehensive break planning.
  `;
}

function buildMultiStopOptimizationPrompt(
  currentLocation: any,
  activeJobs: any[],
  constraints: any,
  trafficData: any,
  weatherData: any,
  driverPreferences: any
): string {
  const jobsText = activeJobs.map((job, index) =>
    `${index + 1}. ${job.reference}: ${job.pickup.address} → ${job.dropoff.address} (${job.earnings}, Priority: ${job.priority || 'medium'})`
  ).join('\n');

  // Build traffic analysis
  const trafficAnalysis = trafficData?.segments ? `
Traffic Analysis:
- Route segments: ${trafficData.segments.length}
- Average speed: ${Math.round(trafficData.segments.reduce((sum: number, s: any) => sum + (s.speed || 0), 0) / trafficData.segments.length)} km/h
- Congestion hotspots: ${trafficData.segments.filter((s: any) => s.congestionLevel === 'congested' || s.congestionLevel === 'blocked').length} segments
- Active incidents: ${trafficData.incidents?.length || 0} (${trafficData.incidents?.map((i: any) => i.type).join(', ') || 'None'})` : 'Traffic data not available';

  // Build weather impact
  const weatherImpact = weatherData ? `
Weather Impact:
- Conditions: ${weatherData.conditions?.description || weatherData.conditions?.main || 'Clear'}
- Precipitation: ${weatherData.precipitation?.type !== 'none' ? `${weatherData.precipitation.intensity} ${weatherData.precipitation.type}` : 'None'}
- Visibility: ${weatherData.visibility ? `${Math.round(weatherData.visibility/1000)}km` : 'Good'}
- Road friction: ${weatherData.roadCondition?.friction || 1.0} (1.0 = perfect grip)` : '';

  // Build driver preferences
  const preferencesInfo = driverPreferences ? `
Driver Preferences:
- Risk tolerance: ${driverPreferences.riskTolerance || 'Medium'}
- Fuel vs Time balance: ${driverPreferences.fuelPriority && driverPreferences.timePriority ?
    `${Math.round(driverPreferences.fuelPriority * 100)}% fuel, ${Math.round(driverPreferences.timePriority * 100)}% time` :
    'Balanced'}
- Preferred speed: ${driverPreferences.preferredSpeed || 'Standard'} km/h` : '';

  return `
Complex Multi-Stop Route Optimization Analysis

Current Location: ${currentLocation.address || `${currentLocation.lat}, ${currentLocation.lng}`}
Total Jobs: ${activeJobs.length}

Job Sequence:
${jobsText}

${trafficAnalysis}

${weatherImpact}

${preferencesInfo}

Constraints:
- Max driving hours: ${constraints.maxDrivingHours || 'Not specified'}
- Fuel efficiency priority: ${constraints.fuelEfficiency ? 'High' : 'Normal'}
- Traffic awareness: ${constraints.trafficAware ? 'Enabled' : 'Disabled'}
- Weather awareness: ${constraints.weatherAware ? 'Enabled' : 'Disabled'}
- Vehicle type: Luton van (consider turning radius and parking)

Advanced Multi-Stop Route Optimization Requirements:

1. **Optimal Sequence Algorithm:**
   - Use traveling salesman problem (TSP) optimization principles
   - Consider pickup/dropoff time windows
   - Minimize total distance while respecting priorities
   - Account for one-way streets and turning restrictions

2. **Traffic-Aware Rerouting:**
   - Identify congestion bottlenecks between stops
   - Suggest alternative routes around traffic incidents
   - Consider time-of-day traffic patterns
   - Plan for traffic light timing optimization

3. **Weather-Adaptive Planning:**
   - Adjust routes for reduced visibility or slippery conditions
   - Consider precipitation impact on travel times
   - Plan for weather-related delays and safety margins
   - Optimize for road conditions (wet/dry/icy)

4. **Time Window Optimization:**
   - Respect pickup and delivery time constraints
   - Suggest optimal start times for each leg
   - Identify potential conflicts and alternatives
   - Calculate buffer times for unexpected delays

5. **Resource Optimization:**
   - Minimize fuel consumption through efficient sequencing
   - Optimize driver working hours
   - Consider vehicle-specific constraints (Luton van handling)
   - Balance multiple competing objectives

6. **Risk Assessment:**
   - Identify high-risk segments (traffic, weather, time pressure)
   - Suggest contingency plans for delays
   - Provide confidence levels for the optimized route
   - Recommend safety margins for critical deliveries

Provide a comprehensive optimization analysis including:
- Recommended job sequence with time estimates
- Alternative route options for high-risk segments
- Weather contingency recommendations
- Estimated time/fuel savings compared to naive sequencing
- Confidence levels and risk assessments
- Step-by-step execution plan for the driver
  `;
}

// Health check endpoint
export async function GET() {
  const groq = getGroqClient();

  if (!groq) {
    return NextResponse.json(
      { status: 'error', message: 'GROQ API key not configured' },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: 'healthy',
    message: 'AI Driver Assistant service is operational',
    timestamp: new Date().toISOString()
  });
}
