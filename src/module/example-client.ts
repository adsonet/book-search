import { BookSearchApiClientService } from "./book-search/BookSearchApiClient.service";

(async () => {
    const client = new BookSearchApiClientService();
    const books = await client.getBooksByAuthor("Shakespeare", 10);
    console.log(books);
})();