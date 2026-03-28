import { Frequency, TimeUnit } from '@app/utils/type.utils'
import { Request } from 'express'

export const toNumberOrDefault = (value: any, fallback: number) => {
    const parsedValue =
        typeof value === 'number'
            ? value
            : typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))
              ? Number(value)
              : NaN
    return isNaN(parsedValue) ? fallback : parsedValue
}

export const toNumber = (value: any, isThrow: boolean = false) => {
    const parsedValue =
        typeof value === 'number'
            ? value
            : typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))
              ? Number(value)
              : NaN
    if (isNaN(parsedValue)) {
        if (isThrow) throw new Error('Failed to parse number')
        return undefined
    }
    return parsedValue
}

export const toNumberOrThrow = (value: any) => toNumber(value, true) as number

export const isNumber = (value: any) => {
    const parsedValue =
        typeof value === 'number'
            ? value
            : typeof value === 'string' && value.trim() !== '' && !isNaN(Number(value))
              ? Number(value)
              : NaN
    return !isNaN(parsedValue)
}

export const getOrDefault = (value?: string, alt: string = '') => value || alt

export const isTrue = (value: string | undefined) => value === 'true'

export const toBool = (value?: any) => {
    if (!value) return false
    if (typeof value === 'boolean') return value as boolean
    return value.toString() === 'true'
}

export function parseFormData<T>(data: string): T | undefined {
    try {
        return JSON.parse(data) as T
    } catch {
        return
    }
}

export function toTimeUnit(frequency?: Frequency | string): TimeUnit | undefined {
    const normalized = frequency?.trim()?.toLowerCase()
    switch (normalized) {
        case 'daily':
            return TimeUnit.DAY
        case 'weekly':
            return TimeUnit.WEEK
        case 'monthly':
            return TimeUnit.MONTH
        case 'annually':
        case 'yearly':
            return TimeUnit.YEAR
        case 'day':
        case 'days':
            return TimeUnit.DAY
        case 'week':
        case 'weeks':
            return TimeUnit.WEEK
        case 'month':
        case 'months':
            return TimeUnit.MONTH
        case 'year':
        case 'years':
            return TimeUnit.YEAR
        default:
            return undefined
    }
}

export function toFrequency(value?: TimeUnit | string): Frequency | undefined {
    const normalized = value?.trim()?.toLowerCase()
    switch (normalized) {
        case 'daily':
        case 'day':
        case 'days':
            return Frequency.DAILY
        case 'weekly':
        case 'week':
        case 'weeks':
            return Frequency.WEEKLY
        case 'monthly':
        case 'month':
        case 'months':
            return Frequency.MONTHLY
        case 'annually':
        case 'yearly':
        case 'year':
        case 'years':
            return Frequency.ANNUALLY
        default:
            return undefined
    }
}

export function getClientIp(req: Request): string {
    let ip = req.ip
    if (!ip && req.headers['x-forwarded-for']) {
        const forwarded = req.headers['x-forwarded-for'] as string
        ip = forwarded.split(',')[0].trim()
    }
    if (!ip) {
        ip = req.socket.remoteAddress || ''
    }

    return ip
}