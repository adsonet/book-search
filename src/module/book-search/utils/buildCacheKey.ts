import { BookQuery } from "../providers/Provider.interface";

export function buildCacheKey(query: BookQuery): string {
  return JSON.stringify({
    author: query.author,
    publisher: query.publisher,
    year: query.year,
    limit: query.limit,
  });
}