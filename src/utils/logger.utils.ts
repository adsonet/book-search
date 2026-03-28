import { createLogger, format, transports, Logger as WinstonLogger } from 'winston'
import { Writable } from 'stream'
import envs from '@config/env'

const { LOG_LEVEL } = envs

class Logger {
    private static instance: Logger = new Logger(Logger.name, LOG_LEVEL)
    private logger: WinstonLogger

    constructor(location: string = Logger.name, logLevel = LOG_LEVEL, streams: Writable[] = []) {
        const winstonTransports = streams.map((stream) => new transports.Stream({ stream }))
        this.logger = createLogger({
            level: logLevel,
            format: format.combine(
                format.timestamp(),
                format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaData = this.parseLoggingArgs(meta)

                    return `[${timestamp}-${location}] [${level.toUpperCase()}]: ${message} ${metaData}`
                }),
            ),
            transports: [...winstonTransports, new transports.Console()],
        })
    }

    private parseLoggingArgs(meta) {
        const SPLAT = Symbol.for('splat')
        if (!meta || !meta[SPLAT]) {
            return ''
        }
        let metaData = ''

        const args: any[] = meta[SPLAT]
        for (const arg of args) {
            if (arg instanceof Error) {
                metaData += `${arg.toString()}\n${arg.stack}\n`
            } else if (typeof arg === 'object') {
                metaData += `${JSON.stringify(arg, null, 2)}\n`
            } else if (arg) {
                metaData += `${arg}\n`
            }
        }

        return metaData
    }

    public log(message: string, ...args: any[]): void {
        this.logger.info(message, ...args)
    }

    public debug(message: string, ...args: any[]): void {
        this.logger.debug(message, ...args)
    }

    public info(message: string, ...args: any[]): void {
        this.logger.info(message, ...args)
    }

    public warn(message: string, ...args: any[]): void {
        this.logger.warn(message, ...args)
    }

    public error(message: string, ...args: any[]): void {
        this.logger.error(message, ...args)
    }

    public static get default(): Logger {
        return Logger.instance
    }
}

export default Logger
