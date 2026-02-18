/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CozyBridge } from './index'

// Backward compatibility: attach to window._cozyBridge
const legacyBridge = new CozyBridge()

// @ts-expect-error No type
window._cozyBridge = {
  requestParentOrigin: legacyBridge.requestParentOrigin,
  isInIframe: legacyBridge.isInIframe,
  isInsideCozy: legacyBridge.isInsideCozy,
  setupBridge: (targetOrigin: string): boolean => {
    const success = legacyBridge.setupBridge(targetOrigin)
    if (success) {
      // @ts-expect-error No type
      window._cozyBridge = {
        // @ts-expect-error No type
        ...window._cozyBridge,
        startHistorySyncing: legacyBridge.startHistorySyncing,
        stopHistorySyncing: legacyBridge.stopHistorySyncing,
        getContacts: legacyBridge.getContacts,
        getLang: legacyBridge.getLang,
        getFlag: legacyBridge.getFlag,
        createDocs: legacyBridge.createDocs,
        updateDocs: legacyBridge.updateDocs,
        requestNotificationPermission:
          legacyBridge.requestNotificationPermission,
        sendNotification: legacyBridge.sendNotification,
        search: legacyBridge.search
      }
    }
    return success
  }
}

export {}
