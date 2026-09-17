import flag from 'cozy-flags'

import {
  autoprovisionAssistants,
  resetAutoprovisionForTests
} from './autoprovision'
import { ensureProvisionedAssistants } from './provisioning'
import { setupRagIndexing } from './ragIndexing'

jest.mock('cozy-flags', () => jest.fn())
jest.mock('./provisioning', () => ({
  AUTOPROVISION_FLAG: 'cozy.assistant.autoprovision',
  ensureProvisionedAssistants: jest.fn()
}))
jest.mock('./ragIndexing', () => ({ setupRagIndexing: jest.fn() }))

const client = { id: 'client' }
const entries = [{ name: 'Docs', dirName: 'Docs' }]
let warnSpy

describe('autoprovisionAssistants', () => {
  beforeEach(() => {
    resetAutoprovisionForTests()
    flag.mockReset()

    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
    setupRagIndexing
      .mockReset()
      .mockResolvedValue({ triggers: [], migrated: [], errors: [] })
    ensureProvisionedAssistants
      .mockReset()
      .mockResolvedValue({ created: ['docs'], ensured: [], skipped: [] })
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('does nothing without flag entries', async () => {
    flag.mockReturnValue(null)
    await expect(autoprovisionAssistants(client)).resolves.toBeNull()
    expect(flag).toHaveBeenCalledWith('cozy.assistant.autoprovision')
    expect(setupRagIndexing).not.toHaveBeenCalled()
    expect(ensureProvisionedAssistants).not.toHaveBeenCalled()
  })

  it('sets up the indexing, then provisions the flag entries', async () => {
    flag.mockReturnValue(entries)
    const result = await autoprovisionAssistants(client)

    expect(setupRagIndexing).toHaveBeenCalledWith(client)
    expect(ensureProvisionedAssistants).toHaveBeenCalledWith(client, entries)
    expect(setupRagIndexing.mock.invocationCallOrder[0]).toBeLessThan(
      ensureProvisionedAssistants.mock.invocationCallOrder[0]
    )
    expect(result).toEqual({
      setup: { triggers: [], migrated: [], errors: [] },
      created: ['docs'],
      ensured: [],
      skipped: []
    })
  })

  it('runs once per session, sharing the promise', async () => {
    flag.mockReturnValue(entries)
    const first = autoprovisionAssistants(client)
    const second = autoprovisionAssistants(client)
    expect(second).toBe(first)
    await first
    await autoprovisionAssistants(client)

    expect(setupRagIndexing).toHaveBeenCalledTimes(1)
    expect(ensureProvisionedAssistants).toHaveBeenCalledTimes(1)
  })

  it('still provisions when the setup reported errors', async () => {
    flag.mockReturnValue(entries)
    setupRagIndexing.mockResolvedValue({
      triggers: [],
      migrated: [],
      errors: [new Error('forbidden')]
    })
    const result = await autoprovisionAssistants(client)

    expect(ensureProvisionedAssistants).toHaveBeenCalledTimes(1)
    expect(result.setup.errors).toHaveLength(1)
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
    setupRagIndexing.mockRejectedValue(new Error('boom'))
    await expect(autoprovisionAssistants(client)).resolves.toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(
      'cozy-search autoprovision:',
      'failed',
      expect.any(Error)
    )
  })
})
