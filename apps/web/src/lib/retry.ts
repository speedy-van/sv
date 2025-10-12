export interface RetryOptions {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  factor?: number;
  jitter?: boolean;
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

export interface RetryResult<T> {
  data: T;
  attempts: number;
  totalDelay: number;
}

/**
 * Retry function with exponential backoff and jitter
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    retries = 3,
    baseMs = 200,
    maxMs = 10000,
    factor = 2,
    jitter = true,
    onRetry
  } = options;

  let lastError: Error;
  let totalDelay = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fn();
      return { data, attempts: attempt + 1, totalDelay };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retries) {
        break;
      }

      const delay = Math.min(baseMs * Math.pow(factor, attempt), maxMs);
      const finalDelay = jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
      
      totalDelay += finalDelay;
      
      if (onRetry) {
        onRetry(attempt + 1, lastError, finalDelay);
      }

      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError!;
}

/**
 * Retry with specific error types
 */
export async function retryOnError<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    retries = 3,
    baseMs = 200,
    maxMs = 10000,
    factor = 2,
    jitter = true,
    onRetry
  } = options;

  let lastError: Error;
  let totalDelay = 0;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fn();
      return { data, attempts: attempt + 1, totalDelay };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retries || !shouldRetry(lastError)) {
        break;
      }

      const delay = Math.min(baseMs * Math.pow(factor, attempt), maxMs);
      const finalDelay = jitter ? delay * (0.5 + Math.random() * 0.5) : delay;
      
      totalDelay += finalDelay;
      
      if (onRetry) {
        onRetry(attempt + 1, lastError, finalDelay);
      }

      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError!;
}

/**
 * Retry with timeout
 */
export async function retryWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });

  const retryPromise = retry(fn, options);
  
  return Promise.race([retryPromise, timeoutPromise]);
}

/**
 * Retry with circuit breaker pattern
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly failureThreshold: number = 5,
    private readonly resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }

  getFailureCount(): number {
    return this.failures;
  }
}

/**
 * Retry with rate limiting
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number = 10,
    private readonly refillRateMs: number = 1000
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refillTokens();
    
    if (this.tokens <= 0) {
      const waitTime = this.refillRateMs - (Date.now() - this.lastRefill);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.refillTokens();
      }
    }
    
    this.tokens--;
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = Math.floor(timePassed / this.refillRateMs);
    
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }
}

/**
 * Retry with rate limiting and circuit breaker
 */
export async function retryWithProtection<T>(
  fn: () => Promise<T>,
  options: {
    retryOptions?: RetryOptions;
    timeoutMs?: number;
    circuitBreaker?: CircuitBreaker;
    rateLimiter?: RateLimiter;
  } = {}
): Promise<RetryResult<T>> {
  const { retryOptions, timeoutMs, circuitBreaker, rateLimiter } = options;

  const protectedFn = async (): Promise<T> => {
    if (rateLimiter) {
      await rateLimiter.acquire();
    }
    
    if (circuitBreaker) {
      return circuitBreaker.execute(fn);
    }
    
    return fn();
  };

  if (timeoutMs) {
    return retryWithTimeout(protectedFn, timeoutMs, retryOptions);
  }

  return retry(protectedFn, retryOptions);
}
