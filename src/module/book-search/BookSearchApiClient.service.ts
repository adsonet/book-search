import { BookProvider, BookQuery } from "./providers/Provider.interface";
import { Book } from "./models/Book";
import { EDFBookSellerProvider } from "./providers/vendors/EDFBookSellerProvider";
import { baseUrls } from "@app/config/env";
import { ICache } from "@app/config/cache/cache.interface";
import { buildCacheKey } from "./utils/buildCacheKey";
import App from "@app/index";

export class BookSearchApiClientService {
  private cache: ICache | null = null;
  private ttlSeconds = 60; // default TTL

  constructor(
    private providers: BookProvider[] = [
      new EDFBookSellerProvider(baseUrls.edfBaseUrl)
    ]) {}

  async search(query: BookQuery): Promise<Book[]> {
    const cacheKey = buildCacheKey(query);
    
    if (this.cache) {
      const cached = await this.cache.get<Book[]>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const results = await Promise.all(
      this.providers.map((p) => p.search(query))
    );

    const flattened = results.flat();

    if (this.cache) {
      await this.cache.set<Book[]>(cacheKey, flattened, this.ttlSeconds);
    }

    // Flatten the results from all providers
    return flattened;
  }

  withCache(cache: ICache, ttlSeconds = 60): this {
    this.cache = cache;
    this.ttlSeconds = ttlSeconds;
    return this;
  }

  // Filter methods
  getBooksByAuthor(author: string, limit?: number) {
    return this.search({ author, limit });
  }

  getBooksByPublisher(publisher: string, limit?: number) {
    return this.search({ publisher, limit });
  }

  getBooksByYear(year: number, limit?: number) {
    return this.search({ year, limit });
  }
}