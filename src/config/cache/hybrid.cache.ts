// /cache/HybridCache.ts
import { ICache } from "./cache.interface";

export class HybridCache implements ICache {
  constructor(
    private memory: ICache,
    private redis: ICache
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // try memory first
    const memValue = await this.memory.get<T>(key);
    if (memValue) return memValue;

    // get from Redis instead
    const redisValue = await this.redis.get<T>(key);

    // warm memory cache
    if (redisValue) {
      await this.memory.set(key, redisValue, 60); // short TTL
    }

    return redisValue;
  }

  async set<T>(key: string, value: T, ttl: number = 60): Promise<void> {
    await Promise.all([
      this.memory.set(key, value, ttl),
      this.redis.set(key, value, ttl),
    ]);
  }

  async del(key: string): Promise<void> {
    await Promise.all([
      this.memory.del(key),
      this.redis.del(key),
    ]);
  }

  async exists(key: string): Promise<boolean> {
    return this.redis.exists(key);
  }
}