import type {
  ChatModelRunOptions,
  ChatModelRunResult
} from '@assistant-ui/react'

import { createCozyRealtimeChatAdapter } from './CozyRealtimeChatAdapter'
import type { StreamBridge } from './StreamBridge'

const makeStreamBridge = (): StreamBridge =>
  ({
    createStream: jest.fn(async function* () {
      // empty stream: the normal flow completes immediately
    }),
    getSources: jest.fn(() => null),
    cleanup: jest.fn()
  }) as unknown as StreamBridge

type RunResult = { content: Array<Record<string, unknown>> } & {
  status?: Record<string, unknown>
}

const runAdapterWithController = async (
  query: string,
  fetchJSON: jest.Mock,
  controller: AbortController
): Promise<RunResult[]> => {
  const adapter = createCozyRealtimeChatAdapter(
    {
      client: { stackClient: { fetchJSON } },
      conversationId: 'conv-1'
    },
    (key: string) => key,
    { current: makeStreamBridge() }
  )
  const results: RunResult[] = []
  const options = {
    messages: [{ role: 'user', content: [{ type: 'text', text: query }] }],
    abortSignal: controller.signal
  } as unknown as ChatModelRunOptions
  // ChatModelAdapter['run'] is typed as
  // `Promise<ChatModelRunResult> | AsyncGenerator<ChatModelRunResult, void>`;
  // our implementation is always an async generator, so narrow the type for
  // `for await` (a bare Promise isn't async-iterable, tsc TS2504 otherwise).
  for await (const result of adapter.run(
    options
  ) as AsyncGenerator<ChatModelRunResult>) {
    results.push(result as unknown as RunResult)
  }
  return results
}

const runAdapter = async (
  query: string,
  fetchJSON: jest.Mock
): Promise<RunResult[]> =>
  runAdapterWithController(query, fetchJSON, new AbortController())

describe('CozyRealtimeChatAdapter action branch', () => {
  const proposal = {
    sentence: 'Sure, click to confirm.',
    action: 'create_note',
    lang: 'en',
    params: { title: 'My note', content: '# Summary' }
  }

  it('yields text + tool-call and skips the conversation flow on match', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(proposal) } }]
    })

    const results = await runAdapter(
      'Create a note summarizing this discussion',
      fetchJSON
    )

    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/v1/chat/completions',
      expect.any(Object)
    )
    expect(fetchJSON).not.toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.any(Object)
    )

    const last = results[results.length - 1]
    expect(last.content.find(p => p.type === 'text')).toMatchObject({
      text: 'Sure, click to confirm.'
    })
    expect(last.content.find(p => p.type === 'tool-call')).toMatchObject({
      toolName: 'create_note',
      args: { lang: 'en', params: proposal.params }
    })
  })

  it('keeps the normal conversation flow for non-action messages', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({})

    const results = await runAdapter('What is the weather like?', fetchJSON)

    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.any(Object)
    )
    expect(
      results.every(r => r.content.every(p => p.type !== 'tool-call'))
    ).toBe(true)
  })

  it('yields a terminal cancelled status and skips the card when aborted during the side-call', async () => {
    const controller = new AbortController()
    const fetchJSON = jest.fn((method: string, path: string) => {
      if (path === '/ai/v1/chat/completions') {
        controller.abort()
        return Promise.resolve({
          choices: [{ message: { content: JSON.stringify(proposal) } }]
        })
      }
      return Promise.resolve({})
    })

    const results = await runAdapterWithController(
      'Create a note summarizing this discussion',
      fetchJSON,
      controller
    )

    const last = results[results.length - 1]
    expect(last.status).toMatchObject({
      type: 'incomplete',
      reason: 'cancelled'
    })
    expect(
      results.every(r => r.content.every(p => p.type !== 'tool-call'))
    ).toBe(true)
    expect(fetchJSON).not.toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.any(Object)
    )
  })

  it('falls back to the conversation flow when the side-call fails', async () => {
    const fetchJSON = jest.fn((method: string, path: string) =>
      path === '/ai/v1/chat/completions'
        ? Promise.reject(new Error('boom'))
        : Promise.resolve({})
    )

    const results = await runAdapter(
      'Crée une note avec le résumé de cette discussion',
      fetchJSON
    )

    expect(fetchJSON).toHaveBeenCalledWith(
      'POST',
      '/ai/chat/conversations/conv-1',
      expect.any(Object)
    )
    expect(
      results.every(r => r.content.every(p => p.type !== 'tool-call'))
    ).toBe(true)
  })
})
