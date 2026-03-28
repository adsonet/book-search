import App from './index'
import CacheManager from '@config/cache'
import envs, { BASE_API_URL, isProduction } from '@config/env'
import LocaleUtils from '@app/utils/locale.utils'
import routes from '@app/routes'
import ScheduledAsyncService from '@app/utils/concurrency'
import Logger from '@app/utils/logger.utils'
import { HybridCache } from './config/cache/hybrid.cache'
import { InMemoryCache } from './config/cache/in-memory.cache'
import { RedisCache } from './config/cache/redis.cache'
import { ICache } from './config/cache/cache.interface'

const { PORT } = envs

const startServer = async () => {

    let cache: ICache
    if (isProduction()) {
        await CacheManager.initialize()
        cache = new HybridCache(new InMemoryCache(), new RedisCache())
    } else {
        cache = new InMemoryCache();
    }

    await LocaleUtils.load()

    App.initialize({ apiPath: BASE_API_URL, routes, port: PORT, allowedOrigins: ['*'], cache })
    App.listen()
}

async function shutdown() {
    try {
        await ScheduledAsyncService.default.terminate()
        process.exit(0)
    } catch (err: any) {
        Logger.default.error('Error during shutdown', err)
        process.exit(1)
    }
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

startServer()
