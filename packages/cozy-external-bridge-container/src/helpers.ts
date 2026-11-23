import { Endpoint } from 'comlink'

const COMLINK_MESSAGE_TYPES = [
  'GET',
  'SET',
  'APPLY',
  'CONSTRUCT',
  'ENDPOINT',
  'RELEASE'
]

/**
 * Comlink resolves any property path sent by the other side, so exposing an
 * object also exposes its prototype chain (`constructor.constructor` is
 * `Function`). Only let through the calls of the methods we expose, and answer
 * the other Comlink messages with an error so that their caller does not wait
 * forever.
 *
 * The listener is wrapped and RELEASE messages are refused, so an endpoint
 * restricted this way cannot be released.
 */
export const restrictToMethodCalls = (
  endpoint: Endpoint,
  methods: object
): Endpoint => ({
  ...endpoint,
  addEventListener: (type, listener, options): void => {
    endpoint.addEventListener(
      type,
      (event: Event): void => {
        const data = (event as MessageEvent).data as
          { id?: unknown; type?: unknown; path?: unknown } | undefined
        const isMethodCall =
          data?.type === 'APPLY' &&
          Array.isArray(data.path) &&
          data.path.length === 1 &&
          typeof data.path[0] === 'string' &&
          Object.prototype.hasOwnProperty.call(methods, data.path[0])

        if (!isMethodCall) {
          if (
            typeof data?.id === 'string' &&
            typeof data.type === 'string' &&
            COMLINK_MESSAGE_TYPES.includes(data.type)
          ) {
            endpoint.postMessage({
              id: data.id,
              type: 'HANDLER',
              name: 'throw',
              value: {
                isError: true,
                value: { name: 'Error', message: 'Method not allowed' }
              }
            })
          }
          return
        }

        if (typeof listener === 'function') {
          listener(event)
        } else {
          listener.handleEvent(event)
        }
      },
      options
    )
  }
})

export const getIframe = (): HTMLIFrameElement => {
  const iframe = document.getElementById(
    'embeddedApp'
  ) as HTMLIFrameElement | null

  if (iframe === null) {
    throw new Error('No iframe found')
  }

  return iframe
}

export const extractUrl = (url: string): string => {
  if (url.startsWith('http')) {
    const objectUrl = new URL(url)
    return objectUrl.pathname + objectUrl.search + objectUrl.hash
  } else {
    return url
  }
}

export const handleParentOriginRequest = (
  event: MessageEvent,
  url: string
): void => {
  // We do not care about message from other origin that our iframe
  const urlOrigin = new URL(url).origin

  if (event.origin !== urlOrigin) {
    return
  }

  if (event.source && event.data === 'requestParentOrigin') {
    // @ts-expect-error TS typing is incorrect
    event.source.postMessage('answerParentOrigin', event.origin)
  }
}
