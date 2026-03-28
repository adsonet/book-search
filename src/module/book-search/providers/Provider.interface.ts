import { Book } from "../models/Book";

// vendor interface
export interface BookQuery {
  author?: string;
  publisher?: string;
  year?: number;
  limit?: number;
}

export interface BookProvider {
  search(query: BookQuery): Promise<Book[]>;
}

// parsers interface
export interface ResponseParser {
  parse(response: Response): Promise<any>;
}