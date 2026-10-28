import { isDowngradeConfirmationNeeded } from './permissions'

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
