import fs from 'fs/promises'
import * as path from 'node:path'

export enum MessageType {
    RESPONSE_TYPE = 'RESPONSE_TYPE'
}

export default class LocaleUtils {
    private static messages = {}
    private static messageUris: Record<MessageType, string> = {
        [MessageType.RESPONSE_TYPE]: path.resolve(__dirname, '../resources/locales/messages.json'),
    }

    static async load(type: MessageType = MessageType.RESPONSE_TYPE) {
        const uri = LocaleUtils.messageUris[type]
        if (!uri) {
            return {}
        }
        const file = await fs.readFile(uri)
        const result = JSON.parse(file.toString('utf-8')) as Record<string, string>
        LocaleUtils.messages[type] = result
        return result
    }

    static resolve(type: MessageType, resType: any, params?: any) {
        const result = LocaleUtils.messages[`${type}`]
        if (!result || !result[`${resType}`]) {
            return ''
        }
        let message = result[`${resType}`]
        if (params) {
            Object.keys(params).forEach((key) => {
                message = message.replace(`{${key}}`, params[key])
            })
        }
        return message
    }

    static async resolveAsync(type: MessageType, message: any) {
        let result = LocaleUtils.messages[`${type}`]
        if (!result) {
            result = await LocaleUtils.load(type)
        }
        return result[`${message}`] || ''
    }
}
