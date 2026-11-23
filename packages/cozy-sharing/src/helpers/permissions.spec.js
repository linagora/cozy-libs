import {
  checkCanDownloadActivityReport,
  checkIsReadOnlyPermissions,
  isDowngradeConfirmationNeeded
} from './permissions'

describe('checkCanDownloadActivityReport', () => {
  const eligibleLink = {
    file: {},
    permissions: [
      {
        id: 'permission-id',
        attributes: {
          permissions: {
            files: {
              type: 'io.cozy.files',
              verbs: ['GET'],
              values: ['file-id']
            }
          }
        }
      }
    ],
    hasSharingLink: true
  }

  it('allows a public file link', () => {
    expect(checkCanDownloadActivityReport(eligibleLink)).toBe(true)
  })

  it.each([
    ['without a public link', { hasSharingLink: false }],
    ['without a permission ID', { permissions: [] }],
    [
      'with an apps rule',
      {
        permissions: [
          {
            ...eligibleLink.permissions[0],
            attributes: {
              permissions: {
                ...eligibleLink.permissions[0].attributes.permissions,
                readApps: { type: 'io.cozy.apps', verbs: ['GET'] }
              }
            }
          }
        ]
      }
    ],
    ['in a shared drive', { file: { driveId: 'drive-id' } }]
  ])('blocks downloading %s', (_label, overrides) => {
    expect(
      checkCanDownloadActivityReport({ ...eligibleLink, ...overrides })
    ).toBe(false)
  })
})

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
