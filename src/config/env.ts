import path from 'path'
import { config as loadEnv } from 'dotenv'
import { getOrDefault, toNumberOrDefault } from '@app/utils/utils'

const ENV_FILE = `.env${process.env.NODE_ENV === 'test' ? '.test' : ''}`
loadEnv({ path: path.resolve(process.cwd(), ENV_FILE) })

const env = process.env as Record<string, any>
const required = ['TZ', 'PORT']
const missing = required.filter((key) => !env[key])
if (missing.length) {
    throw new Error(`Missing environment vars: ${missing.join(', ')}`)
}

export const NODE_ENV = env.NODE_ENV || 'development'
export const isDevelopment = () => ['dev', 'development'].includes(NODE_ENV)
export const isProduction = () => ['prod', 'production'].includes(NODE_ENV)
export const isStaging = () => NODE_ENV === 'staging'

export const cacheConfig = {
    host: getOrDefault(env.REDIS_HOST),
    port: toNumberOrDefault(env.REDIS_PORT, 5439),
    username: getOrDefault(env.REDIS_USERNAME),
    password: getOrDefault(env.REDIS_PASSWORD),
    retries: toNumberOrDefault(env.MAX_CACHE_CONNECT_RETRIES, 4),
}

export const baseUrls = {
    edfBaseUrl: getOrDefault(env.EDF_BOOK_SEARCH_BASE_API_URL, "http://api.book-seller-example.com"),
    adebayoBaseUrl: getOrDefault(env.ADEBAYO_BOOK_SEARCH_BASE_API_URL)
}

export const API_VERSION = env.API_VERSION || 'v1'
export const BASE_API_URL = `/api/${API_VERSION}`
export default env
