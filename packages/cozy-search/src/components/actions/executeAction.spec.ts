import { executeAction } from './executeAction'

jest.mock('cozy-client', () => ({
  generateWebLink: jest.fn(
    ({
      slug,
      searchParams
    }: {
      slug: string
      searchParams: Array<[string, string]>
    }): string =>
      `https://claude-${slug}.mycozy.cloud/?${new URLSearchParams(
        searchParams
      ).toString()}`
  )
}))

jest.mock('cozy-client/dist/models/note', () => ({
  fetchURL: jest.fn(
    (client: unknown, file: { id: string }): Promise<string> =>
      Promise.resolve(`https://notes/#/n/${file.id}`)
  )
}))

const makeClient = (
  fetchJSON = jest.fn()
): Parameters<typeof executeAction>[0] =>
  ({
    stackClient: { fetchJSON },
    getStackClient: () => ({ uri: 'https://claude.mycozy.cloud' }),
    getInstanceOptions: () => ({ subdomain: 'flat' })
  }) as Parameters<typeof executeAction>[0]

// `expect.objectContaining` is typed as `(obj: E) => any` in @types/jest,
// which trips no-unsafe-assignment wherever the result is embedded in an
// object literal. Re-type it to echo the input shape instead of `any`.
const objectContaining = <T>(obj: T): T => expect.objectContaining(obj) as T

describe('executeAction create_note', () => {
  it('POSTs to /notes with schema and converted content, returns note url', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({ data: { id: 'note-1' } })
    const result = await executeAction(makeClient(fetchJSON), 'create_note', {
      title: 'My summary',
      content: '# Points\n- one'
    })

    expect(fetchJSON).toHaveBeenCalledWith('POST', '/notes', {
      data: {
        type: 'io.cozy.notes.documents',
        attributes: objectContaining({
          title: 'My summary',
          schema: objectContaining({ topNode: 'doc' }),
          content: objectContaining({ type: 'doc' })
        })
      }
    })
    expect(result.url).toBe('https://notes/#/n/note-1')
  })

  it('propagates execution errors', async () => {
    const fetchJSON = jest.fn().mockRejectedValue(new Error('403'))
    await expect(
      executeAction(makeClient(fetchJSON), 'create_note', {
        title: 't',
        content: 'c'
      })
    ).rejects.toThrow('403')
  })
})

describe('executeAction create_event', () => {
  let openSpy: jest.SpyInstance

  beforeEach(() => {
    openSpy = jest.spyOn(window, 'open').mockReturnValue(null)
  })

  afterEach(() => {
    openSpy.mockRestore()
  })

  it('opens the calendar app with prefill params', async () => {
    const result = await executeAction(makeClient(), 'create_event', {
      title: 'Sync',
      start: '2026-07-10T10:00:00',
      end: '',
      attendee: 'alice@example.com'
    })

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('claude-calendar'),
      '_blank',
      'noopener'
    )
    // empty params are not forwarded
    expect(result.url).not.toContain('end=')
    expect(result.url).toContain('title=Sync')
    expect(result.url).toContain('attendee=alice%40example.com')
  })
})
