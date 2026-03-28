import { BookSearchApiClientService } from "@app/module/book-search/BookSearchApiClient.service";
import { mockJsonResponse, resetFetchMock } from "../mocks/fetch.mock";

describe("Example Client Usage", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("should fetch books by author using the client", async () => {
    // Mocked API response (as JSON)
    mockJsonResponse([
      {
        book: { title: "Hamlet", author: "Shakespeare", isbn: "123" },
        stock: { quantity: 5, price: 10 },
      },
      {
        book: { title: "Macbeth", author: "Shakespeare", isbn: "124" },
        stock: { quantity: 3, price: 12 },
      },
    ]);

    // Simulate example-client
    const client = new BookSearchApiClientService();
    const books = await client.getBooksByAuthor("Shakespeare", 10);

    // Assertions
    expect(books).toHaveLength(2);
    expect(books[0]).toEqual({
      title: "Hamlet",
      author: "Shakespeare",
      isbn: "123",
      quantity: 5,
      price: 10,
    });
    expect(books[1].title).toBe("Macbeth");

    console.log("Example-client output:", books);
  });
});