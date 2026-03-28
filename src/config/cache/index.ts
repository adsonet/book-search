import Redis, { ChainableCommander, Redis as RedisClient } from 'ioredis'
import { cacheConfig } from '../env'
import Logger from '@app/utils/logger.utils'

const { host, port, username, password, retries } = cacheConfig

class CacheManager {
    private static _client: RedisClient

    static async initialize() {
        const logger = new Logger(CacheManager.name)
        const maxConnectionRetries = Number.isFinite(retries) ? retries : 10
        this._client = new Redis({
            host,
            port,
            username,
            password,
            lazyConnect: true,
            retryStrategy: (times: number) => {
                if (times > maxConnectionRetries) {
                    throw new Error('Failed to connect to redis, max retries exceeded...')
                }
                return Math.min(Math.pow(2, times) * 50, 3000)
            },
        })

        this._client.on('error', (e) => {
            logger.error('An error occurred', e)
        })

        await this._client.connect()
        logger.info('Redis connected successfully.')
    }

    static isConnected() {
        return this._client.status === 'ready'
    }

    static disconnect() {
        if (this.isConnected()) {
            return this._client.quit()
        }
    }

    private static serialize<T>(value: T): string {
        if (value == null) return ''
        const t = typeof value
        if (t === 'object') {
            return JSON.stringify(value)
        }
        return String(value)
    }

    private static parse<T>(value: string | null): T | null {
        if (!value) return null
        const first = value[0]
        const last = value[value.length - 1]
        if ((first === '{' && last === '}') || (first === '[' && last === ']')) {
            try {
                return JSON.parse(value) as T
            } catch {}
        }
        return value as unknown as T
    }

    static async del(...keys: string[]): Promise<void> {
        await this._client.del(keys)
    }

    static async get<T>(key: string): Promise<T | null> {
        const data = await this._client.get(key)
        return this.parse(data)
    }

    static async set<T>(key: string, value: T, expirationSeconds?: number): Promise<void> {
        const data = this.serialize(value)
        if (expirationSeconds) {
            await this._client.set(key, data, 'EX', expirationSeconds)
            return
        }
        await this._client.set(key, data)
    }

    static async lSet<T>(key: string, values: T[], expirationSeconds?: number): Promise<void> {
        if (!values.length) {
            return
        }
        const data: any[] = []
        for (const value of values) {
            if (typeof value === 'object') {
                data.push(JSON.stringify(value))
            } else {
                data.push(value)
            }
        }
        if (expirationSeconds) {
            const tx = this._client.multi()
            tx.rpush(key, ...data)
            tx.expire(key, expirationSeconds)
            await tx.exec()
            return
        }
    }

    static async lGet<T>(key: string, transformToObject: boolean = false) {
        const result = await this._client.lrange(key, 0, -1)
        if (!result || !result.length) {
            return []
        }
        if (!transformToObject) {
            return result as T[]
        }
        const data: T[] = []
        for (const value of result) {
            data.push(JSON.parse(value))
        }
        return data
    }

    static async hSet<T>(
        key: string,
        field: string,
        value: T,
        expirationSeconds?: number,
    ): Promise<void> {
        const data = this.serialize(value)
        if (expirationSeconds) {
            await this._client.hset(key, field, data, 'EX', expirationSeconds)
            return
        }
        await this._client.hset(key, field, data)
    }

    static async hSetAll<T extends object>(
        key: string,
        fieldValues: T,
        expirationSeconds?: number,
    ): Promise<void> {
        const values: Record<string, number | string> = {}
        for (const [field, value] of Object.entries(fieldValues)) {
            values[field] = this.serialize(value)
        }
        const pipeline = this._client.multi()
        pipeline.hset(key, values)
        if (expirationSeconds) {
            pipeline.expire(key, expirationSeconds)
        }
        await pipeline.exec()
    }

    static async hGet<T>(key: string, field: string): Promise<T | null> {
        const data = await this._client.hget(key, field)
        return this.parse(data)
    }

    static async hGetAll<T>(key: string): Promise<T | null> {
        const fieldValues = await this._client.hgetall(key)
        if (!fieldValues) {
            return null
        }
        const values: Record<string, any> = {}
        for (const [field, value] of Object.entries(fieldValues)) {
            values[field] = this.parse(value)
        }
        return values as T
    }

    static async update<T>(
        key: string,
        value: T,
        defaultExpirationSeconds?: number,
    ): Promise<void> {
        let ttl: number | undefined = await this._client.ttl(key)
        ttl = ttl === -2 ? defaultExpirationSeconds : ttl === -1 ? undefined : ttl
        await this.set(key, value, ttl)
    }

    static async hUpdate(key: string, data: Record<string, any>, expirationSeconds?: number) {
        const records = Object.entries(data).reduce(
            (acc, [k, v]) => {
                acc[k] = this.serialize(v)
                return acc
            },
            {} as Record<string, any>,
        )
        const pipeline = this._client.multi().hset(key, records)
        if (expirationSeconds) {
            pipeline.expire(key, expirationSeconds)
        }
        await pipeline.exec()
    }

    static hDel(key: string, field: string) {
        return this._client.hdel(key, field)
    }

    static async transaction(consumer: (tx: ChainableCommander) => void) {
        const multi = this._client.multi()
        consumer(multi)
        await multi.exec()
    }

    static rEnqueue<T>(listKey: string, value: T) {
        const serialized = this.serialize(value)
        return this._client.rpush(listKey, serialized)
    }

    static async lDequeue<T>(listKey: string) {
        const value = await this._client.lpop(listKey)
        if (!value) return null
        return this.parse(value) as T
    }

    static async exists(key: string): Promise<boolean> {
        const exists = await this._client.exists(key)
        return exists === 1
    }

    static ttl(key: string) {
        return this._client.ttl(key)
    }

    static expire(key: string, expirationSeconds: number) {
        return this._client.expire(key, expirationSeconds)
    }
}

export default CacheManager
