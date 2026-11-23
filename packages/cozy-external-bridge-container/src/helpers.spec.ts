import * as Comlink from 'comlink'

import {
  extractUrl,
  handleParentOriginRequest,
  restrictToMethodCalls
} from './helpers'

describe('extractUrl', () => {
  it('should extract pathname, hash, and search from a URL starting with http', () => {
    const url = 'http://example.com/path#fragment?query=123'
    const expected = '/path#fragment?query=123'
    expect(extractUrl(url)).toBe(expected)
  })

  it('should return the URL unchanged if it does not start with http', () => {
    const url = '/path?query=123#fragment'
    const expected = '/path?query=123#fragment'
    expect(extractUrl(url)).toBe(expected)
  })
})

describe('handleParentOriginRequest', () => {
  it('should return undefined when event.origin is different from url origin', () => {
    const mockPostMessage = jest.fn()
    const url = 'http://expected-origin.com'
    const eventOrigin = 'http://different-origin.com'
    const mockEvent = {
      origin: eventOrigin,
      data: 'requestParentOrigin',
      source: {
        postMessage: mockPostMessage
      }
    } as unknown as MessageEvent

    const result = handleParentOriginRequest(mockEvent, url)

    expect(result).toBeUndefined()
    expect(mockPostMessage).not.toHaveBeenCalled()
  })

  it('should successfully execute postMessage when origins match', () => {
    const mockPostMessage = jest.fn()
    const url = 'http://expected-origin.com'
    const eventOrigin = 'http://expected-origin.com'
    const mockEvent = {
      origin: eventOrigin,
      data: 'requestParentOrigin',
      source: {
        postMessage: mockPostMessage
      }
    } as unknown as MessageEvent

    const result = handleParentOriginRequest(mockEvent, url)

    expect(result).toBeUndefined()
    expect(mockPostMessage).toHaveBeenCalledWith(
      'answerParentOrigin',
      eventOrigin
    )
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })

  it('should successfully execute postMessage when origins match even if path is different', () => {
    const mockPostMessage = jest.fn()
    const url = 'http://expected-origin.com/new'
    const eventOrigin = 'http://expected-origin.com'
    const mockEvent = {
      origin: eventOrigin,
      data: 'requestParentOrigin',
      source: {
        postMessage: mockPostMessage
      }
    } as unknown as MessageEvent

    const result = handleParentOriginRequest(mockEvent, url)

    expect(result).toBeUndefined()
    expect(mockPostMessage).toHaveBeenCalledWith(
      'answerParentOrigin',
      eventOrigin
    )
    expect(mockPostMessage).toHaveBeenCalledTimes(1)
  })
})

describe('restrictToMethodCalls', () => {
  type Listener = (event: Event) => void
  interface ExposedMethods {
    getLang: () => string
    unknown: () => string
  }

  interface FakeEndpoint {
    postMessage: jest.Mock
    addEventListener: (type: string, listener: unknown) => void
    removeEventListener: (type: string, listener: unknown) => void
  }

  const makeEndpoint = (
    listeners: Set<Listener>,
    otherSideListeners: Set<Listener>
  ): FakeEndpoint => ({
    postMessage: jest.fn((data: unknown): void => {
      setTimeout(() =>
        otherSideListeners.forEach(listener =>
          listener({ data, origin: 'http://localhost' } as MessageEvent)
        )
      )
    }),
    addEventListener: (_type: string, listener: unknown): void => {
      listeners.add(listener as Listener)
    },
    removeEventListener: (_type: string, listener: unknown): void => {
      listeners.delete(listener as Listener)
    }
  })

  const setup = (): {
    remote: Comlink.Remote<ExposedMethods>
    send: (data: unknown) => Promise<void>
    postMessage: jest.Mock
  } => {
    const containerListeners = new Set<Listener>()
    const embeddedListeners = new Set<Listener>()
    const containerEndpoint = makeEndpoint(
      containerListeners,
      embeddedListeners
    )
    const embeddedEndpoint = makeEndpoint(embeddedListeners, containerListeners)

    Comlink.expose(
      { getLang: (): string => 'en' },
      restrictToMethodCalls(containerEndpoint, { getLang: true })
    )

    return {
      remote: Comlink.wrap<ExposedMethods>(embeddedEndpoint),
      send: async (data): Promise<void> => {
        embeddedEndpoint.postMessage(data)
        await new Promise(resolve => setTimeout(resolve, 10))
      },
      postMessage: containerEndpoint.postMessage
    }
  }

  it('should answer the call of an exposed method', async () => {
    const { remote } = setup()

    await expect(remote.getLang()).resolves.toBe('en')
  })

  it('should reject the call of a method that is not exposed', async () => {
    const { remote } = setup()

    await expect(remote.unknown()).rejects.toThrow('Method not allowed')
  })

  it.each([
    { type: 'CONSTRUCT', path: ['constructor', 'constructor'] },
    { type: 'APPLY', path: ['getLang', 'constructor'] },
    { type: 'APPLY', path: ['constructor'] },
    { type: 'APPLY', path: ['toString'] },
    { type: 'GET', path: ['getLang'] },
    { type: 'SET', path: ['getLang'], value: { type: 'RAW', value: 1 } },
    { type: 'ENDPOINT' },
    { type: 'RELEASE' }
  ])('should answer $type on $path with an error', async message => {
    const { send, postMessage } = setup()

    await send({ id: '1', argumentList: [], ...message })

    expect(postMessage).toHaveBeenCalledTimes(1)
    expect(postMessage).toHaveBeenCalledWith({
      id: '1',
      type: 'HANDLER',
      name: 'throw',
      value: {
        isError: true,
        value: { name: 'Error', message: 'Method not allowed' }
      }
    })
  })

  it.each(['requestParentOrigin', { id: '1', type: 'other' }, { type: 'GET' }])(
    'should not answer %j, which is not a Comlink request',
    async message => {
      const { send, postMessage } = setup()

      await send(message)

      expect(postMessage).not.toHaveBeenCalled()
    }
  )
})
