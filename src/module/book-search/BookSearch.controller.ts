import { query, Request, Response } from 'express'
import { HttpStatusCode } from 'axios'
import CustomResponse from '@app/utils/response.utils'
import { EDFBookSellerProvider } from './providers/vendors/EDFBookSellerProvider';
import { AdebayoBookSellerProvider } from './providers/vendors/AdebayoBookSellerProvider';
import { BookSearchApiClientService } from './BookSearchApiClient.service';
import { baseUrls } from '@config/env'
import { toNumberOrThrow } from '@app/utils/utils';
import App from '@app/index';

export default class BookSearchController {

    static async searchBooksByAuthor(request: Request, response: Response) {;
        const provider = [
            new EDFBookSellerProvider(baseUrls.edfBaseUrl),
            new AdebayoBookSellerProvider(baseUrls.adebayoBaseUrl)
        ];
        const client = new BookSearchApiClientService(provider).withCache(App.getCache());
        const books = await client.search(request.query);

        response.status(HttpStatusCode.Ok).send(
            CustomResponse.build({
                code: HttpStatusCode.Ok,
                success: true,
                data: books,
            }),
        )
    }


    static async searchBooks(request: Request, response: Response) {
        const author = request.query.author as string;
        const limit = toNumberOrThrow(request.query.limit);
        
        const provider = [
            new EDFBookSellerProvider(baseUrls.edfBaseUrl),
            new AdebayoBookSellerProvider(baseUrls.adebayoBaseUrl),
            // new AmazonBookSellerProvider(...), // I added this as an example of adding more providers in the future
        ];
        const client = new BookSearchApiClientService(provider).withCache(App.getCache());
        const books = await client.getBooksByAuthor(author, limit);

        response.status(HttpStatusCode.Ok).send(
            CustomResponse.build({
                code: HttpStatusCode.Ok,
                success: true,
                data: books,
            }),
        )
    }

    
}
