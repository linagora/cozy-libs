import { hasMemberActions, markCurrentUser } from './recipients'

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
