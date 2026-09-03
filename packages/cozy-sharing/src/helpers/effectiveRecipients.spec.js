import { mapEffectiveRecipients } from './effectiveRecipients'

const makeAncestorSource = (rootName = 'Parent Folder') => ({
  sharing_id: 'sharing-1',
  root_id: 'root-1',
  root_name: rootName,
  kind: 'ancestor',
  member_index: 1,
  read_only: false,
  manageable: false
})

const makeSelfSource = (opts = {}) => ({
  sharing_id: opts.sharing_id || 'sharing-2',
  root_id: 'root-2',
  root_name: 'Child Folder',
  kind: 'self',
  member_index: opts.memberIndex ?? 1,
  read_only: opts.readOnly ?? false,
  manageable: opts.manageable ?? true
})

const makeRecipient = (overrides = {}) => ({
  id: 'recip-1',
  name: 'Alice',
  email: 'alice@example.com',
  instance: 'https://alice.mycozy.cloud',
  status: 'ready',
  read_only: false,
  can_edit_here: false,
  sources: overrides.sources || [],
  ...overrides
})

describe('mapEffectiveRecipients', () => {
  it('returns empty array for empty input', () => {
    expect(mapEffectiveRecipients([])).toEqual([])
  })

  it('returns empty array for null or undefined', () => {
    expect(mapEffectiveRecipients(null)).toEqual([])
    expect(mapEffectiveRecipients(undefined)).toEqual([])
  })

  it('maps a recipient with a self source using the self source', () => {
    const recipient = makeRecipient({
      sources: [makeSelfSource()]
    })
    const result = mapEffectiveRecipients([recipient])

    expect(result).toHaveLength(1)
    expect(result[0].sharingId).toBe('sharing-2')
    expect(result[0].memberIndex).toBe(1)
    expect(result[0].avatarPath).toBe('/sharings/sharing-2/recipients/1/avatar')
    expect(result[0].type).toBe('two-way')
  })

  it('maps a recipient with only ancestor sources using the ancestor source', () => {
    const recipient = makeRecipient({
      sources: [makeAncestorSource('Shared Parent')]
    })
    const result = mapEffectiveRecipients([recipient])

    expect(result).toHaveLength(1)
    expect(result[0].sharingId).toBe('sharing-1')
    expect(result[0].memberIndex).toBe(1)
    expect(result[0].name).toBe('Alice')
    expect(result[0].email).toBe('alice@example.com')
  })

  it('maps an owner (self source, index 0) correctly', () => {
    const recipient = makeRecipient({
      status: 'owner',
      read_only: true,
      sources: [makeSelfSource({ memberIndex: 0, manageable: false })]
    })
    const result = mapEffectiveRecipients([recipient])

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('owner')
    expect(result[0].type).toBe('one-way')
  })

  it('maps an owner with only ancestor sources correctly', () => {
    const recipient = makeRecipient({
      status: 'owner',
      sources: [makeAncestorSource('Parent Folder')]
    })
    const result = mapEffectiveRecipients([recipient])

    expect(result).toHaveLength(1)
    expect(result[0].status).toBe('owner')
    expect(result[0].sharingId).toBe('sharing-1')
    expect(result[0].memberIndex).toBe(1)
  })

  it('sets type to one-way for read_only recipients', () => {
    const recipient = makeRecipient({
      read_only: true,
      sources: [makeSelfSource({ readOnly: true })]
    })
    const result = mapEffectiveRecipients([recipient])
    expect(result[0].type).toBe('one-way')
  })

  it('handles all recipients in the same array regardless of source kind', () => {
    const selfRecipient = makeRecipient({
      id: 'self-1',
      name: 'Bob',
      email: 'bob@example.com',
      sources: [makeSelfSource()]
    })
    const ancestorRecipient = makeRecipient({
      id: 'ancestor-1',
      name: 'Carol',
      email: 'carol@example.com',
      sources: [makeAncestorSource('Root Folder')]
    })
    const result = mapEffectiveRecipients([selfRecipient, ancestorRecipient])

    expect(result).toHaveLength(2)
    expect(result[0].sharingId).toBe('sharing-2')
    expect(result[1].sharingId).toBe('sharing-1')
  })
})
