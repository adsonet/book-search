import { HttpStatusCode } from 'axios'
import { SchemaErrorTypes, SchemaValidatorResult } from '@app/utils/validator.utils'
import { ServerResponseTypes } from '@app/utils/response.utils'

export type ICustomError = {
    code?: HttpStatusCode
    message?: string
    type?: any
    data?: any
    source?: Error
    log?: boolean
    apiError?: boolean
    params?: any
    meta?: any
}

export class CustomError extends Error {
    private readonly opts: ICustomError

    constructor(opts: ICustomError) {
        const { message } = opts
        super(message)
        this.opts = opts
    }

    get statusCode(): HttpStatusCode | undefined {
        return this.opts.code
    }

    get type() {
        return this.opts.type
    }

    set type(type: any) {
        this.opts.type = type
    }

    get data(): any {
        return this.opts.data
    }

    get params(): any {
        return this.opts.params
    }

    get source(): Error | undefined {
        return this.opts.source
    }

    get log(): boolean {
        return this.opts.log ?? false
    }

    toJSON() {
        return {
            ...this.opts,
            stack: this.opts.source?.stack,
        }
    }

    toString() {
        return `Error Details: Message: ${this.message}, Status Code: ${this.statusCode}, Type: ${this.type}, Data: ${JSON.stringify(this.data)}, Params: ${JSON.stringify(this.params)}, Source: ${this.message || 'N/A'}, Stack Trace: ${this.source?.stack}`
    }

    static internalServerError(
        source?: Error,
        type: any = ServerResponseTypes.INTERNAL_SERVER_ERROR,
    ) {
        return new CustomError({
            type,
            code: HttpStatusCode.InternalServerError,
            source,
        })
    }

    static forbidden(type: any, source?: Error, data?: any) {
        return new CustomError({
            type,
            code: HttpStatusCode.Forbidden,
            source,
            data,
        })
    }

    static notFound(params: { type: any; source?: Error; [key: string]: any }) {
        const { type, source, ...others } = params
        return new CustomError({
            type,
            code: HttpStatusCode.NotFound,
            source,
            data: others,
        })
    }

    static badRequestBuilder(params: { type: any; source?: Error; [key: string]: any }) {
        const { type, source, ...others } = params
        return new CustomError({
            type,
            code: HttpStatusCode.BadRequest,
            source,
            data: others,
        })
    }

    static unauthorized(type: any, source?: Error, data?: any) {
        return new CustomError({
            type,
            code: HttpStatusCode.Unauthorized,
            source,
            data,
        })
    }

    static badRequest(type: any, source?: Error, data?: any) {
        return new CustomError({
            type,
            code: HttpStatusCode.BadRequest,
            source,
            data,
        })
    }

    static schemaValidationError(result: SchemaValidatorResult<any>) {
        return new CustomError({
            type: result?.error?.type,
            params: result.error,
            code: HttpStatusCode.BadRequest,
        })
    }

    static fieldValidationError(field: string, type: SchemaErrorTypes) {
        return new CustomError({
            type,
            params: { type, field },
            code: HttpStatusCode.BadRequest,
        })
    }

    static validationError(params: { type: any; source?: Error; [key: string]: any }) {
        const { type, source, ...others } = params
        return new CustomError({
            type,
            code: HttpStatusCode.BadRequest,
            source,
            data: others,
        })
    }

    static internalApiError(params: ICustomError, source?: Error): CustomError {
        return new CustomError({
            ...params,
            apiError: true,
            source,
            message: params.message ?? source?.message,
        })
    }

    static new(message: string, code: HttpStatusCode = HttpStatusCode.BadRequest): CustomError {
        return new CustomError({ message, code })
    }

    withCode(code: HttpStatusCode): CustomError {
        this.opts.code = code
        return this
    }
}
