import { NextFunction, Request, Response } from 'express'
import { CustomError } from '@app/common/errors/custom.error'
import { HttpStatusCode } from 'axios'
import CustomResponse, { ServerResponseTypes } from '@app/utils/response.utils'
import Logger from '@app/utils/logger.utils'
import multer from 'multer'

export const errorMiddleware = async (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction,
) => {
    if (err instanceof multer.MulterError) {
        res.status(HttpStatusCode.BadRequest).send(
            CustomResponse.build({
                code: HttpStatusCode.BadRequest,
                success: false,
                type: err.code,
                message: err.message,
            }),
        )
    }
    if (err instanceof CustomError) {
        const { statusCode = HttpStatusCode.InternalServerError, message } = err

        if (statusCode !== HttpStatusCode.InternalServerError) {
            Logger.default.info(err.toString())
            return res.status(statusCode).send(
                CustomResponse.build({
                    code: statusCode,
                    success: false,
                    type: err.type,
                    message,
                    data: err.data,
                    params: { ...err.params, ...err.data },
                }),
            )
        }
    } else {
        err = CustomError.internalServerError(err)
    }
    Logger.default.error(err.toString())
    res.status(HttpStatusCode.InternalServerError).send(
        CustomResponse.build({
            code: HttpStatusCode.InternalServerError,
            success: false,
            type: ServerResponseTypes.INTERNAL_SERVER_ERROR,
        }),
    )
}
