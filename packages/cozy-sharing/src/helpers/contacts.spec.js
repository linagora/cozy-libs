import flag from 'cozy-flags'

import {
  computeContactsAndGroups,
  getOrCreateFromArray,
  fetchContactSuggestions,
  filterContactSuggestions
} from './contacts'

jest.mock('../queries/queries', () => ({
  ...jest.requireActual('../queries/queries'),
  supportsContactSuggestions: true
}))

jest.mock('cozy-flags', () => ({
  __esModule: true,
  default: jest.fn(() => null)
}))

const findMock = jest
  .fn()
  .mockReturnValueOnce({
    data: [
      {
        id: 2,
        email: 'exists@cozycloud.cc'
      }
    ]
  })
  .mockReturnValueOnce({ data: [] })

const mockClient = {
  collection: () => ({
    find: findMock
  }),
  create: jest.fn().mockReturnValue({
    data: {
      id: 3,
      email: 'doesntexist@cozycloud.cc'
    }
  })
}
describe('getOrCreateFromArray', () => {
  it('test getOrCreateFromArray', async () => {
    const wantedContacts = [
      {
        id: 1,
        email: '1@cozycloud.cc'
      },
      {
        email: 'exists@cozycloud.cc'
      },
      {
        email: 'doesntexist@cozycloud.cc'
      }
    ]
    const createContacts = contact =>
      mockClient.create('io.cozy.contact', contact)
    const contacts = await getOrCreateFromArray(
      mockClient,
      wantedContacts,
      createContacts
    )
    expect(contacts).toEqual([
      { id: 1, email: '1@cozycloud.cc' },
      { id: 2, email: 'exists@cozycloud.cc' },
      { id: 3, email: 'doesntexist@cozycloud.cc' }
    ])
  })
})

describe('computeContactsAndGroups', () => {
  const group = { id: 'friends', _id: 'friends', name: 'Friends' }
  const inGroup = { relationships: { groups: { data: [{ _id: 'friends' }] } } }
  const alice = {
    _id: 'alice',
    email: [{ address: 'alice@cozy.cc', primary: true }],
    ...inGroup
  }
  const bob = { _id: 'bob', email: [{ address: 'bob@cozy.cc' }], ...inGroup }
  const me = { _id: 'me', me: true, ...inGroup }
  const carol = { _id: 'carol', ...inGroup }

  const setup = ({
    currentRecipients = [],
    pendingRecipients = [],
    showRecipientGroups = null
  } = {}) => {
    flag.mockReturnValue(showRecipientGroups)
    return computeContactsAndGroups({
      reachableContacts: [alice, bob, me],
      unreachableContactsWithGroups: [carol, me],
      contactGroups: [group],
      currentRecipients,
      pendingRecipients
    })
  }

  it('suggests the contacts, then the groups with their reachable members', () => {
    const [first, second, friends] = setup()

    expect([first._id, second._id, friends._id]).toEqual([
      'alice',
      'bob',
      'friends'
    ])
    expect(friends.members.map(m => [m._id, m.isReachable])).toEqual([
      ['alice', true],
      ['bob', true]
    ])
  })

  it('does not suggest the recipients already shared with or picked', () => {
    const contactsAndGroups = setup({
      currentRecipients: [{ email: 'alice@cozy.cc' }],
      pendingRecipients: [bob]
    })

    expect(contactsAndGroups.map(c => c._id)).toEqual(['friends'])
  })

  it('adds the unreachable members when flag sharing.show-recipient-groups is enabled', () => {
    const [, , friends] = setup({ showRecipientGroups: true })

    expect(friends.members.map(m => [m._id, m.isReachable])).toEqual([
      ['alice', true],
      ['bob', true],
      ['carol', false]
    ])
  })

  it('does not suggest the groups already in the sharing when flag sharing.show-recipient-groups is enabled', () => {
    const contactsAndGroups = setup({
      currentRecipients: [{ id: 'friends' }],
      showRecipientGroups: true
    })

    expect(contactsAndGroups.map(c => c._id)).toEqual(['alice', 'bob'])
  })
})

describe('getOrCreateFromArray with contactsSuggestEnabled', () => {
  it('should send people by email and keep groups, without creating contacts', async () => {
    const createContact = jest.fn()
    const group = { _id: 'group-1', _type: 'io.cozy.contacts.groups' }

    const recipients = await getOrCreateFromArray(
      mockClient,
      [
        {
          _id: 'org-member-1',
          _type: 'io.cozy.contacts',
          email: [{ address: 'member@org.example', primary: true }],
          meta: { kind: 'member' }
        },
        { email: 'unknown@friends.example' },
        group
      ],
      createContact,
      true
    )

    expect(recipients).toEqual([
      { _type: 'io.cozy.contacts', email: 'member@org.example' },
      { _type: 'io.cozy.contacts', email: 'unknown@friends.example' },
      group
    ])
    expect(createContact).not.toHaveBeenCalled()
  })

  it('keeps known local contacts by ID', async () => {
    const contact = {
      _id: 'local',
      _type: 'io.cozy.contacts',
      meta: { kind: 'contact' },
      email: [{ address: 'local@example.org' }]
    }
    expect(
      await getOrCreateFromArray(mockClient, [contact], jest.fn(), true)
    ).toEqual([contact])
  })

  it('rejects a recipient with neither an ID nor an email', async () => {
    await expect(
      getOrCreateFromArray(mockClient, [{}], jest.fn(), true)
    ).rejects.toThrow('requires')
  })
})

describe('fetchContactSuggestions', () => {
  it('uses the query cache without replacing absent contact IDs', async () => {
    const suggestions = [
      {
        _type: 'io.cozy.contacts',
        fullname: 'Alice',
        email: [{ address: 'alice@example.org' }]
      }
    ]
    const client = {
      fetchQueryAndGetFromState: jest
        .fn()
        .mockResolvedValue({ data: { suggestions } })
    }
    expect(await fetchContactSuggestions(client, '  al & co ')).toEqual(
      suggestions
    )
    expect(client.fetchQueryAndGetFromState).toHaveBeenCalledWith({
      definition: expect.objectContaining({
        doctype: 'io.cozy.contacts.suggestions',
        selector: { q: 'al & co', limit: 20 }
      }),
      options: expect.objectContaining({
        as: 'io.cozy.contacts.suggestions/q/al%20%26%20co/limit/20',
        singleDocData: true,
        fetchPolicy: expect.any(Function)
      })
    })
  })

  it('does not interpret a cached failed search as empty results', async () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 })
    const client = {
      fetchQueryAndGetFromState: jest
        .fn()
        .mockResolvedValue({ fetchStatus: 'failed', lastError: error })
    }
    await expect(fetchContactSuggestions(client, 'al')).rejects.toBe(error)
  })
})

describe('filterContactSuggestions', () => {
  it('excludes people by normalized email and groups by ID without changing server order', () => {
    const group = id => ({ _type: 'io.cozy.contacts.groups', _id: id })
    const contact = email => ({
      _type: 'io.cozy.contacts',
      email: [{ address: email }]
    })
    const suggestions = [
      group('selected'),
      group('shared'),
      group('available'),
      contact(' CURRENT@example.org '),
      contact('pending@example.org'),
      contact('new@example.org')
    ]
    expect(
      filterContactSuggestions(
        suggestions,
        [{ email: 'current@EXAMPLE.org' }, { id: 'shared', groupIndex: 0 }],
        [group('selected'), { email: 'PENDING@example.org' }]
      )
    ).toEqual([group('available'), contact('new@example.org')])
  })
})
