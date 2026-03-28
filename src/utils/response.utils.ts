import { HttpStatusCode } from 'axios'
import LocaleUtils, { MessageType } from '@app/utils/locale.utils'
import { NextFunction, Request, Response } from 'express'
import { CustomError } from '@app/common/errors/custom.error'
import { field, validate } from '@app/utils/validator.utils'
import { BASE_API_URL } from '@config/env'

export enum ServerResponseTypes {
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    ROUTE_NOT_FOUND = 'ROUTE_NOT_FOUND',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    INVALID_ENCRYPTED_REQUEST = 'INVALID_ENCRYPTED_REQUEST',
}

export enum GenericResponseTypes {
    FIELD_ALREADY_EXISTS = 'FIELD_ALREADY_EXISTS',
    FIELD_ALREADY_VERIFIED = 'FIELD_ALREADY_VERIFIED',
    FIELD_NOT_VERIFIED = 'FIELD_NOT_VERIFIED',
    INVALID_FIELD = 'INVALID_FIELD',
    EMPTY_FIELD = 'EMPTY_FIELD',
    FIELD_NOT_FOUND = 'FIELD_NOT_FOUND',
    INVALID_JSON_FIELD = 'INVALID_JSON_FIELD',
}

export interface IResponse<T> {
    data?: T
    type?: any
    params?: any
    success: boolean
    code: HttpStatusCode
    err?: any
    message?: string
}

class CustomResponse {
    static build<T>(response: IResponse<T>) {
        if (!response.message) {
            response.message = LocaleUtils.resolve(
                MessageType.RESPONSE_TYPE,
                response.type,
                response.params,
            )
        }
        delete response.params
        return response
    }
}

export function validateSingleId(data: { id: string | undefined }) {
    const result = validate<{ id: any }>({
        data,
        rules: {
            id: field('id').required().number({ minimum: 1 }),
        },
    })
    if (result) {
        throw CustomError.schemaValidationError(result)
    }
}

export function validateSingleParamId(request: Request, response: Response, next: NextFunction) {
    const data = { id: request.params?.id }
    validateSingleId(data)
    next()
}

export default CustomResponse

export function normalizeApiPath(path: string): string {
    return path.replace(new RegExp(`^${BASE_API_URL}/?`), '').replace(/\/+$/, '')
}
