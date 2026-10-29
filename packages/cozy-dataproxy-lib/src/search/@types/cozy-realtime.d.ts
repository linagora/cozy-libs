declare module 'cozy-realtime' {
  import type CozyClient from 'cozy-client'

  export interface RealtimePluginType {
    (): void
    pluginName: 'realtime'
  }

  export const RealtimePlugin: RealtimePluginType

  export default class CozyRealtime {
    constructor(options: {
      client: CozyClient
      sharedDriveId?: string
      background?: boolean
    })
    subscribe(
      event: string,
      doctype: string,
      handler: (doc: import('../types').CozyDoc) => void
    ): void
    stop(): void
  }
}
