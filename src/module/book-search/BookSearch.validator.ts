import { NextFunction, Request, Response } from 'express'
import * as SchemaValidator from '@app/utils/validator.utils'
import { BookQuery } from '@app/module/book-search/providers/Provider.interface'
import { CustomError } from '@app/common/errors/custom.error'

export default class BookSearchValidator {
    static searchBooks(request: Request, response: Response, next: NextFunction) {
        const result = SchemaValidator.validate<BookQuery>({
            data: request.query as BookQuery,
            rules: {
                author: SchemaValidator.field('author').required().string(),
                publisher: SchemaValidator.field('publisher').string(),
                year: SchemaValidator.field('year').number(),
                limit: SchemaValidator.field('limit').required().number(),
            },
        })
        if (result) {
            throw CustomError.schemaValidationError(result)
        }
        next()
    }
}
