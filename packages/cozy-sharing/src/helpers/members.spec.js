import { makeMemberRoles, makeMembers } from './members'

const t = (key, options) =>
  options?.memberCount ? `${key} ${options.memberCount}` : key

const params = {
  t,
  isOwner: true,
  canManageSharing: true,
  canManageMembers: true,
  onOpenGroup: jest.fn()
}

const owner = {
  index: 'sharing-1-member-0',
  status: 'owner',
  public_name: 'Alice',
  isCurrentUser: true,
  avatarUrl: 'http://alice.cozy.cc/avatar'
}
const bob = {
  index: 'sharing-1-member-1',
  status: 'ready',
  public_name: 'Bob',
  email: 'bob@cozy.cc',
  type: 'two-way',
  avatarUrl: 'http://bob.cozy.cc/avatar'
}
const team = {
  index: 'sharing-1-group-0',
  name: 'Team',
  color: 'red',
  read_only: true,
  members: [{ status: 'ready' }, { status: 'mail-not-sent' }]
}

describe('makeMemberRoles', () => {
  it('gives the viewer and editor roles', () => {
    expect(makeMemberRoles(t)).toEqual([
      { value: 'one-way', label: 'Share.type.one-way' },
      { value: 'two-way', label: 'Share.type.two-way' }
    ])
  })
})

describe('makeMembers', () => {
  it('puts the owner first and leaves it out of the recipients', () => {
    const [first, ...others] = makeMembers({
      ...params,
      owner,
      recipients: [owner, bob]
    })

    expect(first).toMatchObject({
      id: owner.index,
      name: 'Alice',
      isOwner: true,
      isCurrentUser: true,
      avatarUrl: owner.avatarUrl,
      initials: 'A',
      data: owner
    })
    expect(others.map(member => member.id)).toEqual([bob.index])
  })

  it('lets the owner of the sharing manage a member', () => {
    const [member] = makeMembers({ ...params, recipients: [bob] })

    expect(member).toMatchObject({
      id: bob.index,
      name: 'Bob',
      initials: 'B',
      role: 'two-way',
      canChangeRole: true,
      canRemove: true,
      isPending: false,
      data: bob
    })
  })

  it('identifies a recipient by its id rather than its sharing index', () => {
    const [member] = makeMembers({
      ...params,
      recipients: [{ ...bob, id: 'recipient-1' }]
    })

    expect(member.id).toBe('recipient-1')
  })

  it('does not let a member manage the others', () => {
    const [member] = makeMembers({
      ...params,
      isOwner: false,
      canManageSharing: false,
      recipients: [bob]
    })

    expect(member).toMatchObject({ canChangeRole: false, canRemove: false })
  })

  it('lets a member manage themselves', () => {
    const [member] = makeMembers({
      ...params,
      isOwner: false,
      canManageSharing: false,
      recipients: [{ ...bob, isCurrentUser: true }]
    })

    expect(member).toMatchObject({
      isCurrentUser: true,
      canChangeRole: true,
      canRemove: true
    })
  })

  it('flags the members being removed', () => {
    const [member] = makeMembers({
      ...params,
      recipients: [bob],
      pendingIds: [bob.index]
    })

    expect(member.isPending).toBe(true)
  })

  it('asks to verify a recipient waiting for confirmation', () => {
    const verifyRecipient = jest.fn()
    const confirmation = { email: 'bob@cozy.cc' }
    const [member] = makeMembers({
      ...params,
      recipients: [bob],
      recipientsToBeConfirmed: [confirmation],
      verifyRecipient
    })

    member.action.onClick()

    expect(member.action.label).toBe('Share.twoStepsConfirmation.verify')
    expect(verifyRecipient).toHaveBeenCalledWith(confirmation)
  })

  it('asks to verify each recipient without email with its own entry', () => {
    const verifyRecipient = jest.fn()
    const first = { id: 'a', email: '', index: 'key_r_a' }
    const second = { id: 'b', email: '', index: 'key_r_b' }
    const [, member] = makeMembers({
      ...params,
      recipients: [first, second],
      recipientsToBeConfirmed: [first, second],
      verifyRecipient
    })

    member.action.onClick()

    expect(verifyRecipient).toHaveBeenCalledWith(second)
  })

  it('makes a group with its role as text and its detail', () => {
    const onOpenGroup = jest.fn()
    const [group] = makeMembers({ ...params, recipients: [team], onOpenGroup })

    group.onClick()

    expect(group).toMatchObject({
      id: team.index,
      name: 'Team',
      subtitle: 'GroupRecipient.secondary 1/2',
      color: 'red',
      isGroup: true,
      role: 'one-way',
      roles: [{ value: 'one-way', label: 'Share.type.one-way' }],
      canChangeRole: false,
      canRemove: true
    })
    expect(onOpenGroup).toHaveBeenCalledWith(team)
  })

  it('shows the role of a group in a menu when asked', () => {
    const [group] = makeMembers({
      ...params,
      recipients: [team],
      isGroupRoleMenuShown: true
    })

    expect(group.canChangeRole).toBe(true)
  })
})
