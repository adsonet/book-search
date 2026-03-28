import { EDFBookSellerProvider } from "@app/module/book-search/providers/vendors/EDFBookSellerProvider";
import { mockJsonResponse } from "../../mocks/fetch.mock";

describe("EDFBookSellerProvider", () => {
  it("should fetch and map JSON response", async () => {
    mockJsonResponse([
      {
        book: { title: "Hamlet", author: "Shakespeare", isbn: "123" },
        stock: { quantity: 5, price: 10 },
      },
    ]);

    const provider = new EDFBookSellerProvider("http://fake-api");

    const result = await provider.search({ author: "Shakespeare" });

    expect(result[0]).toEqual({
      title: "Hamlet",
      author: "Shakespeare",
      isbn: "123",
      quantity: 5,
      price: 10,
    });
  });
});