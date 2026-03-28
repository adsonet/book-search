import { ResponseParser } from "../../Provider.interface";

export class JsonParser implements ResponseParser {
  async parse(response: Response): Promise<any> {
    return response.json();
  }
}