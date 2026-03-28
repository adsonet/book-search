import { CustomError } from '@app/common/errors/custom.error'
import Logger from '@app/utils/logger.utils'
import cron, { ScheduledTask } from 'node-cron'
import DateUtils from '@app/utils/date.utils'

export type JobScheduleOptions = {
    timezone?: string
    noOverlap?: boolean
    runOnInit?: boolean
}

export class Semaphore {
    private permits: number
    private waiters: Array<() => void> = []

    constructor(permits: number) {
        if (permits <= 0) throw new CustomError({ message: 'Cannot use permits less than 1' })
        this.permits = permits
    }

    async acquire(): Promise<void> {
        if (this.permits > 0) {
            this.permits--
            return
        }
        return new Promise<void>((resolve) => this.waiters.push(resolve))
    }

    release() {
        const next = this.waiters.shift()
        if (next) {
            next()
            return
        }
        this.permits++
    }

    tryAcquire() {
        if (this.permits > 0) {
            this.permits--
            return true
        }
        return false
    }

    drain() {
        while (this.waiters.length > 0) {
            const next = this.waiters.shift()
            next?.()
        }
        this.permits = 0
    }
}

export interface Runnable {
    run: () => Promise<any> | any
    onSuccess?: (value?: any) => void
    onFailure?: (e?: Error) => void
    name?: string
    retries?: number
}

export default class ScheduledAsyncService {
    private readonly maxTaskSize: number
    private semaphore: Semaphore
    private queue: Array<Runnable> = []
    private logger: Logger = new Logger(ScheduledAsyncService.name)
    private tasks: Record<string, ScheduledTask> = {}
    private isBackgroundQueueRunning: boolean = false

    private static _instance: ScheduledAsyncService

    private constructor(taskSize: number) {
        this.maxTaskSize = taskSize
        this.semaphore = new Semaphore(this.maxTaskSize)
    }

    execute(task: Runnable) {
        this.logger.info(`Scheduling task. Queue length before scheduling: ${this.queue.length}`)
        if (!this.semaphore.tryAcquire()) {
            this.queue.push(task)
            this.logger.info(
                `Max concurrency reached. Task queued. Queue length now: ${this.queue.length}`,
            )
            if (!this.isBackgroundQueueRunning) {
                this.logger.info(`Background queue not running. Starting execution.`)
                this.executeQueue()
            }
            return
        }
        this.logger.info(`Permit available. Executing task immediately.`)
        this.executeTask(task)
    }

    private async executeTask(task: Runnable) {
        const name = task.name || 'UnnamedTask'

        this.logger.info(
            `[${name}] Starting task execution. Current queue length: ${this.queue.length}`,
        )

        try {
            const result = await task.run()
            this.logger.info(`[${name}] Task completed successfully.`)

            if (task.onSuccess) {
                task.onSuccess(result)
                this.logger.info(`[${name}] onSuccess callback invoked.`)
            }
        } catch (e: any) {
            this.logger.error(`[${name}] Error executing task: ${e.message}`, e)

            if (task.onFailure) {
                task.onFailure(e)
                this.logger.info(`[${name}] onFailure callback invoked.`)
            }
            if (task.retries) {
                task.retries--
                this.execute(task)
            }
        } finally {
            this.logger.info(`[${name}] Releasing semaphore after task completion.`)
            this.semaphore.release()
        }
    }

    async executeQueue() {
        this.logger.info(`Background queue execution started.`)
        this.isBackgroundQueueRunning = true
        try {
            while (this.queue.length > 0) {
                this.logger.info(`Queue has ${this.queue.length} task(s). Waiting for permit.`)
                await this.semaphore.acquire()
                const task = this.queue.shift()
                this.logger.info(`Dequeued task. Remaining queue length: ${this.queue.length}`)
                if (!task) {
                    this.logger.warn(`No task found after acquiring permit.`)
                    continue
                }
                this.executeTask(task)
            }
        } catch (e: any) {
            this.logger.error(`Error in queue execution: ${e.message}`, e)
        } finally {
            this.isBackgroundQueueRunning = false
            this.logger.info(`Background queue execution finished.`)
        }
    }

    public schedule(
        expr: string,
        task: Omit<Runnable, 'name'> & {
            name: string
        },
        options: JobScheduleOptions = {},
    ) {
        const { name } = task
        const {
            timezone = DateUtils.DEFAULT_TIMEZONE,
            runOnInit = false,
            noOverlap = true,
        } = options

        this.logger.debug('Scheduling task', { name: task.name, expr, options })

        if (!cron.validate(expr)) {
            this.logger.error('Invalid cron expression', { expr })
            return
        }
        if (this.tasks[name]) {
            this.logger.warn('Task already scheduled', { name })
            return
        }
        const opts = {
            name,
            timezone,
            noOverlap,
        }

        const scheduledTask = cron.schedule(expr, () => this.execute(task), opts)
        if (runOnInit) {
            scheduledTask.execute()
        }
        this.tasks[name] = scheduledTask
        this.logger.info('Task scheduled', { name })
    }

    public executeDelayedTask(task: Runnable, delayInMillis: number) {
        setTimeout(() => {
            this.execute(task)
        }, delayInMillis)
    }

    public stop(name: string): void {
        const task = this.tasks[name]
        if (task) {
            task.stop()
            this.logger.info('Task stopped', { name })
        } else {
            this.logger.warn('Stop called on nonexistent task', { name })
        }
    }

    public start(name: string): void {
        const task = this.tasks[name]
        if (task) {
            task.start()
            this.logger.info('Task started', { name })
        } else {
            this.logger.warn('Start called on nonexistent task', { name })
        }
    }

    public async destroyAll(): Promise<void> {
        const names = Object.keys(this.tasks)
        for (const name of names) {
            const task = this.tasks[name]
            try {
                const result = task.destroy()
                if (result instanceof Promise) {
                    await result
                }
                this.logger.info('Task destroyed', { name })
            } catch (err) {
                this.logger.error('Error destroying task', { name, error: err })
            }
            delete this.tasks[name]
            this.logger.info('Task removed from registry', { name })
        }
    }

    public async terminate(): Promise<void> {
        this.logger.info(`Terminating scheduler...`)

        await this.destroyAll()

        if (this.queue.length > 0 || this.isBackgroundQueueRunning) {
            this.logger.info(
                `Waiting for background queue to finish. Remaining tasks: ${this.queue.length}`,
            )
            while (this.queue.length > 0 || this.isBackgroundQueueRunning) {
                await new Promise((resolve) => setTimeout(resolve, 500))
            }
        }

        try {
            this.semaphore.drain()
            this.logger.info(`Semaphore drained.`)
        } catch {
            this.logger.debug(`Semaphore does not support drain(). Skipped.`)
        }

        this.isBackgroundQueueRunning = false
        this.logger.info(`Scheduler terminated successfully.`)
    }

    static get default() {
        if (!ScheduledAsyncService._instance) {
            ScheduledAsyncService._instance = new ScheduledAsyncService(20)
        }
        return ScheduledAsyncService._instance
    }

    static async wait(duration: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, duration)
        })
    }
}
