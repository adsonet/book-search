import { InMemoryCache } from "@app/config/cache/in-memory.cache";
import { BookSearchApiClientService } from "@app/module/book-search/BookSearchApiClient.service";
import { BookProvider } from "@app/module/book-search/providers/Provider.interface";

describe("BookSearchApiClientService", () => {
  it("should aggregate results from multiple providers", async () => {
    const mockProvider1: BookProvider = {
      search: jest.fn().mockResolvedValue([
        { title: "Book1", author: "A", isbn: "1", quantity: 1, price: 10 },
      ]),
    };

    const mockProvider2: BookProvider = {
      search: jest.fn().mockResolvedValue([
        { title: "Book2", author: "B", isbn: "2", quantity: 2, price: 20 },
      ]),
    };

    const service = new BookSearchApiClientService([
      mockProvider1,
      mockProvider2,
    ]);

    const result = await service.search({ author: "test" });

    expect(result.length).toBe(2);
    expect(result[0].title).toBe("Book1");
    expect(result[1].title).toBe("Book2");
  });

  it("should use cache when enabled", async () => {
    const mockProvider: BookProvider = {
      search: jest.fn().mockResolvedValue([
        { title: "CachedBook", author: "A", isbn: "1", quantity: 1, price: 10 },
      ]),
    };

    const cache = new InMemoryCache();
    const service = new BookSearchApiClientService([mockProvider]).withCache(cache, 60);

    await service.search({ author: "test" });
    await service.search({ author: "test" });

    expect(mockProvider.search).toHaveBeenCalledTimes(1); // cache hit
  });
});