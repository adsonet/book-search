import { BookProvider, BookQuery } from "../Provider.interface";
import { Book } from "../../models/Book";
import { JsonBookMapper } from "../http/mappers/JsonBookMapper";
import { fetchAndParse } from "../http/api.client";

export class EDFBookSellerProvider implements BookProvider {
    constructor(private baseUrl: string) { }

    async search(query: BookQuery): Promise<Book[]> {
        const url = new URL(`${this.baseUrl}/by-author`);

        if (query.author) url.searchParams.append("author", query.author);
        if (query.limit) url.searchParams.append("limit", String(query.limit));
        
        // Assuming the API supports these query params
        if (query.publisher) url.searchParams.append("publisher", query.publisher); 
        if (query.year) url.searchParams.append("year", String(query.year));

        const parsedResponse = await fetchAndParse(url.toString());
        return JsonBookMapper.toBooks(parsedResponse);
    }
}