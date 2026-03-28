import { Book } from "@app/module/book-search/models/Book";

export class XmlBookMapper {
  static toBooks(parsed: any): Book[] {
    return parsed.books.book.map((item: any) => ({
      title: item.title,
      author: item.author,
      isbn: item.isbn,
      quantity: Number(item.stock.quantity),
      price: Number(item.stock.price),
    }));
  }
}