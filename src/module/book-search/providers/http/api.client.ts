import { JsonParser } from "./parsers/JsonParser";
import { XmlParser } from "./parsers/XmlParser";
import { ResponseParser } from "../Provider.interface";

// I recommend using a library like axios if extending features for better error handling and http features
export async function fetchAndParse(url: string): Promise<any> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`API HTTP error: ${response.status}`);
  }

  const contentType = response.headers.get("content-type");
  let parser: ResponseParser;

  if (contentType?.includes("xml")) {
    parser = new XmlParser();
  } else {
    parser = new JsonParser();
  }

  return parser.parse(response);
}