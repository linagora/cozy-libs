import {
  addAvatarUrls,
  hasMemberActions,
  makeAvatarUrl,
  markCurrentUser,
  getMemberStatusText
} from './recipients'

const instanceUri = 'https://alice.cozy.cc'

describe('markCurrentUser', () => {
  it('flags the recipient whose instance is the current one', () => {
    const recipients = [
      { email: 'alice@cozy.cc', instance: instanceUri },
      { email: 'bob@cozy.cc', instance: 'https://bob.cozy.cc' },
      { email: 'carol@cozy.cc' }
    ]

    expect(
      markCurrentUser(recipients, instanceUri).map(r => r.isCurrentUser)
    ).toEqual([true, false, false])
  })

  it('does not flag a recipient without instance when the instance is unknown', () => {
    expect(markCurrentUser([{ email: 'carol@cozy.cc' }], undefined)).toEqual([
      { email: 'carol@cozy.cc', isCurrentUser: false }
    ])
  })

  it('flags the members of group recipients', () => {
    const recipients = [
      {
        name: 'Team',
        members: [
          { instance: 'https://bob.cozy.cc' },
          { instance: instanceUri }
        ]
      }
    ]

    const [group] = markCurrentUser(recipients, instanceUri)

    expect(group.isCurrentUser).toBe(false)
    expect(group.members.map(m => m.isCurrentUser)).toEqual([false, true])
  })
})

describe('hasMemberActions', () => {
  const ownerRights = {
    isOwner: true,
    canManageSharing: true,
    canManageMembers: true
  }
  const memberRights = {
    isOwner: false,
    canManageSharing: false,
    canManageMembers: true
  }

  it('gives actions on the members to whom can manage the sharing', () => {
    expect(hasMemberActions({ ...ownerRights, status: 'ready' })).toBe(true)
  })

  it('gives no action on the owner', () => {
    expect(hasMemberActions({ ...ownerRights, status: 'owner' })).toBe(false)
  })

  it('gives no action when the members cannot be managed', () => {
    expect(
      hasMemberActions({
        ...ownerRights,
        canManageMembers: false,
        status: 'ready'
      })
    ).toBe(false)
  })

  it('gives actions on themselves to a member who cannot manage the sharing', () => {
    expect(
      hasMemberActions({
        ...memberRights,
        status: 'ready',
        isCurrentUser: true
      })
    ).toBe(true)
    expect(hasMemberActions({ ...memberRights, status: 'ready' })).toBe(false)
  })
})

describe('makeAvatarUrl', () => {
  const instanceUri = 'http://cozy.example.com'

  it('prefixes the avatarPath with the instance URI and the status', () => {
    expect(
      makeAvatarUrl(
        { status: 'owner', avatarPath: '/sharings/123/recipients/0/avatar' },
        instanceUri
      )
    ).toBe('http://cozy.example.com/sharings/123/recipients/0/avatar?v=owner')
  })

  it('appends the status with & when avatarPath already has a query string', () => {
    expect(
      makeAvatarUrl(
        { status: 'owner', avatarPath: '/public/avatar?fallback=initials' },
        instanceUri
      )
    ).toBe('http://cozy.example.com/public/avatar?fallback=initials&v=owner')
  })

  it('does not prefix a full URL avatarPath with the instance URI', () => {
    expect(
      makeAvatarUrl(
        {
          status: 'contact',
          avatarPath:
            'https://jonsnow.mycozy.cloud/public/avatar?fallback=initials'
        },
        instanceUri
      )
    ).toBe(
      'https://jonsnow.mycozy.cloud/public/avatar?fallback=initials&v=contact'
    )
  })

  it('points to the public avatar of the contact cozy when there is no avatarPath', () => {
    expect(
      makeAvatarUrl(
        {
          _type: 'io.cozy.contacts',
          cozy: [{ url: 'https://jonsnow.mycozy.cloud' }]
        },
        instanceUri
      )
    ).toBe(
      'https://jonsnow.mycozy.cloud/public/avatar?fallback=initials&v=contact'
    )
  })

  it('returns null when there is no avatarPath and no cozy URL', () => {
    expect(
      makeAvatarUrl(
        { _type: 'io.cozy.contacts', public_name: 'Bob' },
        instanceUri
      )
    ).toBe(null)
  })
})

describe('addAvatarUrls', () => {
  it('adds the avatar URL to the members but not to the groups', () => {
    const [member, group] = addAvatarUrls(
      [
        { status: 'ready', avatarPath: '/sharings/123/recipients/1/avatar' },
        { name: 'Team', members: [] }
      ],
      'http://cozy.example.com'
    )

    expect(member.avatarUrl).toBe(
      'http://cozy.example.com/sharings/123/recipients/1/avatar?v=ready'
    )
    expect(group).not.toHaveProperty('avatarUrl')
  })
})

describe('getMemberStatusText', () => {
  const t = key => key

  it('shows the email of a member who joined, when they have a name', () => {
    expect(
      getMemberStatusText({
        t,
        status: 'ready',
        isMe: false,
        email: 'other@example.com',
        instance: 'foo.mycozy.cloud',
        name: 'Other Person'
      })
    ).toBe('other@example.com')
  })

  it('shows nothing when the name already falls back to the email', () => {
    expect(
      getMemberStatusText({
        t,
        status: 'ready',
        isMe: false,
        email: 'other@example.com',
        instance: 'foo.mycozy.cloud'
      })
    ).toBe('')
  })

  it('shows the email of the current user whatever their status', () => {
    expect(
      getMemberStatusText({
        t,
        status: 'pending',
        isMe: true,
        email: 'me@example.com'
      })
    ).toBe('me@example.com')
  })

  it('shows the instance when there is no email', () => {
    expect(
      getMemberStatusText({
        t,
        status: 'ready',
        isMe: false,
        instance: 'foo.mycozy.cloud'
      })
    ).toBe('foo.mycozy.cloud')
  })

  it('shows nothing for the owner of an organization shared drive', () => {
    expect(
      getMemberStatusText({
        t,
        status: 'owner',
        isMe: false,
        email: 'org@example.com',
        name: 'Org Owner',
        isOrgSharedDrive: true
      })
    ).toBe('')
  })

  it('shows the state of the invitation', () => {
    expect(
      getMemberStatusText({ t, status: 'mail-not-sent', isMe: false })
    ).toBe('Share.status.mail-not-sent')
    expect(getMemberStatusText({ t, status: 'seen', isMe: false })).toBe(
      'Share.status.seen'
    )
    expect(getMemberStatusText({ t, status: 'unknown', isMe: false })).toBe(
      'Share.status.pending'
    )
  })
})
