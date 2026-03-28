import { Book } from "@app/module/book-search/models/Book";

export class JsonBookMapper {
  static toBooks(data: any[]): Book[] {
    return data.map((item: any) => ({
      title: item.book.title,
      author: item.book.author,
      isbn: item.book.isbn,
      quantity: item.stock.quantity,
      price: item.stock.price,
    }));
  }
}