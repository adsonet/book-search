import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'
import { TimeUnit } from '@app/utils/type.utils'
import { DateRange } from '@app/utils/type.utils'
import utc from 'dayjs/plugin/utc'

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.extend(utc)

const defaultTimeZone = 'Africa/Lagos'

dayjs.tz.setDefault(defaultTimeZone)
type DayJSUnit = Lowercase<`${TimeUnit}`>

export default class DateUtils {
    static CBA_DATE_FORMAT = 'DD MMMM YYYY'
    static LAGOS_DT = 'DD MMMM YYYY HH:mm:ss'
    static DEFAULT_TIMEZONE = defaultTimeZone

    static toDayJSUnit(unit: TimeUnit): DayJSUnit {
        return <Lowercase<`${TimeUnit}`>>unit.toLowerCase()
    }

    static now(): Date {
        return dayjs().toDate()
    }

    static parse(date: string, format: string = 'DD/MM/YYYY'): Date | null {
        const result = dayjs(date, format, true)
        if (result.isValid()) {
            return result.toDate()
        }
        return null
    }

    static format(date: Date, format: string = 'DD/MM/YYYY') {
        return dayjs(date).format(format)
    }

    static dateInSeconds(date: Date | string | number): number {
        if (!(date instanceof Date)) {
            date = new Date(date)
        }
        return Math.floor(date.getTime() / 1000)
    }

    static cardExpiryDate(date: string): Date {
        const parsedDate = dayjs(date, 'MM/YY')
        const lastDayOfMonth = parsedDate.endOf('month')
        return lastDayOfMonth.toDate()
    }

    static valid(date: any, format?: string) {
        return dayjs(date, format).isValid()
    }

    static durationSince(
        ref: Date,
        date: Date,
        unit: 'second' | 'minute' | 'hour' | 'day' | 'year' = 'second',
    ): number {
        return dayjs(date).diff(dayjs(ref), unit)
    }

    static nowInISOString(): string {
        return dayjs().toISOString()
    }

    static toDate(str: string): Date {
        return dayjs(str).toDate()
    }

    static toISOString(date: Date): string {
        return dayjs(date).toISOString()
    }

    static add(date: Date | number, amount: number, unit: TimeUnit): Date {
        return dayjs(date).add(amount, DateUtils.toDayJSUnit(unit)).toDate()
    }

    static subtract(date: Date | number, amount: number, unit: TimeUnit): Date {
        return dayjs(date).subtract(amount, DateUtils.toDayJSUnit(unit)).toDate()
    }

    static yesterday(): Date {
        return DateUtils.subtract(DateUtils.now(), 1, TimeUnit.DAY)
    }

    static tomorrow(): Date {
        return DateUtils.add(DateUtils.now(), 1, TimeUnit.DAY)
    }

    static isToday(date: Date): boolean {
        const unit = DateUtils.toDayJSUnit(TimeUnit.DAY)
        return dayjs(date).isSame(dayjs(), unit)
    }

    static isAfter(
        ref: Date | number | string,
        input: Date | number | string,
        unit: TimeUnit = TimeUnit.DAY,
    ): boolean {
        return dayjs(input).isAfter(ref, DateUtils.toDayJSUnit(unit))
    }

    static isBefore(
        ref: Date | number | string,
        input: Date | number | string,
        unit: TimeUnit = TimeUnit.DAY,
    ): boolean {
        return dayjs(input).isBefore(ref, DateUtils.toDayJSUnit(unit))
    }

    static isEqualOrAfter(
        ref: Date | number | string,
        input: Date | number | string,
        unit: TimeUnit = TimeUnit.DAY,
    ): boolean {
        return this.isAfter(ref, input, unit) || this.equals(ref, input, unit)
    }

    static isEqualOrBefore(
        ref: Date | number | string,
        input: Date | number | string,
        unit: TimeUnit = TimeUnit.DAY,
    ): boolean {
        return this.isAfter(ref, input, unit) || this.equals(ref, input, unit)
    }

    static convert(duration: number, input: TimeUnit, output: TimeUnit) {
        return dayjs
            .duration(duration, DateUtils.toDayJSUnit(input))
            .as(DateUtils.toDayJSUnit(output))
    }

    static nowInUnix(): number {
        return dayjs().unix()
    }

    static equals(
        date1: Date | number | string,
        date2: Date | number | string,
        unit: TimeUnit = TimeUnit.SECOND,
    ): boolean {
        return dayjs(date1).isSame(date2, DateUtils.toDayJSUnit(unit))
    }

    static fromCBADate(input?: [number, number, number]): Date | undefined {
        if (
            !input ||
            !Array.isArray(input) ||
            input.length !== 3 ||
            input.some((v) => typeof v !== 'number' || isNaN(v))
        ) {
            return undefined
        }

        const [year, month, day] = input
        return new Date(year, month - 1, day)
    }
    static formatDatesToYMD(start: Date, end: Date): { start: string; end: string } {
        return {
            start: dayjs(start).format('YYYY-MM-DD'),
            end: dayjs(end).format('YYYY-MM-DD'),
        }
    }

    static getStartOfWeek(date: Date): Date {
        const start = new Date(date)
        const day = start.getDay()
        const diff = (day === 0 ? -6 : 1) - day
        start.setDate(start.getDate() + diff)
        return this.normalizeToMidday(start)
    }

    static getFullYear(date: Date) {
        return date.getFullYear().toString()
    }

    static convertToDate(date?: Date | string) {
        if (date) {
            return new Date(date)
        }
        return new Date()
    }

    static convertToDateObj(y: number, m: number, d: number) {
        return new Date(y, m, d)
    }

    static getDateRangeForTimeframe(timeframe: TimeUnit, currentPeriod: Date): DateRange {
        const startDate = DateUtils.convertToDate(currentPeriod)
        const endDate = DateUtils.convertToDate(currentPeriod)

        switch (timeframe) {
            case TimeUnit.WEEK:
                // Start of week (Monday)
                const day = startDate.getDay()
                const diff = startDate.getDate() - day + (day === 0 ? -6 : 1)
                startDate.setDate(diff)

                // End of week (Sunday)
                endDate.setDate(startDate.getDate() + 6)
                break
            case TimeUnit.MONTH:
                // Start of month
                startDate.setDate(1)
                // End of month
                endDate.setMonth(startDate.getMonth() + 1, 0)
                break

            case TimeUnit.YEAR:
                // Start of year
                startDate.setMonth(0, 1)

                // End of year
                endDate.setMonth(11, 31)
                break
        }
        return { startDate, endDate }
    }

    static localizedDate(date: Date) {
        return date.toLocaleDateString()
    }

    static normalizeToMidday(date: Date): Date {
        const d = this.convertToDate(date)
        d.setHours(12, 0, 0, 0)
        return d
    }
}
