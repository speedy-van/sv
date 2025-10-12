# Enhanced Driver Notifications System

## Overview

The Enhanced Driver Notifications System provides automatic, real-time notifications to drivers with comprehensive information about weather conditions, traffic updates, route optimization, and restricted zone alerts (ULEZ/Lez zones). This system ensures drivers are fully informed before and during their journeys, enabling better decision-making and cost optimization.

## Features

### 🌤️ Weather Information
- **Real-time weather data** from OpenWeatherMap API
- **Weather impact assessment** (low/medium/high)
- **Condition-specific recommendations** for safe driving
- **Temperature, precipitation, wind speed, and visibility** monitoring
- **Automatic weather alerts** for severe conditions

### 🚦 Traffic Intelligence
- **Live traffic conditions** via Mapbox Directions API
- **Congestion level monitoring** (low/medium/high/severe)
- **Estimated delay calculations** based on current conditions
- **Road closure detection** and alternative route suggestions
- **Real-time traffic recommendations**

### 🛣️ Route Optimization
- **Multiple route profiles** (fastest, shortest, eco-friendly)
- **Fuel efficiency calculations** and cost optimization
- **ULEZ zone avoidance** strategies
- **Alternative route suggestions** with cost-benefit analysis
- **Automatic route recommendations** based on conditions

### ⚠️ Restricted Zone Alerts
- **ULEZ (Ultra Low Emission Zone)** detection and charges
- **LEZ (Low Emission Zone)** identification across UK cities
- **Congestion charge zone** awareness
- **Vehicle compliance requirements** and exemptions
- **Cost impact calculations** and alternatives

## System Architecture

### API Endpoints

#### 1. Weather Forecast API
```
GET /api/weather/forecast?lat={lat}&lng={lng}&date={date}
```
- Provides current and forecast weather data
- Generates weather-specific driving recommendations
- Fallback to mock data if API unavailable

#### 2. Traffic Route API
```
GET /api/traffic/route?from={lat,lng}&to={lat,lng}
```
- Real-time traffic conditions and congestion levels
- Road closure detection and alternative routes
- Delay estimation and traffic recommendations

#### 3. Route Optimization API
```
GET /api/routes/optimize?from={lat,lng}&to={lat,lng}&fuelEfficiency=true
```
- Multiple route options with different profiles
- Fuel cost and ULEZ charge calculations
- Efficiency scoring and optimization recommendations

### Data Flow

1. **Booking Creation** → System detects restricted zones
2. **Weather Check** → Current and forecast conditions retrieved
3. **Traffic Analysis** → Route conditions and alternatives analyzed
4. **Route Optimization** → Best routes calculated for efficiency
5. **Notification Generation** → Comprehensive driver alert created
6. **Real-time Delivery** → Instant notification via Pusher

## Implementation Details

### Enhanced Driver Notifications

The system automatically enhances driver notifications with:

```typescript
interface DriverNotificationData {
  weatherInfo?: WeatherInfo;
  trafficInfo?: TrafficInfo;
  routeOptimization?: RouteOptimization;
  restrictedZoneInfo?: RestrictedZoneInfo;
}
```

### Zone Detection Logic

#### ULEZ Zones (London)
- Covers all of Greater London
- Postcode prefixes: E, EC, N, NW, SE, SW, W, WC, BR, CR, DA, EN, HA, IG, KT, RM, SM, TN, TW, UB, WD
- Charge: £12.50 per entry

#### LEZ Zones (Other Cities)
- Birmingham, Manchester, Leeds, Liverpool, Sheffield, Southampton, Newcastle, Glasgow, Edinburgh, Cardiff
- Charge: £8.00 per entry

#### Congestion Charge Zones
- Central London areas
- Postcode prefixes: E1, E1W, EC1, EC2, EC3, EC4, SE1, SW1, W1, WC1, WC2
- Charge: £15.00 per day

### Weather Impact Assessment

```typescript
function determineWeatherImpact(weatherData: any): 'low' | 'medium' | 'high' {
  if (weatherData.precipitation > 5 || weatherData.visibility < 5 || weatherData.windSpeed > 20) {
    return 'high';
  } else if (weatherData.precipitation > 2 || weatherData.visibility < 8 || weatherData.windSpeed > 15) {
    return 'medium';
  }
  return 'low';
}
```

### Route Efficiency Scoring

```typescript
function calculateEfficiencyScore(distance: number, time: number, fuelCost: number, profile: string): number {
  const distanceEfficiency = Math.max(0, 100 - (distance * 2));
  const timeEfficiency = Math.max(0, 100 - (time * 1.5));
  const fuelEfficiency = Math.max(0, 100 - (fuelCost * 20));
  
  let profileBonus = 0;
  switch (profile) {
    case 'eco': profileBonus = 20; break;
    case 'shortest': profileBonus = 10; break;
    case 'fastest': profileBonus = 5; break;
  }
  
  return Math.min(100, Math.max(0, Math.round(
    (distanceEfficiency * 0.3) + (timeEfficiency * 0.3) + (fuelEfficiency * 0.4) + profileBonus
  )));
}
```

## UI Components

### EnhancedNotificationDisplay

A comprehensive component that renders all notification details:

- **Weather Section**: Blue-themed with weather icons and recommendations
- **Traffic Section**: Orange-themed with congestion levels and alternative routes
- **Route Section**: Green-themed with optimization details and savings
- **Zone Section**: Red-themed with charge information and requirements

### NotificationBell

Updated notification bell component that integrates the enhanced display:

- **Real-time updates** via Pusher integration
- **Enhanced data display** for comprehensive information
- **Priority-based notifications** based on impact levels
- **Interactive elements** for route selection

## Configuration

### Environment Variables

```bash
# Weather API
NEXT_PUBLIC_WEATHER_API_KEY=your_openweathermap_key

# Mapbox API
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Pusher (for real-time notifications)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
```

### API Keys Required

1. **OpenWeatherMap API**: For weather data and forecasts
2. **Mapbox API**: For traffic data and route optimization
3. **Pusher**: For real-time notification delivery

## Usage Examples

### Automatic Notification Generation

```typescript
// When a new booking is created
const notification = await sendDriverNotification(booking, driverId, 'job_offer');

// System automatically:
// 1. Checks if booking is in restricted zones
// 2. Retrieves weather information
// 3. Analyzes traffic conditions
// 4. Optimizes routes for efficiency
// 5. Sends comprehensive notification
```

### Manual Weather Check

```typescript
const weatherInfo = await fetch('/api/weather/forecast?lat=51.5074&lng=-0.1278');
const weatherData = await weatherInfo.json();
```

### Route Optimization

```typescript
const routeData = await fetch('/api/routes/optimize?from=51.5074,-0.1278&to=51.4543,-2.5879&fuelEfficiency=true');
const optimization = await routeData.json();
```

## Benefits

### For Drivers
- **Complete situational awareness** before starting journeys
- **Cost optimization** through route and fuel efficiency
- **Time savings** by avoiding traffic and closures
- **Compliance information** for restricted zones
- **Safety improvements** through weather awareness

### For Business
- **Reduced operational costs** through fuel optimization
- **Improved customer satisfaction** with better ETAs
- **Compliance management** for zone charges
- **Risk mitigation** through weather and traffic alerts
- **Operational efficiency** through route optimization

### For Customers
- **More accurate delivery times** based on real conditions
- **Cost transparency** including zone charges
- **Better service quality** through informed drivers
- **Reduced delays** through proactive route planning

## Future Enhancements

### Planned Features
1. **Machine Learning Integration** for predictive traffic analysis
2. **Advanced Weather Modeling** for long-term planning
3. **Dynamic Pricing** based on route conditions
4. **Driver Behavior Analytics** for optimization
5. **Integration with Vehicle Telematics** for real-time fuel monitoring

### API Expansions
1. **Public Transport Integration** for multimodal routing
2. **Parking Availability** for urban deliveries
3. **Air Quality Monitoring** for health-conscious routing
4. **Event Calendar Integration** for traffic prediction
5. **Construction Schedule** for proactive route planning

## Troubleshooting

### Common Issues

1. **Weather API Unavailable**
   - System falls back to mock data
   - Check API key configuration
   - Verify network connectivity

2. **Traffic Data Missing**
   - Ensure Mapbox token is valid
   - Check coordinate format
   - Verify API rate limits

3. **Notifications Not Delivered**
   - Check Pusher configuration
   - Verify driver notification preferences
   - Check database connectivity

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

This will provide detailed information about:
- API calls and responses
- Zone detection logic
- Route optimization calculations
- Notification generation process

## Support

For technical support or feature requests, please contact:
- **Email**: support@speedy-van.co.uk
- **Phone**: +44 7901846297

## License

This system is proprietary to Speedy Van and is part of the internal driver management platform.
