# cozy-external-bridge

This library allows communication between a container app and an app embedded in an iframe. It is used with [cozy-twakechat](https://github.com/cozy/cozy-twakechat/) and [cozy-twakemail](https://github.com/cozy/cozy-twakemail/).

This is the embedded lib. You can also check the [container lib](https://github.com/linagora/cozy-libs/tree/master/packages/cozy-external-bridge-container).

![Cozy Bridge embedded](docs/cozy_bridge_embedded.png)

## Setup

### Class API (React, Vue, ...)

Install package using your usual package manager:

```bash
npm install cozy-external-bridge
```

```bash
yarn add cozy-external-bridge
```

### Window API (Flutter)

Load the script directly in your `index.html`:

```html
<script src="cozy-external-bridge/dist/bundle.js"></script>
```

This will automatically expose methods in `window._cozyBridge`.

## Usage

The API works the same way whether you use Class or Window API. The only difference is how you access the methods:

- **Class API**: `bridge.methodName()`
- **Window API**: `window._cozyBridge.methodName()`

### Class API

```javascript
import { CozyBridge } from 'cozy-external-bridge'

const bridge = new CozyBridge()

if (bridge.isInIframe()) {
  bridge.setupBridge('https://my-safe-container-app.com')

  // Now you can use all the additional methods
  const lang = await bridge.getLang()
  const contacts = await bridge.getContacts()
}
```

### Window API

```javascript
if(window._cozyBridge.isInIframe()) {
  window._cozyBridge.setupBridge('https://my-safe-container-app.com')

  // Now you can use all the additional methods
  const lang = await window._cozyBridge.getLang()
  const contacts = await window._cozyBridge.getContacts()
}
```

⚠️ **Important Warning**: When using the Window API, `setupBridge()` replaces the entire `window._cozyBridge` object. Do NOT cache references like `const bridge = window._cozyBridge` before calling `setupBridge()`, as this would create a stale reference. Always access methods directly via `window._cozyBridge.methodName()`.

### How to determine the target origin?

The bridge simplifies data exchange to a parent window. If not used properly, it enables an evil app to leak data from your app. That's why you must setup the bridge correctly by using a SAFE target origin. Here are some ways to setup the bridge properly.

#### Method 1: Specify the safe target origin directly

You know the URL of the container app? Or you are able to build it? In this case, the setup is easy:

```javascript
import { CozyBridge } from 'cozy-external-bridge'
const bridge = new CozyBridge()
const mySafeTargetOrigin = 'https://my-safe-container-app.com'

if(bridge.isInIframe()) {
  bridge.setupBridge(mySafeTargetOrigin)
  // bridge safe and ready ✅
} else {
  // no bridge ❌
}
```

With Window API:

```javascript
const mySafeTargetOrigin = 'https://my-safe-container-app.com'

if(window._cozyBridge.isInIframe()) {
  window._cozyBridge.setupBridge(mySafeTargetOrigin)
  // bridge safe and ready ✅
} else {
  // no bridge ❌
}
```

#### Method 2: Check the parent origin

In some case, you may want to be able connect to multiple parent app. In this case, you can leverage the `requestParentOrigin()` method:

```javascript
import { CozyBridge } from 'cozy-external-bridge'
const bridge = new CozyBridge()

// check the parent origin e.g. with an allow list
const myParentOriginCheck = (parentOrigin) => {
  if (MY_ALLOW_LIST.includes(parentOrigin)) {
    return true
  }
  return false
}

if(bridge.isInIframe()) {
  const parentOrigin = await bridge.requestParentOrigin()
  if(myParentOriginCheck(parentOrigin)) {
    bridge.setupBridge(parentOrigin)
    // bridge safe and ready ✅
  } else {
    // no bridge ❌
  }
} else {
  // no bridge ❌
}
```

With Window API:

```javascript
// check the parent origin e.g. with an allow list
const myParentOriginCheck = (parentOrigin) => {
  if (MY_ALLOW_LIST.includes(parentOrigin)) {
    return true
  }
  return false
}

if(window._cozyBridge.isInIframe()) {
  const parentOrigin = await window._cozyBridge.requestParentOrigin()

  if(myParentOriginCheck(parentOrigin)) {
    window._cozyBridge.setupBridge(parentOrigin)
    // bridge safe and ready ✅
  } else {
  // no bridge ❌
  }
} else {
  // no bridge ❌
}
```

#### In development environment

In **development environment** ⚠️ only ⚠️, you may want to connect to '\*' as target origin:

```javascript
import { CozyBridge } from 'cozy-external-bridge'
const bridge = new CozyBridge()

if(bridge.isInIframe()) {
  bridge.setupBridge('*')
  // bridge unsafe and ready ⚠️
} else {
  // no bridge ❌
}
```

With Window API:

```javascript
if(window._cozyBridge.isInIframe()) {
  window._cozyBridge.setupBridge('*')
  // bridge unsafe and ready ⚠️
} else {
  // no bridge ❌
}
```

## API Reference

The library provides a unified API with the following methods and type signatures:

### Core Methods (Available immediately)

```typescript
interface CozyBridge {
  /**
   * Request origin from parent iframe
   * @returns Promise<string | undefined> - parent origin or undefined if not in iframe/no answer
   */
  requestParentOrigin(): Promise<string | undefined>

  /**
   * Check if inside an iframe
   * @returns boolean - true if in iframe
   */
  isInIframe(): boolean

  /**
   * [DEPRECATED] Check if target origin is a Cozy origin
   * @param targetOrigin - origin to check
   * @returns boolean
   */
  isInsideCozy(targetOrigin: string): boolean

  /**
   * Setup bridge to communicate with target origin
   * @param targetOrigin - the origin to setup bridge with
   * @returns boolean - true if setup successful
   */
  setupBridge(targetOrigin: string): boolean
}
```

### Additional Methods (Available after setupBridge)

```typescript
interface CozyBridge {
  /**
   * Start sending history updates to parent window
   */
  startHistorySyncing(): void

  /**
   * Stop sending history updates to parent window
   */
  stopHistorySyncing(): void

  /**
   * Get lang from parent window
   * @returns Promise<string> - language code
   */
  getLang(): Promise<string>

  /**
   * Get contacts from parent window
   * @returns Promise<IOCozyContact[]> - array of contacts
   */
  getContacts(): Promise<IOCozyContact[]>

  /**
   * Get flags from parent window
   * @param key - flag key
   * @returns Promise<string | boolean> - flag value
   */
  getFlag(key: string): Promise<string | boolean>

  /**
   * Create documents in parent window
   * @param data - document data
   * @returns Promise<object> - created documents
   */
  createDocs(data: object): Promise<object>

  /**
   * Update documents in parent window
   * @param data - document data
   * @returns Promise<object> - updated documents
   */
  updateDocs(data: object): Promise<object>

  /**
   * Request notification permission from parent window
   * @returns Promise<NotificationPermission> - permission status
   */
  requestNotificationPermission(): Promise<NotificationPermission>

  /**
   * Send notification via parent window
   * @param data - notification data with title and body
   */
  sendNotification(data: { title: string; body: string }): Promise<void>

  /**
   * Perform search via parent window
   * @param searchQuery - search query string
   * @returns Promise<object[]> - search results
   */
  search(searchQuery: string): Promise<object[]>
}
```
