import { CAPABILITIES } from './capabilities'
import { fetchActionProposal, toSimpleMessages } from './fetchActionProposal'

const createNote = CAPABILITIES[0]

const proposal = {
  sentence: 'Sure — click to create it.',
  action: 'create_note',
  params: { title: 'T', content: 'C' }
}

interface ProposalClient {
  stackClient: { fetchJSON: jest.Mock }
}

const makeClient = (fetchJSON: jest.Mock): ProposalClient => ({
  stackClient: { fetchJSON }
})

type RequestBody = {
  model?: unknown
  stream: boolean
  messages: Array<{ role: string; content: string }>
}
type FetchJSONCall = [string, string, RequestBody]

describe('fetchActionProposal', () => {
  it('POSTs to the completions proxy without a model and returns the proposal', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(proposal) } }]
    })

    const result = await fetchActionProposal(
      makeClient(fetchJSON),
      createNote,
      'Create a note summarizing this discussion',
      [{ role: 'assistant', content: 'Earlier answer' }]
    )

    expect(result).toEqual(proposal)
    expect(fetchJSON).toHaveBeenCalledTimes(1)
    const [method, path, body] = fetchJSON.mock.calls[0] as FetchJSONCall
    expect(method).toBe('POST')
    expect(path).toBe('/ai/v1/chat/completions')
    // omitting "model" makes openRAG use direct-LLM mode (no RAG retrieval)
    expect(body.model).toBeUndefined()
    expect(body.stream).toBe(false)
    expect(body.messages[0].role).toBe('system')
    expect(body.messages[0].content).toContain('"create_note"')
    expect(body.messages[1]).toEqual({
      role: 'assistant',
      content: 'Earlier answer'
    })
    expect(body.messages[body.messages.length - 1]).toEqual({
      role: 'user',
      content: 'Create a note summarizing this discussion'
    })
  })

  it('returns null when the call rejects', async () => {
    const fetchJSON = jest.fn().mockRejectedValue(new Error('500'))
    await expect(
      fetchActionProposal(makeClient(fetchJSON), createNote, 'q', [])
    ).resolves.toBeNull()
  })

  it('returns null on unparseable content', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: 'I cannot help with that.' } }]
    })
    await expect(
      fetchActionProposal(makeClient(fetchJSON), createNote, 'q', [])
    ).resolves.toBeNull()
  })

  it('returns null on unexpected response shape', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({ unexpected: true })
    await expect(
      fetchActionProposal(makeClient(fetchJSON), createNote, 'q', [])
    ).resolves.toBeNull()
  })

  it('keeps only the last 10 history messages', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(proposal) } }]
    })
    const history = Array.from({ length: 15 }, (_, i) => ({
      role: 'user' as const,
      content: `m${i}`
    }))
    await fetchActionProposal(makeClient(fetchJSON), createNote, 'q', history)
    const body = (fetchJSON.mock.calls[0] as FetchJSONCall)[2]
    // system + 10 history + final user query
    expect(body.messages).toHaveLength(12)
    expect(body.messages[1].content).toBe('m5')
  })
})

describe('toSimpleMessages', () => {
  it('flattens text parts and drops system/empty messages', () => {
    expect(
      toSimpleMessages([
        { role: 'system', content: [{ type: 'text', text: 'sys' }] },
        { role: 'user', content: [{ type: 'text', text: 'hello' }] },
        {
          role: 'assistant',
          content: [
            { type: 'text', text: 'part one' },
            { type: 'tool-call' },
            { type: 'text', text: 'part two' }
          ]
        },
        { role: 'assistant', content: [{ type: 'tool-call' }] }
      ])
    ).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'part one\npart two' }
    ])
  })
})
