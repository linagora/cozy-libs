import type { ChatModelRunOptions } from '@assistant-ui/react'

import { createCozyRealtimeChatAdapter } from './CozyRealtimeChatAdapter'
import type { StreamBridge } from './StreamBridge'
import { DEFAULT_ASSISTANT } from '../constants'

const makeStreamBridge = (): StreamBridge =>
  ({
    createStream: jest.fn(async function* () {
      // no chunks
    }),
    getSources: jest.fn(() => null),
    cleanup: jest.fn()
  }) as unknown as StreamBridge

const makeRunOptions = (): ChatModelRunOptions =>
  ({
    messages: [{ role: 'user', content: [{ type: 'text', text: 'hello' }] }],
    abortSignal: undefined
  }) as unknown as ChatModelRunOptions

const runAdapter = async (
  assistantId?: string,
  extraOptions: Record<string, unknown> = {}
): Promise<jest.Mock> => {
  const fetchJSON = jest.fn().mockResolvedValue({})
  const adapter = createCozyRealtimeChatAdapter(
    {
      client: { stackClient: { fetchJSON } },
      conversationId: 'conv-1',
      assistantId,
      ...extraOptions
    },
    key => key,
    { current: makeStreamBridge() }
  )
  const generator = adapter.run(makeRunOptions()) as AsyncGenerator<unknown>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of generator) {
    // drain the generator
  }
  return fetchJSON
}

describe('CozyRealtimeChatAdapter', () => {
  it('sends the assistantID for a real assistant', async () => {
    const fetchJSON = await runAdapter('real-assistant-id')
    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.objectContaining({ assistantID: 'real-assistant-id' })
    )
  })

  it('omits the assistantID for the default assistant sentinel', async () => {
    const fetchJSON = await runAdapter(DEFAULT_ASSISTANT._id)
    const [, , body] = fetchJSON.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>
    ]
    expect(body).not.toHaveProperty('assistantID')
  })

  it('omits the assistantID when no assistant is selected', async () => {
    const fetchJSON = await runAdapter(undefined)
    const [, , body] = fetchJSON.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>
    ]
    expect(body).not.toHaveProperty('assistantID')
  })
})

describe('CozyRealtimeChatAdapter attachments', () => {
  it('sends attachmentIDs when attachmentIds are provided', async () => {
    const fetchJSON = await runAdapter(undefined, {
      attachmentIds: ['f1', 'f2']
    })
    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.objectContaining({ attachmentIDs: ['f1', 'f2'] })
    )
  })

  it('omits attachmentIDs without a selection', async () => {
    const fetchJSON = await runAdapter(undefined)
    const [, , body] = fetchJSON.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>
    ]
    expect(body).not.toHaveProperty('attachmentIDs')
  })

  it('omits attachmentIDs for an empty list', async () => {
    const fetchJSON = await runAdapter(undefined, { attachmentIds: [] })
    const [, , body] = fetchJSON.mock.calls[0] as [
      string,
      string,
      Record<string, unknown>
    ]
    expect(body).not.toHaveProperty('attachmentIDs')
  })

  it('never posts while the attachments resolution is blocked', async () => {
    const fetchJSON = await runAdapter(undefined, {
      attachmentsBlocked: true,
      attachmentIds: ['f1']
    })
    expect(fetchJSON).not.toHaveBeenCalled()
  })
})
