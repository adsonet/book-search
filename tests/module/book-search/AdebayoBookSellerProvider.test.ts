import { AdebayoBookSellerProvider } from "@app/module/book-search/providers/vendors/AdebayoBookSellerProvider";
import { mockXmlResponse } from "../../mocks/fetch.mock";

describe("AdebayoBookSellerProvider", () => {
  it("should fetch and map XML response", async () => {
    const xml = `
      <books>
        <book>
          <title>Hamlet</title>
          <author>Shakespeare</author>
          <isbn>123</isbn>
          <stock>
            <quantity>5</quantity>
            <price>10</price>
          </stock>
        </book>
      </books>
    `;

    mockXmlResponse(xml);

    const provider = new AdebayoBookSellerProvider("http://fake-api");

    const result = await provider.search({ author: "Shakespeare" });

    expect(result[0].title).toBe("Hamlet");
    expect(result[0].quantity).toBe(5);
  });
});