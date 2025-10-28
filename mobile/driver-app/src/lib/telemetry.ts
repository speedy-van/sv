import * as Sentry from '@sentry/react-native';

class TelemetryService {
  private static instance: TelemetryService;

  private constructor() {
    // Initialize Sentry or another monitoring service here
    // DSN should come from environment variables
    Sentry.init({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    });
  }

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public trackError(error: Error, context?: Record<string, any>) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context);
      }
      Sentry.captureException(error);
    });
    console.error('Tracked Error:', error, context);
  }

  public trackAppCrash(error: Error, context?: Record<string, any>) {
    this.trackError(error, {
      ...context,
      crashType: 'app_crash',
    });
  }

  public setUser(user: { id: string; email?: string } | null) {
    Sentry.setUser(user);
  }
}

export const telemetryService = TelemetryService.getInstance();