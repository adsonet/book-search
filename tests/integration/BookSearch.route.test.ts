import request from "supertest";
import express from "express";
import bookSearchRoute from "@app/module/book-search/BookSearch.route";
import { mockJsonResponse } from "../mocks/fetch.mock";

const app = express();
app.use(express.json());
app.use("/book-search", bookSearchRoute.router);

describe("BookSearch API", () => {
  it("GET /search should return books", async () => {
    mockJsonResponse([
      {
        book: { title: "Hamlet", author: "Shakespeare", isbn: "123" },
        stock: { quantity: 5, price: 10 },
      },
    ]);

    const res = await request(app).get(
      "/book-search/search?author=Shakespeare&limit=1"
    );

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});