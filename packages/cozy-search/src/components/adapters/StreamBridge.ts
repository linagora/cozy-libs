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
    // Clean up any existing stream for this conversation
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
   * Pushes the content chunk to the appropriate stream.
   */
  onDelta(conversationId: string, content: string): void {
    const stream = this.streams.get(conversationId)
    if (stream) {
      stream.push(content)
    }
  }

  /**
   * Called when a 'done' event is received from WebSocket.
   * Completes the stream for the conversation.
   */
  onDone(conversationId: string): void {
    const stream = this.streams.get(conversationId)
    if (stream) {
      stream.complete()
    }
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
  }

  /**
   * Cleans up the stream for a conversation.
   * Should be called when navigating away or on unmount.
   */
  cleanup(conversationId: string): void {
    const stream = this.streams.get(conversationId)
    if (stream) {
      // Notify the provider to mark current message as cancelled
      if (this.cleanupCallback) {
        this.cleanupCallback()
      }
      stream.complete()
      this.streams.delete(conversationId)
    }
  }

  /**
   * Checks if there's an active stream for a conversation.
   */
  hasStream(conversationId: string): boolean {
    return this.streams.has(conversationId)
  }
}
