/**
 * StreamBridge bridges WebSocket events from cozy-realtime to async iterables
 * that can be consumed by assistant-ui's ChatModelAdapter.
 *
 * The bridge receives push-based events from WebSocket and converts them
 * to a pull-based async iterator pattern.
 */

type StreamController = {
  push: (chunk: string) => void
  complete: () => void
  error: (err: Error) => void
  iterator: AsyncIterableIterator<string>
}

export class StreamBridge {
  private streams = new Map<string, StreamController>()
  private cleanupCallback: (() => void) | null = null
  private positionBuffers = new Map<string, Map<number, string>>()
  private nextPositions = new Map<string, number>()
  private sourcesMap = new Map<
    string,
    Array<{
      id?: string
      doctype?: string
      sourceType?: string
      url?: string
      title?: string
      snippet?: string
    }>
  >()

  /**
   * Sets a callback to be invoked when cleanup is called.
   * This allows the provider to mark the current message as cancelled.
   */
  setCleanupCallback(callback: () => void): void {
    this.cleanupCallback = callback
  }

  /**
   * Creates a new async iterable stream for a conversation.
   * The stream will yield string chunks as they arrive via onDelta().
   */
  createStream(conversationId: string): AsyncIterableIterator<string> {
    this.cleanup(conversationId)

    const queue: string[] = []
    let resolveNext: ((value: IteratorResult<string>) => void) | null = null
    let rejectNext: ((err: Error) => void) | null = null
    let isDone = false
    let error: Error | null = null

    const controller: StreamController = {
      push: (chunk: string) => {
        if (isDone) return

        if (resolveNext) {
          resolveNext({ value: chunk, done: false })
          resolveNext = null
          rejectNext = null
        } else {
          queue.push(chunk)
        }
      },
      complete: () => {
        if (isDone) return
        isDone = true

        if (resolveNext) {
          resolveNext({ value: undefined as unknown as string, done: true })
          resolveNext = null
          rejectNext = null
        }
      },
      error: (err: Error) => {
        if (isDone) return
        isDone = true
        error = err

        if (rejectNext) {
          rejectNext(err)
          resolveNext = null
          rejectNext = null
        }
      },
      iterator: {
        next: (): Promise<IteratorResult<string>> =>
          new Promise((resolve, reject) => {
            if (error) {
              reject(error)
              return
            }

            if (queue.length > 0) {
              resolve({ value: queue.shift()!, done: false })
            } else if (isDone) {
              resolve({ value: undefined as unknown as string, done: true })
            } else {
              if (resolveNext) {
                reject(
                  new Error(
                    'StreamBridge: concurrent next() calls are not supported'
                  )
                )
                return
              }
              resolveNext = resolve
              rejectNext = reject
            }
          }),
        [Symbol.asyncIterator]() {
          return this
        }
      }
    }

    this.streams.set(conversationId, controller)
    return controller.iterator
  }

  /**
   * Called when a delta event is received from WebSocket.
   * When a position is provided, chunks are buffered and flushed in order.
   * Without a position, chunks are pushed directly in arrival order.
   */
  onDelta(conversationId: string, content: string, position?: number): void {
    const stream = this.streams.get(conversationId)
    if (!stream) return

    if (position === undefined) {
      stream.push(content)
      return
    }

    // Fast path: chunk arrived in order, no buffering needed
    const nextExpected = this.nextPositions.get(conversationId) ?? 0
    if (position === nextExpected) {
      stream.push(content)
      let next = nextExpected + 1
      // Flush any previously buffered chunks that are now contiguous
      const buffer = this.positionBuffers.get(conversationId)
      if (buffer && buffer.size > 0) {
        while (buffer.has(next)) {
          stream.push(buffer.get(next)!)
          buffer.delete(next)
          next++
        }
        if (buffer.size === 0) {
          this.positionBuffers.delete(conversationId)
        }
      }
      this.nextPositions.set(conversationId, next)
      return
    }

    // Out-of-order: buffer until the gap is filled
    let buffer = this.positionBuffers.get(conversationId)
    if (!buffer) {
      buffer = new Map()
      this.positionBuffers.set(conversationId, buffer)
    }
    buffer.set(position, content)
  }

  /**
   * Called when a 'done' event is received from WebSocket.
   * Completes the stream for the conversation.
   */
  onDone(conversationId: string): void {
    const stream = this.streams.get(conversationId)
    if (stream) {
      stream.complete()
      this.positionBuffers.delete(conversationId)
      this.nextPositions.delete(conversationId)
    }
  }

  /**
   * Called when a 'sources' event is received from WebSocket.
   * Stores sources for the conversation to be retrieved by the adapter.
   */
  onSources(
    conversationId: string,
    sources: Array<{
      id?: string
      doctype?: string
      sourceType?: string
      url?: string
      title?: string
      snippet?: string
    }>
  ): void {
    if (!this.streams.has(conversationId)) return
    this.sourcesMap.set(conversationId, sources)
  }

  /**
   * Returns stored sources for a conversation.
   */
  getSources(conversationId: string):
    | Array<{
        id?: string
        doctype?: string
        sourceType?: string
        url?: string
        title?: string
        snippet?: string
      }>
    | undefined {
    return this.sourcesMap.get(conversationId)
  }

  /**
   * Called when an error occurs.
   * Errors the stream for the conversation.
   */
  onError(conversationId: string, error: Error): void {
    const stream = this.streams.get(conversationId)
    if (stream) {
      stream.error(error)
    }
    this.positionBuffers.delete(conversationId)
    this.nextPositions.delete(conversationId)
    this.sourcesMap.delete(conversationId)
  }

  /**
   * Cleans up the stream for a conversation.
   * Should be called when navigating away or on unmount.
   */
  cleanup(conversationId: string): void {
    const stream = this.streams.get(conversationId)
    if (stream) {
      if (this.cleanupCallback) {
        this.cleanupCallback()
      }
      stream.complete()
      this.streams.delete(conversationId)
    }
    this.positionBuffers.delete(conversationId)
    this.nextPositions.delete(conversationId)
    this.sourcesMap.delete(conversationId)
  }

  /**
   * Checks if there's an active stream for a conversation.
   */
  hasStream(conversationId: string): boolean {
    return this.streams.has(conversationId)
  }
}
