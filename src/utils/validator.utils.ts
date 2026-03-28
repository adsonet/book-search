import DateUtils from '@app/utils/date.utils'
import { toNumber } from '@app/utils/utils'

export enum SchemaErrorTypes {
    INVALID_EMAIL = 'INVALID_EMAIL',
    INVALID_PARAMETER = 'INVALID_PARAMETER',
    REQUIRED_PARAMETER = 'REQUIRED_PARAMETER',
    INVALID_PASSWORD = 'INVALID_PASSWORD',
    INVALID_DATE = 'INVALID_DATE',
    INVALID_PARAMETER_TYPE = 'INVALID_PARAMETER_TYPE',
    REQUIRED_FILE = 'REQUIRED_FILE',
    INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
    FIELD_DOES_NOT_EXIST = 'FIELD_DOES_NOT_EXIST',
    FIELD_ALREADY_EXIST = 'FIELD_ALREADY_EXIST',
    VALUE_LESS_THAN_MINIMUM = 'VALUE_LESS_THAN_MINIMUM',
    VALUE_GREATER_THAN_MAXIMUM = 'VALUE_GREATER_THAN_MAXIMUM',
    VALUE_OUT_OF_RANGE = 'VALUE_OUT_OF_RANGE',
}

export type SchemaRule<T> = {
    [K in keyof T]: FieldValidator<T[K]>
}

type StringValidatorParams = {
    min?: number
    max?: number
    pattern?: RegExp
    length?: number
}

class FieldValidator<K> {
    private readonly _name?: string
    private _validators: FieldValidatorHandler<K>[] = []

    constructor(name?: string) {
        this._name = name
    }

    get name() {
        return this._name
    }

    get validators() {
        return this._validators
    }

    email(): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (
                value === undefined ||
                value === null ||
                (typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
            ) {
                return
            }
            return SchemaErrorTypes.INVALID_EMAIL
        })
        return this
    }

    contains(fields: K[]): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value === undefined || value === null || fields.includes(value)) {
                return
            }
            return SchemaErrorTypes.INVALID_PARAMETER
        })
        return this
    }

    boolean(): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value === undefined || value === null) return
            if (typeof value === 'string') {
                const isValid = value === 'true' || value === 'false'
                if (isValid) return
            }
            return SchemaErrorTypes.INVALID_PARAMETER
        })
        return this
    }

    number(options?: {
        minimum?: number
        maximum?: number
        ranges?: [number, number][]
        value?: number
    }): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value === undefined || value === null) return

            const parsedValue = toNumber(value)
            if (!parsedValue) {
                return SchemaErrorTypes.INVALID_PARAMETER_TYPE
            }

            if (options?.value !== undefined && parsedValue != options.value) {
                return SchemaErrorTypes.INVALID_PARAMETER_TYPE
            }

            if (options?.minimum !== undefined && parsedValue < options.minimum) {
                return SchemaErrorTypes.VALUE_LESS_THAN_MINIMUM
            }

            if (options?.maximum !== undefined && parsedValue > options.maximum) {
                return SchemaErrorTypes.VALUE_GREATER_THAN_MAXIMUM
            }

            if (options?.ranges) {
                const inAnyRange = options.ranges.some(
                    ([min, max]) => parsedValue >= min && parsedValue <= max,
                )
                if (!inAnyRange) {
                    return SchemaErrorTypes.VALUE_OUT_OF_RANGE
                }
            }
        })

        return this
    }

    string(params?: StringValidatorParams): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value === undefined || value === null) return
            if (typeof value === 'string') {
                if (!params) {
                    return
                }
                const { min, max, pattern, length } = params
                if (pattern) {
                    if (!pattern.test(value)) {
                        return SchemaErrorTypes.INVALID_PARAMETER
                    }
                }
                if (length && value.length !== length) {
                    return SchemaErrorTypes.INVALID_PARAMETER
                }
                if (min && value.length < min) {
                    return SchemaErrorTypes.INVALID_PARAMETER
                }

                if (max && value.length > max) {
                    return SchemaErrorTypes.INVALID_PARAMETER
                }
            }
        })
        return this
    }

    required(): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value !== undefined && value !== null) return
            return SchemaErrorTypes.REQUIRED_PARAMETER
        })
        return this
    }

    date(): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value === undefined || value === null || DateUtils.valid(value, 'DD/MM/YYYY')) {
                return
            }
            return SchemaErrorTypes.INVALID_DATE
        })
        return this
    }

    isArray<T>(validator?: FieldValidator<T> | SchemaRule<T>): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value === undefined || value === null) {
                return
            }

            if (!Array.isArray(value)) {
                return SchemaErrorTypes.INVALID_PARAMETER_TYPE
            }

            if (!validator) {
                return
            }

            const arr: any[] = value as any
            for (let i = 0; i < arr.length; i++) {
                const item = arr[i]

                if (validator instanceof FieldValidator) {
                    const err = (validator as FieldValidator<T>).validate(item)
                    if (err) {
                        return err
                    }
                } else {
                    const res = validate({ data: item as any, rules: validator as any })
                    if (res) {
                        return res.error
                    }
                }
            }
            return
        })
        return this
    }

    isObject<T>(validator?: FieldValidator<T> | SchemaRule<T>): FieldValidator<K> {
        this._validators.push((value?: K) => {
            if (value === undefined || value === null) {
                return
            }

            if (typeof value !== 'object' || Array.isArray(value)) {
                return SchemaErrorTypes.INVALID_PARAMETER_TYPE
            }

            if (!validator) {
                return
            }

            if (validator instanceof FieldValidator) {
                const err = validator.validate(value as any)
                if (err) {
                    return err
                }
                return
            }

            const res = validate({ data: value as any, rules: validator as any })
            if (res) {
                return res.error
            }

            return
        })
        return this
    }

    validate(value: K) {
        const validators = this.validators

        for (const validator of validators) {
            const errorType = validator(value)
            if (!errorType) {
                continue
            }

            return errorType
        }
    }
}

export function field<T>(name?: string): FieldValidator<T> {
    return new FieldValidator<T>(name)
}

type FieldValidatorHandler<T> = (
    value?: T,
) => SchemaErrorTypes | { field: string; value: any; type: SchemaErrorTypes } | undefined

export type SchemaValidatorParams<T> = {
    data: T
    rules: SchemaRule<T>
    path?: string
}

export type SchemaValidatorResult<T> = {
    error: { field: string; value: T; type: SchemaErrorTypes } | undefined
    index?: number
}

export function validate<T>(
    params: SchemaValidatorParams<T>,
): SchemaValidatorResult<any> | undefined {
    const { data, rules } = params

    for (const [key, rule] of Object.entries(rules)) {
        const value = data[key] as T[keyof T]

        const typedRule = rule as FieldValidator<T[keyof T]>
        const validators = typedRule.validators

        for (const validator of validators) {
            const error = validator(value)
            if (!error) {
                continue
            }
            if (typeof error === 'object') {
                return { error }
            }
            const result = { field: typedRule.name || key, value, type: error }

            return {
                error: result,
            }
        }
    }
}
