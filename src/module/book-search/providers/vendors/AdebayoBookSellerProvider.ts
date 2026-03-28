import { BookProvider, BookQuery } from "../Provider.interface";
import { Book } from "../../models/Book";
import { XmlBookMapper } from "../http/mappers/XmlBookMapper";
import { fetchAndParse } from "../http/api.client";

export class AdebayoBookSellerProvider implements BookProvider {
  constructor(private baseUrl: string) { }

  async search(query: BookQuery): Promise<Book[]> {
    const url = new URL(`${this.baseUrl}/search`);

    if (query.author) url.searchParams.append("author", query.author);
    if (query.limit) url.searchParams.append("limit", String(query.limit));
    
    // Assuming the API supports these query params
    if (query.publisher) url.searchParams.append("publisher", query.publisher);
    if (query.year) url.searchParams.append("year", String(query.year));

    const parsedResponse = await fetchAndParse(url.toString());
    return XmlBookMapper.toBooks(parsedResponse);

  }
}