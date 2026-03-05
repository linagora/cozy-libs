import { StreamBridge } from './StreamBridge'

describe('StreamBridge', () => {
  let bridge: StreamBridge

  beforeEach(() => {
    bridge = new StreamBridge()
  })

  it('should create an async iterable iterator', () => {
    const iterator = bridge.createStream('convo_1')
    expect(typeof iterator.next).toBe('function')
    expect(iterator[Symbol.asyncIterator]).toBeDefined()
  })

  it('should push deltas and yield them from the iterator', async () => {
    const iterator = bridge.createStream('convo_1')

    bridge.onDelta('convo_1', 'Hello ')
    bridge.onDelta('convo_1', 'world!')

    const first = await iterator.next()
    expect(first).toEqual({ value: 'Hello ', done: false })

    const second = await iterator.next()
    expect(second).toEqual({ value: 'world!', done: false })
  })

  it('should mark the stream as done when complete is called', async () => {
    const iterator = bridge.createStream('convo_1')

    bridge.onDelta('convo_1', 'done chunk')
    bridge.onDone('convo_1')

    const first = await iterator.next()
    expect(first).toEqual({ value: 'done chunk', done: false })

    const second = await iterator.next()
    expect(second.done).toBe(true)
  })

  it('should reject the iterator when an error occurs', async () => {
    const iterator = bridge.createStream('convo_1')
    const error = new Error('Socket disconnected')

    bridge.onError('convo_1', error)

    await expect(iterator.next()).rejects.toThrow('Socket disconnected')
  })

  it('should call the cleanup callback and mark the stream complete on cleanup', async () => {
    const cleanupSpy = jest.fn()
    bridge.setCleanupCallback(cleanupSpy)

    const iterator = bridge.createStream('convo_1')
    bridge.cleanup('convo_1')

    expect(cleanupSpy).toHaveBeenCalledTimes(1)
    expect(bridge.hasStream('convo_1')).toBe(false)

    // The iterator should be marked done
    const result = await iterator.next()
    expect(result.done).toBe(true)
  })

  it('multiple unresolved next calls should reject to prevent concurrency issues', async () => {
    const iterator = bridge.createStream('convo_1')

    // Call next twice concurrently
    const p1 = iterator.next()
    const p2 = iterator.next()

    await expect(p2).rejects.toThrow(
      'StreamBridge: concurrent next() calls are not supported'
    )

    // Fulfill the first one
    bridge.onDelta('convo_1', 'ok')
    const res1 = await p1
    expect(res1).toEqual({ value: 'ok', done: false })
  })
})
