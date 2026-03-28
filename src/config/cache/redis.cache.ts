// /cache/RedisCache.ts
import CacheManager from "./index";
import { ICache } from "./cache.interface";

export class RedisCache implements ICache {
  async get<T>(key: string): Promise<T | null> {
    return CacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return CacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    return CacheManager.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return CacheManager.exists(key);
  }
}