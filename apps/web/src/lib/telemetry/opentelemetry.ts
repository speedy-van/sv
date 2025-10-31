import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Initialize OpenTelemetry SDK
export function initializeOpenTelemetry() {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SemanticResourceAttributes.SERVICE_NAME]: 'speedy-van-web',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
      }),
      exportIntervalMillis: 10000, // Export every 10 seconds
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable some instrumentations that might cause issues
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable file system instrumentation
        },
        '@opentelemetry/instrumentation-redis': {
          enabled: false, // Disable if not using Redis
        },
        '@opentelemetry/instrumentation-pg': {
          enabled: true, // Enable PostgreSQL instrumentation
        },
        '@opentelemetry/instrumentation-http': {
          enabled: true, // Enable HTTP instrumentation
        },
        '@opentelemetry/instrumentation-express': {
          enabled: true, // Enable Express instrumentation
        },
      }),
    ],
  });

  // Initialize the SDK and register with the OpenTelemetry API
  sdk.start();

  // Gracefully shut down the SDK on process exit
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => console.log('OpenTelemetry terminated'))
      .catch((error) => console.log('Error terminating OpenTelemetry', error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

// Custom metrics and tracing utilities
export class TelemetryService {
  private static instance: TelemetryService;
  private sdk: NodeSDK | null = null;

  private constructor() {}

  public static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  public initialize(sdk: NodeSDK) {
    this.sdk = sdk;
  }

  // Custom span creation for API routes
  public createApiSpan(route: string, method: string) {
    const { trace, context } = require('@opentelemetry/api');
    const tracer = trace.getTracer('speedy-van-api');
    
    return tracer.startSpan(`${method} ${route}`, {
      attributes: {
        'http.method': method,
        'http.route': route,
        'service.name': 'speedy-van-web',
      },
    });
  }

  // Custom span for database operations
  public createDbSpan(operation: string, table: string) {
    const { trace } = require('@opentelemetry/api');
    const tracer = trace.getTracer('speedy-van-db');
    
    return tracer.startSpan(`db.${operation}`, {
      attributes: {
        'db.operation': operation,
        'db.table': table,
        'service.name': 'speedy-van-web',
      },
    });
  }

  // Custom span for business logic
  public createBusinessSpan(operation: string, context: Record<string, any> = {}) {
    const { trace } = require('@opentelemetry/api');
    const tracer = trace.getTracer('speedy-van-business');
    
    return tracer.startSpan(`business.${operation}`, {
      attributes: {
        'business.operation': operation,
        'service.name': 'speedy-van-web',
        ...context,
      },
    });
  }

  // Record custom metrics
  public recordMetric(name: string, value: number, labels: Record<string, string> = {}) {
    const { metrics } = require('@opentelemetry/api');
    const meter = metrics.getMeter('speedy-van-metrics');
    
    const counter = meter.createCounter(name, {
      description: `Custom metric: ${name}`,
    });
    
    counter.add(value, labels);
  }

  // Record API response time
  public recordApiResponseTime(route: string, method: string, duration: number, statusCode: number) {
    this.recordMetric('api_response_time_ms', duration, {
      route,
      method,
      status_code: statusCode.toString(),
    });
  }

  // Record database query time
  public recordDbQueryTime(operation: string, table: string, duration: number) {
    this.recordMetric('db_query_time_ms', duration, {
      operation,
      table,
    });
  }

  // Record business operation time
  public recordBusinessOperationTime(operation: string, duration: number, success: boolean) {
    this.recordMetric('business_operation_time_ms', duration, {
      operation,
      success: success.toString(),
    });
  }

  // Record error
  public recordError(error: Error, context: Record<string, any> = {}) {
    const { trace } = require('@opentelemetry/api');
    const tracer = trace.getTracer('speedy-van-errors');
    
    const span = tracer.startSpan('error.occurred');
    span.setStatus({ code: 2, message: error.message }); // ERROR status
    span.setAttributes({
      'error.name': error.name,
      'error.message': error.message,
      'error.stack': error.stack || '',
      ...context,
    });
    span.end();
  }
}

// Export singleton instance
export const telemetryService = TelemetryService.getInstance();
