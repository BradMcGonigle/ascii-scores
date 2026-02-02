/**
 * Cache configuration options
 */
export interface CacheOptions {
  /** Time to live in seconds (false = indefinite) */
  revalidate?: number | false;
}

/**
 * Cache provider interface - allows different implementations for web vs CLI
 */
export interface CacheProvider {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
}

/**
 * Simple in-memory cache implementation for CLI use
 */
class MemoryCache implements CacheProvider {
  private cache = new Map<string, { value: unknown; expires: number | null }>();

  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check expiration
    if (entry.expires !== null && Date.now() > entry.expires) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttl?: number): void {
    const expires = ttl ? Date.now() + ttl * 1000 : null;
    this.cache.set(key, { value, expires });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * No-op cache provider (always fetches fresh data)
 */
class NoOpCache implements CacheProvider {
  get<T>(): T | undefined {
    return undefined;
  }
  set(): void {}
  delete(): void {}
  clear(): void {}
}

// Default to no-op cache - web app will use Next.js caching, CLI will set memory cache
let cacheProvider: CacheProvider = new NoOpCache();

/**
 * Set the cache provider (call once at app startup)
 */
export function setCacheProvider(provider: CacheProvider): void {
  cacheProvider = provider;
}

/**
 * Create a memory cache instance
 */
export function createMemoryCache(): CacheProvider {
  return new MemoryCache();
}

/**
 * Fetch with caching support
 * In web (Next.js), this uses native fetch caching
 * In CLI, this uses the configured cache provider
 */
export async function fetchWithCache(
  url: string,
  options?: RequestInit & { cache?: CacheOptions }
): Promise<Response> {
  const cacheKey = url;
  const ttl = options?.cache?.revalidate;

  // Check cache first
  if (ttl !== undefined) {
    const cached = cacheProvider.get<{ body: string; status: number; headers: Record<string, string> }>(cacheKey);
    if (cached) {
      return new Response(cached.body, {
        status: cached.status,
        headers: cached.headers,
      });
    }
  }

  // Fetch from network
  const response = await fetch(url, {
    ...options,
    // Remove our custom cache option
    cache: undefined,
  } as RequestInit);

  // Cache the response if configured
  if (response.ok && ttl !== undefined && ttl !== false) {
    const body = await response.text();
    cacheProvider.set(
      cacheKey,
      {
        body,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      },
      typeof ttl === "number" ? ttl : undefined
    );

    // Return a new response since we consumed the body
    return new Response(body, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}
