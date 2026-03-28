import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { HttpStatusCode } from 'axios'
import CacheManager from '@config/cache'
import CustomResponse, { ServerResponseTypes } from '@app/utils/response.utils'
import { IRoute } from '@app/routes/route.interface'
import 'express-async-errors'
import { errorMiddleware } from '@app/middleware/error.middleware'
import Logger from '@app/utils/logger.utils'
import { API_VERSION } from '@config/env'
import * as http from 'node:http'
import { ICache } from '@config/cache/cache.interface'

export type AppAttributes = {
    port: number
    apiPath: string
    allowedOrigins: string[]
    routes: IRoute[],
    cache: ICache
}

class App {
    private static app: Application
    private static port: number
    private static apiPath: string
    private static cache: ICache

    static initialize({ port, allowedOrigins, apiPath, routes, cache }: AppAttributes) {
        this.app = express()
        this.port = port
        this.apiPath = apiPath
        this.cache = cache
        this.middlewareInitializer(allowedOrigins)
        this.routeInitializer(routes)
        this.app.use(errorMiddleware)
    }

    static getCache(): ICache {
        return this.cache
    }

    private static middlewareInitializer(allowedOrigins: string[]) {
        this.app.set('trust proxy', true) // trust the headers added by the proxy
        this.app.use(express.json())
        this.app.use(helmet())
        this.app.use(
            cors({
                origin: allowedOrigins,
            }),
        )
        this.app.use(express.urlencoded({ extended: true }))
    }

    private static routeInitializer(routes: IRoute[]) {
        routes.forEach((route) => {
            if (route.path && route.path[route.path.length - 1] === '/') {
                throw new Error('Hello developer, remove the trailing slash in your path')
            }
            this.app.use(`${this.apiPath}/${route.path}`, route.router)
        })
        this.app.get('/', (req, res) => {
            res.status(HttpStatusCode.Ok).send(
                CustomResponse.build({
                    code: HttpStatusCode.Ok,
                    success: true,
                    data: {
                        apiVersion: API_VERSION
                    },
                }),
            )
        })

        this.app.get('/status', (req, res) => {
            res.status(HttpStatusCode.Ok).send(
                CustomResponse.build({
                    code: HttpStatusCode.Ok,
                    success: true,
                    data: {
                        isRedisActive: CacheManager.isConnected(),
                    },
                }),
            )
        })

        this.app.all('*', (req, res) => {
            res.status(HttpStatusCode.NotFound).send(
                CustomResponse.build({
                    code: HttpStatusCode.NotFound,
                    success: false,
                    type: ServerResponseTypes.ROUTE_NOT_FOUND,
                }),
            )
        })
    }

    static listen() {
        const httpServer = http.createServer(this.app)
        httpServer.listen(this.port, () => {
            Logger.default.info(`Server running on ${this.port}\n`)
        })
    }
}

export default App
