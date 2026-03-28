export enum TimeUnit {
    DAY = 'Day',
    WEEK = 'Week',
    MONTH = 'Month',
    YEAR = 'Year',
    SECOND = 'Second',
    MILLISECOND = 'Millisecond',
    MINUTE = 'Minute',
    HOUR = 'Hour',
}

export enum Frequency {
    DAILY = 'Daily',
    WEEKLY = 'Weekly',
    MONTHLY = 'Monthly',
    ANNUALLY = 'Annually',
}

export interface DateRange {
    startDate: Date
    endDate: Date
}