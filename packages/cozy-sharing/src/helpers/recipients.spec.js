import { markCurrentUser } from './recipients'

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
