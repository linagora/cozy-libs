import React from 'react'

import PublicAccess from './PublicAccess'
import SharingContext from '../../context'

const READ_ONLY = { files: { verbs: ['GET'] } }
const WRITE = { files: { verbs: ['GET', 'POST', 'PUT', 'PATCH'] } }

const makePermissions = ({ permissions = READ_ONLY, ...attributes } = {}) => [
  { attributes: { permissions, ...attributes } }
]

const meta = {
  component: PublicAccess,
  decorators: [
    Story => (
      <SharingContext.Provider
        value={{
          documentType: 'Files',
          getDocumentPermissions: () => [],
          getSharingLink: () => null,
          hasWriteAccess: () => true,
          shareByLink: async () => null
        }}
      >
        <Story />
      </SharingContext.Provider>
    )
  ],
  args: {
    document: { _id: 'file-1', name: 'report.pdf' },
    documentType: 'Files',
    link: null,
    permissions: [],
    onUpdateLinkPermissions: () => {},
    onRevokeLink: () => {}
  }
}

export default meta

export const Restricted = {}

export const Viewer = {
  args: { link: 'https://link', permissions: makePermissions() }
}

export const Editor = {
  args: {
    link: 'https://link',
    permissions: makePermissions({ permissions: WRITE })
  }
}

export const PasswordAndExpiration = {
  args: {
    link: 'https://link',
    permissions: makePermissions({
      password: true,
      expires_at: '2026-12-24T00:00:00Z'
    })
  }
}
