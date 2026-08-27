import { config } from './index';
import { logger } from '../utils/logger';

// In-memory cache fallback when Redis is not available
class MemoryCache {
  private store: Map<string, { value: string; expiresAt?: number }> = new Map();
  private listeners: Map<string, ((message: string) => void)[]> = new Map();

  on(event: string, handler: (...args: any[]) => void): void {
    // no-op for non-message events
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const expiresAt = ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
      }
    }
  }

  async increment(key: string): Promise<number> {
    const item = this.store.get(key);
    const val = item ? parseInt(item.value) + 1 : 1;
    this.store.set(key, { value: String(val) });
    return val;
  }

  async setHash(key: string, field: string, value: string): Promise<void> {
    const item = this.store.get(key);
    const hash = item ? JSON.parse(item.value) : {};
    hash[field] = value;
    this.store.set(key, { value: JSON.stringify(hash) });
  }

  async getHash(key: string, field: string): Promise<string | null> {
    const item = this.store.get(key);
    if (!item) return null;
    const hash = JSON.parse(item.value);
    return hash[field] || null;
  }

  async getHashAll(key: string): Promise<Record<string, string> | null> {
    const item = this.store.get(key);
    if (!item) return null;
    return JSON.parse(item.value);
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  async quit(): Promise<void> {
    this.store.clear();
  }

  async subscribe(_channel: string, _callback: (message: string) => void): Promise<void> {
    // No-op for memory cache
  }

  async publish(_channel: string, _message: string): Promise<void> {
    // No-op for memory cache
  }
}

let redis: any;
let redisSubscriber: any;
let redisPublisher: any;
let cache: any;

const memoryCache = new MemoryCache();

async function initRedis(): Promise<boolean> {
  try {
    const Redis = (await import('ioredis')).default;
    
    const testRedis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      connectTimeout: 3000,
      retryStrategy: () => null,
    });

    await new Promise<void>((resolve, reject) => {
      testRedis.on('connect', () => resolve());
      testRedis.on('error', (err: any) => reject(err));
      setTimeout(() => reject(new Error('timeout')), 3000);
    });

    await testRedis.quit();
    
    // Redis available, use it
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisSubscriber = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });

    redisPublisher = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
    });

    redis.on('connect', () => logger.info('Redis connected'));
    redis.on('error', (err: any) => logger.error('Redis error:', err));

    cache = {
      get: (key: string) => redis.get(key),
      set: (key: string, value: string, ttl?: number) => ttl ? redis.setex(key, ttl, value) : redis.set(key, value),
      del: (key: string) => redis.del(key),
      delPattern: async (pattern: string) => {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
      },
      increment: (key: string) => redis.incr(key),
      setHash: (key: string, field: string, value: string) => redis.hset(key, field, value),
      getHash: (key: string, field: string) => redis.hget(key, field),
      getHashAll: (key: string) => redis.hgetall(key),
      publish: (channel: string, message: string) => redisPublisher.publish(channel, message),
      subscribe: async (channel: string, callback: (message: string) => void) => {
        await redisSubscriber.subscribe(channel);
        redisSubscriber.on('message', (ch: string, msg: string) => {
          if (ch === channel) callback(msg);
        });
      },
    };

    return true;
  } catch (error) {
    logger.warn('Redis not available, using in-memory cache');
    redis = memoryCache;
    redisSubscriber = memoryCache;
    redisPublisher = memoryCache;
    cache = memoryCache;
    return false;
  }
}

// Initialize with memory cache as default
redis = memoryCache;
redisSubscriber = memoryCache;
redisPublisher = memoryCache;
cache = memoryCache;

// Try to connect to Redis in background
initRedis();

export { redis, redisSubscriber, redisPublisher, cache };
