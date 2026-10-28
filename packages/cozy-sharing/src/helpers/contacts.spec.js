import flag from 'cozy-flags'

import {
  computeContactsAndGroups,
  getOrCreateFromArray,
  suggestContacts
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

  it('should keep a contact without email by id, and drop a recipient with neither', async () => {
    const cozyOnlyContact = {
      _id: 'contact-1',
      _type: 'io.cozy.contacts',
      cozy: [{ url: 'https://bob.example' }]
    }

    const recipients = await getOrCreateFromArray(
      mockClient,
      [cozyOnlyContact, { instance: 'https://alice.example' }],
      jest.fn(),
      true
    )

    expect(recipients).toEqual([cozyOnlyContact, undefined])
  })
})

describe('suggestContacts', () => {
  it('should map the suggestions of the stack to contacts', async () => {
    const fetchJSON = jest.fn().mockResolvedValue({
      data: [
        {
          type: 'io.cozy.contacts',
          id: 'org-member-1',
          attributes: {
            fullname: 'Jean Dupont',
            name: { givenName: 'Jean', familyName: 'Dupont' },
            email: [{ address: 'jean@org.example', primary: true }]
          },
          meta: { kind: 'member' }
        },
        {
          type: 'io.cozy.contacts',
          attributes: {
            fullname: 'Paul Dupuis',
            email: [{ address: 'paul@friends.example', primary: true }]
          }
        }
      ]
    })
    const client = { getStackClient: () => ({ fetchJSON }) }

    const contacts = await suggestContacts(client, 'dup & co')

    expect(fetchJSON).toHaveBeenCalledWith(
      'GET',
      '/contacts/suggest?q=dup%20%26%20co'
    )
    expect(contacts).toEqual([
      {
        _id: 'org-member-1',
        id: 'org-member-1',
        _type: 'io.cozy.contacts',
        fullname: 'Jean Dupont',
        name: { givenName: 'Jean', familyName: 'Dupont' },
        email: [{ address: 'jean@org.example', primary: true }]
      },
      {
        _type: 'io.cozy.contacts',
        fullname: 'Paul Dupuis',
        displayName: 'Paul Dupuis',
        email: [{ address: 'paul@friends.example', primary: true }]
      }
    ])
  })
})
