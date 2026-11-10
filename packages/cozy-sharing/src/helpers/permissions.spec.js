import {
  checkIsReadOnlyPermissions,
  isDowngradeConfirmationNeeded
} from './permissions'

describe('checkIsReadOnlyPermissions', () => {
  it('ignores the rule letting the link read apps', () => {
    const permissions = [
      {
        attributes: {
          permissions: {
            rule0: { type: 'io.cozy.files', verbs: ['ALL'], values: ['id'] },
            apps: {
              type: 'io.cozy.apps',
              verbs: ['GET'],
              selector: 'slug',
              values: ['notes']
            }
          }
        }
      }
    ]

    expect(checkIsReadOnlyPermissions(permissions)).toBe(false)
  })
})

describe('isDowngradeConfirmationNeeded', () => {
  it('asks to confirm a downgrade to viewer inside a shared parent', () => {
    expect(
      isDowngradeConfirmationNeeded({
        currentType: 'two-way',
        newType: 'one-way',
        isInsideSharedParent: true
      })
    ).toBe(true)
  })

  it('does not ask outside a shared parent', () => {
    expect(
      isDowngradeConfirmationNeeded({
        currentType: 'two-way',
        newType: 'one-way',
        isInsideSharedParent: false
      })
    ).toBe(false)
  })

  it('does not ask for an upgrade to editor', () => {
    expect(
      isDowngradeConfirmationNeeded({
        currentType: 'one-way',
        newType: 'two-way',
        isInsideSharedParent: true
      })
    ).toBe(false)
  })
})
