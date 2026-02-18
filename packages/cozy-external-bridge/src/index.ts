/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
import * as Comlink from 'comlink'

import { IOCozyContact } from 'cozy-client/types/types'

export class CozyBridge {
  private availableMethods?: {
    updateHistory: (url: string) => void
    getContacts: () => Promise<IOCozyContact[]>
    getLang: () => Promise<string>
    getFlag: (key: string) => Promise<string | boolean>
    createDocs: (data: object) => Promise<object>
    updateDocs: (data: object) => Promise<object>
    requestNotificationPermission: () => Promise<NotificationPermission>
    sendNotification: (data: { title: string; body: string }) => Promise<void>
    search: (searchQuery: string) => Promise<object[]>
  }

  // eslint-disable-next-line @typescript-eslint/unbound-method
  private originalPushState = history.pushState
  // eslint-disable-next-line @typescript-eslint/unbound-method
  private originalReplaceState = history.replaceState

  private onPopstate = (): void => {
    this.availableMethods?.updateHistory(document.location.href)
  }

  startHistorySyncing = (): void => {
    if (!this.availableMethods) {
      console.log('🟣 Bridge not setup, cannot start history syncing')
      return
    }
    console.log('🟣 Starting history syncing')
    const methods = this.availableMethods
    history.pushState = (state, title, url): void => {
      this.originalPushState.call(history, state, title, url)
      if (url) {
        methods.updateHistory(url.toString())
      }
    }

    history.replaceState = (state, title, url): void => {
      this.originalReplaceState.call(history, state, title, url)
      if (url) {
        methods.updateHistory(url.toString())
      }
    }

    window.addEventListener('popstate', this.onPopstate)
  }

  stopHistorySyncing = (): void => {
    console.log('🟣 Stopping history syncing')
    history.pushState = this.originalPushState
    history.replaceState = this.originalReplaceState
    window.removeEventListener('popstate', this.onPopstate)
  }

  getContacts = async (): Promise<IOCozyContact[]> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Fetching contacts...')
    const contacts = await this.availableMethods.getContacts()
    console.log('🟣 Twake received contacts...', contacts)
    return contacts
  }

  getLang = async (): Promise<string> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Fetching lang...')
    const lang = await this.availableMethods.getLang()
    console.log('🟣 Twake received lang...', lang)
    return lang
  }

  getFlag = async (key: string): Promise<string | boolean> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Getting flag...')
    const flag = await this.availableMethods.getFlag(key)
    console.log('🟣 Twake received flag...', flag)
    return flag
  }

  createDocs = async (data: object): Promise<object> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Creating file...')
    const createdDocs = await this.availableMethods.createDocs(data)
    console.log('🟣 Twake received created file...', createdDocs)
    return createdDocs
  }

  updateDocs = async (data: object): Promise<object> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Updating data...')
    const updatedDocs = await this.availableMethods.updateDocs(data)
    console.log('🟣 Twake received updated file...', updatedDocs)
    return updatedDocs
  }

  search = async (searchQuery: string): Promise<object[]> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Search...')
    const results = await this.availableMethods.search(searchQuery)
    console.log('🟣 Search results: ', results)
    return results
  }

  requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Requesting notification permission...')
    const notificationPermission =
      await this.availableMethods.requestNotificationPermission()
    console.log(
      '🟣 Notification permission request result: ',
      notificationPermission
    )
    return notificationPermission
  }

  sendNotification = async (data: {
    title: string
    body: string
  }): Promise<void> => {
    if (!this.availableMethods) {
      throw new Error('Bridge not setup')
    }
    console.log('🟣 Sending notification...')
    await this.availableMethods.sendNotification(data)
    console.log('🟣 Notification sent')
  }

  requestParentOrigin = (): Promise<string | undefined> => {
    return new Promise(resolve => {
      // If we are not in an iframe, we return undefined directly
      if (window.self === window.parent) {
        return resolve(undefined)
      }

      const handleMessage = (event: MessageEvent): void => {
        if (event.data === 'answerParentOrigin') {
          clearTimeout(timeout)
          window.removeEventListener('message', handleMessage)
          return resolve(event.origin)
        }
      }

      window.addEventListener('message', handleMessage)

      window.parent.postMessage('requestParentOrigin', '*')

      // If no answer from parent window, we return undefined after 1s
      const timeout = setTimeout(() => {
        window.removeEventListener('message', handleMessage)
        return resolve(undefined)
      }, 1000)
    })
  }

  isInIframe = (): boolean => {
    return window.self !== window.top
  }

  isInsideCozy = (targetOrigin: string): boolean => {
    console.log(
      `[DEPRECATED] isInsideCozy is deprecated:
    - please use isInIframe to check if you are inside an iframe
    - please setup the bridge directly with the legitimate container target origin or check the container target origin on your side`
    )
    try {
      if (!targetOrigin) return false

      const targetUrl = new URL(targetOrigin)

      return (
        targetUrl.hostname.endsWith('.linagora.com') ||
        targetUrl.hostname.endsWith('.twake.app') ||
        targetUrl.hostname.endsWith('.lin-saas.com') ||
        targetUrl.hostname.endsWith('.lin-saas.dev') ||
        targetUrl.hostname.endsWith('.mycozy.cloud') ||
        targetUrl.hostname.endsWith('.cozy.works') ||
        targetUrl.hostname.endsWith('.cozy.company') ||
        targetUrl.hostname.endsWith('.localhost') ||
        targetUrl.hostname.endsWith('.local')
      )
    } catch {
      return false
    }
  }

  setupBridge = (targetOrigin: string): boolean => {
    if (!targetOrigin) {
      console.log('🟣 No target origin, doing nothing')
      return false
    }

    console.log('🟣 Setup bridge to', targetOrigin)

    this.availableMethods = Comlink.wrap(
      Comlink.windowEndpoint(self.parent, self, targetOrigin)
    )

    // Expose methods on the instance
    return true
  }
}

export default CozyBridge
