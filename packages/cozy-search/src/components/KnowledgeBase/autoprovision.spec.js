import flag from 'cozy-flags'

import {
  autoprovisionAssistants,
  autoprovisionEntries,
  ensureRagIndexTriggers,
  resetAutoprovisionForTests
} from './autoprovision'
import { ensureProvisionedAssistants } from './provisioning'
import {
  createRagIndexTriggers,
  fetchAssistants,
  migrateAssistantsWithoutFolder
} from './ragIndexing'

jest.mock('cozy-flags', () => jest.fn())
jest.mock('./provisioning', () => ({
  AUTOPROVISION_FLAG: 'cozy.assistant.autoprovision',
  ensureProvisionedAssistants: jest.fn()
}))
jest.mock('./ragIndexing', () => ({
  createRagIndexTriggers: jest.fn(),
  fetchAssistants: jest.fn(),
  migrateAssistantsWithoutFolder: jest.fn()
}))

const client = { id: 'client' }
const entries = [{ name: 'Docs', dirName: 'Docs' }]
const assistants = [{ _id: 'legacy' }]
let warnSpy

beforeEach(() => {
  resetAutoprovisionForTests()
  flag.mockReset()
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
  createRagIndexTriggers.mockReset().mockResolvedValue(['io.cozy.files'])
  fetchAssistants.mockReset().mockResolvedValue(assistants)
  migrateAssistantsWithoutFolder.mockReset().mockResolvedValue([])
  ensureProvisionedAssistants
    .mockReset()
    .mockResolvedValue({ created: ['docs'], ensured: [], skipped: [] })
})

afterEach(() => {
  warnSpy.mockRestore()
})

describe('autoprovisionEntries', () => {
  it('returns the flag entries', () => {
    flag.mockReturnValue(entries)
    expect(autoprovisionEntries()).toBe(entries)
    expect(flag).toHaveBeenCalledWith('cozy.assistant.autoprovision')
  })

  it.each([null, undefined, [], 'docs', {}])('returns null for %p', value => {
    flag.mockReturnValue(value)
    expect(autoprovisionEntries()).toBeNull()
  })
})

describe('ensureRagIndexTriggers', () => {
  it('creates the missing triggers once per session', async () => {
    const first = ensureRagIndexTriggers(client)
    expect(ensureRagIndexTriggers(client)).toBe(first)
    await expect(first).resolves.toEqual({
      triggers: ['io.cozy.files'],
      error: null
    })
    await ensureRagIndexTriggers(client)

    expect(createRagIndexTriggers).toHaveBeenCalledTimes(1)
    expect(createRagIndexTriggers).toHaveBeenCalledWith(client)
  })

  it('reports a failure without rejecting', async () => {
    const error = new Error('forbidden')
    createRagIndexTriggers.mockRejectedValue(error)
    await expect(ensureRagIndexTriggers(client)).resolves.toEqual({
      triggers: [],
      error
    })
    expect(warnSpy).toHaveBeenCalledWith(
      'cozy-search autoprovision:',
      'cannot set up the rag-index triggers',
      error
    )
  })
})

describe('autoprovisionAssistants', () => {
  it('does nothing without flag entries', async () => {
    flag.mockReturnValue(null)
    await expect(autoprovisionAssistants(client)).resolves.toBeNull()
    expect(createRagIndexTriggers).not.toHaveBeenCalled()
    expect(fetchAssistants).not.toHaveBeenCalled()
    expect(migrateAssistantsWithoutFolder).not.toHaveBeenCalled()
    expect(ensureProvisionedAssistants).not.toHaveBeenCalled()
  })

  it('lets the provisioning query the assistants when listing them failed', async () => {
    flag.mockReturnValue(entries)
    fetchAssistants.mockRejectedValue(new Error('nope'))
    const result = await autoprovisionAssistants(client)

    expect(migrateAssistantsWithoutFolder).not.toHaveBeenCalled()
    expect(ensureProvisionedAssistants).toHaveBeenCalledWith(client, entries, {
      assistants: null
    })
    expect(result.setup.errors.map(e => e.message)).toEqual(['nope'])
  })

  it('ensures the triggers, migrates, then provisions the flag entries', async () => {
    flag.mockReturnValue(entries)
    migrateAssistantsWithoutFolder.mockResolvedValue(['legacy'])
    const result = await autoprovisionAssistants(client)

    expect(createRagIndexTriggers).toHaveBeenCalledWith(client)
    expect(fetchAssistants).toHaveBeenCalledTimes(1)
    expect(migrateAssistantsWithoutFolder).toHaveBeenCalledWith(
      client,
      assistants
    )
    expect(ensureProvisionedAssistants).toHaveBeenCalledWith(client, entries, {
      assistants
    })
    const order = [
      createRagIndexTriggers,
      migrateAssistantsWithoutFolder,
      ensureProvisionedAssistants
    ].map(fn => fn.mock.invocationCallOrder[0])
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(result).toEqual({
      setup: { triggers: ['io.cozy.files'], migrated: ['legacy'], errors: [] },
      created: ['docs'],
      ensured: [],
      skipped: []
    })
  })

  it('runs once per session, sharing the promise', async () => {
    flag.mockReturnValue(entries)
    const first = autoprovisionAssistants(client)
    expect(autoprovisionAssistants(client)).toBe(first)
    await first
    await autoprovisionAssistants(client)

    expect(createRagIndexTriggers).toHaveBeenCalledTimes(1)
    expect(ensureProvisionedAssistants).toHaveBeenCalledTimes(1)
  })

  it('shares the triggers step with ensureRagIndexTriggers', async () => {
    flag.mockReturnValue(entries)
    await ensureRagIndexTriggers(client)
    await autoprovisionAssistants(client)

    expect(createRagIndexTriggers).toHaveBeenCalledTimes(1)
    expect(ensureProvisionedAssistants).toHaveBeenCalledTimes(1)
  })

  it('still provisions when the setup steps failed', async () => {
    flag.mockReturnValue(entries)
    createRagIndexTriggers.mockRejectedValue(new Error('forbidden'))
    migrateAssistantsWithoutFolder.mockRejectedValue(new Error('nope'))
    const result = await autoprovisionAssistants(client)

    expect(ensureProvisionedAssistants).toHaveBeenCalledTimes(1)
    expect(result.setup.errors.map(e => e.message)).toEqual([
      'forbidden',
      'nope'
    ])
  })

  it('logs the skipped entries', async () => {
    flag.mockReturnValue(entries)
    ensureProvisionedAssistants.mockResolvedValue({
      created: [],
      ensured: [],
      skipped: [{ id: 'docs', reason: 'nope' }]
    })
    await autoprovisionAssistants(client)

    expect(warnSpy).toHaveBeenCalledWith(
      'cozy-search autoprovision:',
      'skipped entries',
      [{ id: 'docs', reason: 'nope' }]
    )
  })

  it('never rejects', async () => {
    flag.mockReturnValue(entries)
    ensureProvisionedAssistants.mockRejectedValue(new Error('boom'))
    await expect(autoprovisionAssistants(client)).resolves.toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      'cozy-search autoprovision:',
      'failed',
      expect.any(Error)
    )
  })
})
