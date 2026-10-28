import flag from 'cozy-flags'

import {
  computeContactsAndGroups,
  getOrCreateFromArray,
  fetchSuggestedContacts,
  hasContactSuggestions
} from './contacts'

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
    suggest: jest.fn(),
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
  it('still resolves local contacts with an older client', async () => {
    const contact = { id: 'local', email: 'alice@example.org' }
    const find = jest.fn().mockResolvedValue({ data: [contact] })
    const createContact = jest.fn()

    expect(
      await getOrCreateFromArray(
        { collection: () => ({ find }) },
        [{ email: 'alice@example.org' }],
        createContact,
        true
      )
    ).toEqual([contact])
    expect(find).toHaveBeenCalled()
    expect(createContact).not.toHaveBeenCalled()
  })

  it('keeps organization suggestions for the sharing serializer without creating contacts', async () => {
    const createContact = jest.fn()
    const group = { _id: 'group-1', _type: 'io.cozy.contacts.groups' }

    const recipients = await getOrCreateFromArray(
      mockClient,
      [
        {
          _id: 'org-member-1',
          _type: 'io.cozy.contacts',
          email: [{ address: 'member@org.example', primary: true }],
          meta: { kind: 'org_member' }
        },
        { email: 'unknown@friends.example' },
        group
      ],
      createContact,
      true
    )

    expect(recipients).toEqual([
      {
        _id: 'org-member-1',
        _type: 'io.cozy.contacts',
        email: [{ address: 'member@org.example', primary: true }],
        meta: { kind: 'org_member' }
      },
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

  it('lets the serializer choose a usable address for organization members', async () => {
    const contact = {
      _id: 'org-member',
      _type: 'io.cozy.contacts',
      meta: { kind: 'org_member' },
      email: [null, { address: '' }, { address: 'alice@example.org' }]
    }
    expect(
      await getOrCreateFromArray(mockClient, [contact], jest.fn(), true)
    ).toEqual([contact])
  })
})

describe('hasContactSuggestions', () => {
  it('checks the transport API available on the client', () => {
    expect(hasContactSuggestions(mockClient)).toBe(true)
    expect(hasContactSuggestions({ collection: () => ({}) })).toBe(false)
  })
})

describe('fetchSuggestedContacts', () => {
  const group = id => ({ _type: 'io.cozy.contacts.groups', _id: id })
  const contact = email => ({
    _type: 'io.cozy.contacts',
    email: [{ address: email }]
  })
  const setup = suggestions => ({
    collection: jest.fn().mockReturnValue({
      suggest: jest.fn().mockResolvedValue({ data: suggestions })
    }),
    query: jest.fn(),
    fetchQueryAndGetFromState: jest.fn()
  })

  beforeEach(() => {
    flag.mockImplementation(name => name === 'sharing.show-recipient-groups')
  })

  it('returns server order and ID-less people without using the query cache', async () => {
    const suggestions = [group('team'), contact('alice@example.org')]
    const client = setup(suggestions)

    expect(
      await fetchSuggestedContacts({
        client,
        query: 'al & co',
        currentRecipients: [],
        pendingRecipients: []
      })
    ).toEqual(suggestions)
    expect(client.collection).toHaveBeenCalledWith('io.cozy.contacts')
    expect(client.collection().suggest).toHaveBeenCalledWith('al & co')
    expect(client.query).not.toHaveBeenCalled()
    expect(client.fetchQueryAndGetFromState).not.toHaveBeenCalled()
  })

  it('excludes self, people by normalized email, and groups by ID without changing server order', async () => {
    const suggestions = [
      group('selected'),
      group('shared'),
      group('available'),
      { ...contact('me@example.org'), me: true },
      contact(' CURRENT@example.org '),
      contact('pending@example.org'),
      contact('new@example.org')
    ]

    expect(
      await fetchSuggestedContacts({
        client: setup(suggestions),
        query: 'ex',
        currentRecipients: [
          { email: 'current@EXAMPLE.org' },
          { id: 'shared', groupIndex: 0 }
        ],
        pendingRecipients: [group('selected'), { email: 'PENDING@example.org' }]
      })
    ).toEqual([group('available'), contact('new@example.org')])
  })

  it('excludes API groups when sharing groups is disabled', async () => {
    flag.mockReturnValue(false)
    const person = contact('alice@example.org')

    expect(
      await fetchSuggestedContacts({
        client: setup([group('team'), person]),
        query: 'al',
        currentRecipients: [],
        pendingRecipients: []
      })
    ).toEqual([person])
  })

  it('propagates a failed search', async () => {
    const error = Object.assign(new Error('Forbidden'), { status: 403 })
    const client = {
      collection: () => ({ suggest: jest.fn().mockRejectedValue(error) })
    }
    await expect(
      fetchSuggestedContacts({
        client,
        query: 'al',
        currentRecipients: [],
        pendingRecipients: []
      })
    ).rejects.toBe(error)
  })
})
