import { ResponseParser } from "../../Provider.interface";
import { XMLParser } from "fast-xml-parser";

export class XmlParser implements ResponseParser {
  private parser = new XMLParser();

  async parse(response: Response): Promise<any> {
    const text = await response.text();
    return this.parser.parse(text);
  }
}