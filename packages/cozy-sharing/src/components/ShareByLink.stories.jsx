import React from 'react'

import { CozyProvider, createFakeClient } from 'cozy-client'

import ShareByLink from './ShareByLink'
import SharingContext from '../context'

const makeClient = apps =>
  createFakeClient({
    queries: {
      'io.cozy.apps': {
        doctype: 'io.cozy.apps',
        definition: { doctype: 'io.cozy.apps' },
        data: apps
      }
    },
    clientOptions: { uri: 'http://alice.cozy.localhost:8080' }
  })

const INSTALLED_APPS = [
  {
    _id: 'io.cozy.apps/mail',
    slug: 'mail',
    links: { related: 'http://alice-mail.cozy.localhost:8080/' }
  },
  {
    _id: 'io.cozy.apps/chat',
    slug: 'chat',
    links: { related: 'http://alice-chat.cozy.localhost:8080/' }
  }
]

const meta = {
  component: ShareByLink,
  decorators: [
    (Story, { parameters }) => (
      <CozyProvider client={makeClient(parameters.apps)}>
        <SharingContext.Provider
          value={{
            shareByLink: async () => null,
            getDocumentPermissions: () => [],
            getSharingLink: () => null
          }}
        >
          <Story />
        </SharingContext.Provider>
      </CozyProvider>
    )
  ],
  parameters: { apps: INSTALLED_APPS },
  args: {
    link: 'http://alice-drive.cozy.localhost:8080/public?sharecode=abc',
    document: { _id: 'file-1', name: 'report.pdf' },
    documentType: 'Files'
  }
}

export default meta

export const WithMailAndChat = {}

export const WithoutApps = {
  parameters: { apps: [] }
}
