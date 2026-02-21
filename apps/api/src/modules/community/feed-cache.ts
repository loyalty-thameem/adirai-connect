type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const feedCache = new Map<string, CacheEntry<unknown>>();
const FEED_TTL_MS = 30 * 1000;

function keyForArea(area?: string): string {
  return area ? `area:${area.toLowerCase()}` : 'area:all';
}

export function getCachedFeed<T>(area?: string): T | null {
  const key = keyForArea(area);
  const entry = feedCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    feedCache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCachedFeed<T>(area: string | undefined, value: T): void {
  const key = keyForArea(area);
  feedCache.set(key, { value, expiresAt: Date.now() + FEED_TTL_MS });
}

export function invalidateFeedCache(area?: string): void {
  feedCache.delete(keyForArea(undefined));
  if (area) {
    feedCache.delete(keyForArea(area));
  } else {
    feedCache.clear();
  }
}

